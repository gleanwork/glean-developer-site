import * as fs from 'node:fs';
import * as path from 'node:path';
import type { NormalizedRelease, RenderedEntry } from './types.js';
import { renderChangelogEntry } from './template.js';
import { renderNormalizedRelease } from './normalized-renderer.js';
import { dedupeSourceRefs } from './normalizers/utils.js';
import { validateRenderedEntry } from './validators.js';

function safeSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeTag(tag: string): string {
  return tag.replace(/^v/i, '').replace(/\./g, '-');
}

export function renderEntry(
  normalizedRelease: NormalizedRelease,
  opts: { repoRoot: string; entriesDir: string },
): RenderedEntry {
  const { release } = normalizedRelease;
  const title = `${release.repo} ${release.tag}`;
  const normalized = normalizeTag(release.tag);
  const slug = `${safeSlug(release.repo)}-${safeSlug(normalized)}`;
  const rendered = renderNormalizedRelease(normalizedRelease);

  let filename = `${release.publishedAt}-${slug}.md`;
  let counter = 1;
  while (fs.existsSync(path.join(opts.entriesDir, filename))) {
    filename = `${release.publishedAt}-${slug}-${counter}.md`;
    counter += 1;
  }

  const filePath = path.join('changelog', 'entries', filename);
  const content = renderChangelogEntry({
    repoRoot: opts.repoRoot,
    title,
    categories: [release.category],
    summary: rendered.summary,
    detailedContent: rendered.detailedContent,
  });

  const validation = validateRenderedEntry(content);
  if (!validation.valid) {
    throw new Error(
      `Rendered entry for ${title} failed validation: ${validation.reason}`,
    );
  }

  const commitMessage = `chore(changelog): add ${release.repo} ${release.tag}`;
  return {
    filePath,
    content,
    commitMessage,
    metadata: {
      repo: release.repo,
      tag: release.tag,
      parser: normalizedRelease.parser,
      summary: rendered.summary,
      sourceRefs: dedupeSourceRefs([
        ...normalizedRelease.sourceRefs,
        ...normalizedRelease.changes.flatMap(
          (change) => change.sourceRefs || [],
        ),
      ]),
    },
  };
}
