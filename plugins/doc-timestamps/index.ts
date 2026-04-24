import path from 'node:path';
import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import type { LoadContext, Plugin } from '@docusaurus/types';
import type { LoadedContent as DocsLoadedContent } from '@docusaurus/plugin-content-docs';

const execFileAsync = promisify(execFile);

const SITE_PREFIX = '@site/';
const COMMIT_MARKER = '__DOC_TS_COMMIT__';

interface DocTimestamps {
  createdAt: number;
  lastUpdate: number;
}

function stripSitePrefix(source: string): string {
  return source.startsWith(SITE_PREFIX)
    ? source.slice(SITE_PREFIX.length)
    : source;
}

async function isShallowClone(cwd: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['rev-parse', '--is-shallow-repository'],
      { cwd },
    );
    return stdout.trim() === 'true';
  } catch {
    return false;
  }
}

async function collectGitTimestamps(
  cwd: string,
): Promise<Map<string, DocTimestamps>> {
  const map = new Map<string, DocTimestamps>();

  let stdout: string;
  try {
    const result = await execFileAsync(
      'git',
      [
        'log',
        '--no-renames',
        `--format=${COMMIT_MARKER}%ct`,
        '--name-only',
        '--',
        'docs/',
      ],
      { cwd, maxBuffer: 128 * 1024 * 1024 },
    );
    stdout = result.stdout;
  } catch (err) {
    console.warn(
      `[doc-timestamps] git log failed (${(err as Error).message}); timestamps will be empty`,
    );
    return map;
  }

  // Each block after splitting on COMMIT_MARKER:
  //   <ts>\n<file1>\n<file2>\n...
  // Iteration is newest-first (git default), so the FIRST sighting of a file
  // is the most recent commit (lastUpdate); the LAST sighting is the oldest
  // commit (createdAt).
  for (const block of stdout.split(COMMIT_MARKER)) {
    const lines = block.split('\n').map((s) => s.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    const ts = Number.parseInt(lines[0], 10);
    if (!Number.isFinite(ts)) continue;
    for (let i = 1; i < lines.length; i++) {
      const file = lines[i];
      const existing = map.get(file);
      if (existing) {
        existing.createdAt = ts;
      } else {
        map.set(file, { createdAt: ts, lastUpdate: ts });
      }
    }
  }

  return map;
}

export default function docTimestampsPlugin(
  _context: LoadContext,
): Plugin<undefined> {
  return {
    name: 'doc-timestamps',
    async postBuild({ siteDir, outDir, plugins, siteConfig }) {
      const docsPlugin = plugins.find(
        (p) => p.name === 'docusaurus-plugin-content-docs',
      );
      const content = docsPlugin?.content as DocsLoadedContent | undefined;
      if (!content) {
        console.warn(
          '[doc-timestamps] No content from docusaurus-plugin-content-docs; skipping',
        );
        return;
      }

      const docs = content.loadedVersions.flatMap((v) =>
        v.docs.filter((d) => !d.draft && !d.unlisted),
      );

      const sourceByPermalink = new Map<string, string>();
      for (const doc of docs) {
        sourceByPermalink.set(doc.permalink, stripSitePrefix(doc.source));
      }

      if (await isShallowClone(siteDir)) {
        console.warn(
          '[doc-timestamps] Repository is a shallow clone; createdAt may reflect the shallow boundary, not the true first commit.',
        );
      }

      const gitTimestamps = await collectGitTimestamps(siteDir);

      const siteUrl = siteConfig.url.replace(/\/$/, '');
      const out: Record<string, DocTimestamps> = {};
      let untracked = 0;
      for (const [permalink, sourcePath] of sourceByPermalink) {
        const ts = gitTimestamps.get(sourcePath);
        if (!ts) {
          untracked += 1;
          continue;
        }
        out[`${siteUrl}${permalink}`] = ts;
      }

      const outputPath = path.join(outDir, 'indexing', 'timestamps.json');
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, JSON.stringify(out, null, 2));
      console.log(
        `[doc-timestamps] Wrote ${Object.keys(out).length} entries to ${path.relative(siteDir, outputPath)}` +
          (untracked > 0
            ? ` (${untracked} doc(s) untracked by git, omitted)`
            : ''),
      );
    },
  };
}
