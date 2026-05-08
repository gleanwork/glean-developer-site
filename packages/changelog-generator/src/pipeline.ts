import type { Octokit } from 'octokit';
import * as path from 'node:path';
import type { GeneratorConfig } from './config.js';
import type {
  NormalizedRelease,
  RawRelease,
  ReleaseParser,
  ReleaseResult,
} from './types.js';
import { fetchNewReleases } from './release-fetcher.js';
import { renderEntry } from './entry-renderer.js';
import { normalizeRelease } from './normalizers/index.js';

export async function processRelease(
  release: RawRelease,
  opts: {
    repoRoot: string;
    parser: ReleaseParser;
    entriesDir: string;
  },
): Promise<ReleaseResult> {
  let normalized: NormalizedRelease;
  try {
    normalized = normalizeRelease(release, opts.parser);
  } catch (e: unknown) {
    const message =
      e && typeof e === 'object' && 'message' in e
        ? String((e as Error).message)
        : String(e);
    return {
      status: 'error',
      error: {
        stage: 'parse',
        release: `${release.owner}/${release.repo} ${release.tag}`,
        message,
      },
    };
  }

  if (normalized.isEmpty || normalized.changes.length === 0) {
    return {
      status: 'skipped',
      owner: release.owner,
      repo: release.repo,
      tag: release.tag,
      reason: `${release.tag} has no meaningful changelog changes`,
      emptyOrNoop: true,
    };
  }

  try {
    const entry = renderEntry(normalized, {
      repoRoot: opts.repoRoot,
      entriesDir: opts.entriesDir,
    });

    return { status: 'ok', entry };
  } catch (e: unknown) {
    const message =
      e && typeof e === 'object' && 'message' in e
        ? String((e as Error).message)
        : String(e);
    return {
      status: 'error',
      error: {
        stage: 'render',
        release: `${release.owner}/${release.repo} ${release.tag}`,
        message,
      },
    };
  }
}

export async function processAllReleases(
  octokit: Octokit,
  config: GeneratorConfig,
  repoRoot: string,
  latestDate: string | null,
): Promise<{
  results: ReleaseResult[];
  skipped: Array<{
    owner: string;
    repo: string;
    tag?: string;
    decision: string;
    reason: string;
    emptyOrNoop?: boolean;
    olderThanLatest?: boolean;
  }>;
}> {
  const results: ReleaseResult[] = [];
  const skipped: Array<{
    owner: string;
    repo: string;
    tag?: string;
    decision: string;
    reason: string;
    emptyOrNoop?: boolean;
    olderThanLatest?: boolean;
  }> = [];
  const entriesDir = path.join(repoRoot, 'changelog', 'entries');

  for (const spec of config.repos) {
    try {
      const fetchResult = await fetchNewReleases(octokit, spec, latestDate);

      if (fetchResult.status === 'empty') {
        skipped.push({
          owner: spec.owner,
          repo: spec.repo,
          tag: undefined,
          decision: 'skip',
          reason: fetchResult.reason,
          olderThanLatest: true,
        });
        continue;
      }

      for (const release of fetchResult.releases) {
        const result = await processRelease(release, {
          repoRoot,
          parser: spec.parser,
          entriesDir,
        });
        results.push(result);
      }
    } catch (e: unknown) {
      const message =
        e && typeof e === 'object' && 'message' in e
          ? String((e as Error).message)
          : String(e);
      results.push({
        status: 'error',
        error: {
          stage: 'fetch',
          release: `${spec.owner}/${spec.repo}`,
          message,
        },
      });
    }
  }

  return { results, skipped };
}
