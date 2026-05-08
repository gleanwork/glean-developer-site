import * as fs from 'node:fs';
import * as path from 'node:path';
import matter from 'gray-matter';
import type { NormalizedRelease, RawRelease, SourceRef } from '../types.js';
import { renderNormalizedRelease } from '../normalized-renderer.js';
import { normalizeRelease } from '../normalizers/index.js';
import {
  dedupeSourceRefs,
  isNoSignalText,
  stripEmoji,
} from '../normalizers/utils.js';
import { renderChangelogEntry } from '../template.js';
import { validateRenderedEntry } from '../validators.js';

const KNOWN_NO_SIGNAL_ENTRIES = new Set([
  '2026-03-05-mcp-server-0-10-0.md',
  '2026-03-05-mcp-config-schema-4-3-0.md',
  '2025-08-22-mcp-config-schema-0-5-0.md',
]);

type NormalizeHistoryOptions = {
  dryRun?: boolean;
};

export type NormalizeHistoryResult = {
  total: number;
  rewritten: number;
  unchanged: number;
  deleted: number;
  failures: Array<{ file: string; reason: string }>;
};

function normalizeCategories(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  return ['Documentation'];
}

function titleFromFileName(fileName: string): string {
  const slug = fileName.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function dateFromFileName(fileName: string): string {
  const match = fileName.match(/^(\d{4}-\d{2}-\d{2})-/);
  if (!match) throw new Error(`Invalid changelog filename: ${fileName}`);
  return match[1];
}

function inferRepoAndTag(
  title: string,
  fileName: string,
): {
  repo: string;
  tag: string;
} {
  const normalizedTitle = stripEmoji(title).trim();
  const titledRelease = normalizedTitle.match(/^(.+?)\s+v?(\d[\w.-]*)$/);
  if (titledRelease) {
    return {
      repo: titledRelease[1],
      tag: normalizedTitle.slice(titledRelease[1].length).trim(),
    };
  }

  const slug = fileName.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
  const slugRelease = slug.match(/^(.+)-(\d[\w-]*)$/);
  if (slugRelease) {
    return { repo: slugRelease[1], tag: slugRelease[2].replace(/-/g, '.') };
  }

  return { repo: 'manual', tag: dateFromFileName(fileName) };
}

function extractSourceRefs(content: string): SourceRef[] {
  const refs: SourceRef[] = [];
  const releaseNotes = content.match(
    /^Full release notes:\s*(https?:\/\/\S+)/im,
  );
  if (releaseNotes) {
    refs.push({ label: 'Release notes', url: releaseNotes[1] });
  }

  const fullChangelog = content.match(
    /\*\*Full Changelog\*\*:\s*(https?:\/\/\S+)/im,
  );
  if (fullChangelog) {
    refs.push({ label: 'Release notes', url: fullChangelog[1] });
  }

  const sourceLinks = content.matchAll(
    /^- \[([^\]]+)\]\((https?:\/\/[^)]+)\)/gm,
  );
  for (const match of sourceLinks) {
    refs.push({ label: match[1], url: match[2] });
  }

  return dedupeSourceRefs(refs);
}

function expandFlattenedBullets(content: string): string {
  return content
    .replace(/\.\s+-\s+/g, '.\n\n- ')
    .replace(/:\s+-\s+/g, ':\n\n- ')
    .replace(
      /([^\n])\s+(?=(Added endpoint|Removed endpoint|New endpoint):)/g,
      '$1\n\n- ',
    )
    .replace(
      /\s+-\s+(?=(Added|Changed|Fixed|Removed|Deprecated|Breaking|Migrated|Updated|Introduced|Improved|Enhanced|Refactored|Support|Documentation|Enhancement|Internal|Affected component|Committers):?\b)/g,
      '\n\n- ',
    );
}

function normalizeLegacyEntry(
  fileName: string,
  rawContent: string,
): {
  rendered: string | null;
  delete: boolean;
} {
  const parsed = matter(rawContent);
  const title = stripEmoji(
    String(parsed.data.title || titleFromFileName(fileName)),
  );
  const categories = normalizeCategories(parsed.data.categories);
  const slug =
    typeof parsed.data.slug === 'string' && parsed.data.slug.trim()
      ? parsed.data.slug.trim()
      : undefined;
  const sourceRefs = extractSourceRefs(parsed.content);
  const inferred = inferRepoAndTag(title, fileName);
  const cleanedContent = expandFlattenedBullets(
    stripEmoji(parsed.content),
  ).trim();

  if (KNOWN_NO_SIGNAL_ENTRIES.has(fileName) || isNoSignalText(cleanedContent)) {
    return { rendered: null, delete: true };
  }

  const release: RawRelease = {
    owner: 'gleanwork',
    repo: inferred.repo,
    tag: inferred.tag,
    url: sourceRefs[0]?.url || '',
    publishedAt: dateFromFileName(fileName),
    body: cleanedContent,
    category: categories[0] || 'Documentation',
  };

  const normalized = normalizeRelease(release, 'legacy');
  normalized.sourceRefs = dedupeSourceRefs([
    ...sourceRefs,
    ...normalized.sourceRefs,
  ]);

  if (normalized.isEmpty || normalized.changes.length === 0) {
    return { rendered: null, delete: true };
  }

  const renderedRelease = renderNormalizedRelease(
    normalized as NormalizedRelease,
  );
  const rendered = renderChangelogEntry({
    repoRoot: '',
    title,
    slug,
    categories,
    summary: renderedRelease.summary,
    detailedContent: renderedRelease.detailedContent,
  });

  const validation = validateRenderedEntry(rendered);
  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  return { rendered, delete: false };
}

export function normalizeHistoryEntries(
  repoRoot: string,
  opts: NormalizeHistoryOptions = {},
): NormalizeHistoryResult {
  const entriesDir = path.join(repoRoot, 'changelog', 'entries');
  const result: NormalizeHistoryResult = {
    total: 0,
    rewritten: 0,
    unchanged: 0,
    deleted: 0,
    failures: [],
  };

  const files = fs
    .readdirSync(entriesDir)
    .filter((file) => file.endsWith('.md'))
    .sort();

  for (const file of files) {
    result.total += 1;
    const filePath = path.join(entriesDir, file);
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    try {
      const normalized = normalizeLegacyEntry(file, rawContent);
      if (normalized.delete) {
        result.deleted += 1;
        if (!opts.dryRun) fs.unlinkSync(filePath);
        continue;
      }

      const rendered = normalized.rendered;
      if (!rendered) {
        result.failures.push({
          file,
          reason: 'Normalizer produced no content',
        });
        continue;
      }

      if (rendered === rawContent) {
        result.unchanged += 1;
        continue;
      }

      result.rewritten += 1;
      if (!opts.dryRun) fs.writeFileSync(filePath, rendered);
    } catch (error: unknown) {
      const reason =
        error && typeof error === 'object' && 'message' in error
          ? String((error as Error).message)
          : String(error);
      result.failures.push({ file, reason });
    }
  }

  return result;
}

export function normalizeHistoryCommand(
  repoRoot: string,
  opts: NormalizeHistoryOptions = {},
): void {
  const result = normalizeHistoryEntries(repoRoot, opts);
  console.log(JSON.stringify(result, null, 2));
  if (result.failures.length > 0) {
    process.exitCode = 1;
  }
}
