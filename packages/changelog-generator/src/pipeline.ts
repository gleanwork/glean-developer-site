import type { Octokit } from 'octokit';
import * as path from 'node:path';
import type { GeneratorConfig } from './config.js';
import type { RawRelease, ReleaseResult } from './types.js';
import { fetchNewReleases } from './release-fetcher.js';
import { summarizeRelease } from './summarizer.js';
import { renderEntry } from './entry-renderer.js';

export async function processRelease(
  release: RawRelease,
  opts: {
    repoRoot: string;
    summarization: GeneratorConfig['summarization'];
    entriesDir: string;
  },
): Promise<ReleaseResult> {
  try {
    const result = await summarizeRelease(release.body, {
      mode: opts.summarization.mode,
      maxBullets: opts.summarization.maxBullets,
      maxChars: opts.summarization.maxChars,
      model: opts.summarization.model,
      category: release.category,
      hints: opts.summarization.categoryHints?.[release.category] || [],
      release,
    });

    const entry = renderEntry(result, {
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
        stage: 'summarize',
        release: `${release.owner}/${release.repo}`,
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
    decision: string;
    reason: string;
  }>;
}> {
  const results: ReleaseResult[] = [];
  const skipped: Array<{
    owner: string;
    repo: string;
    decision: string;
    reason: string;
  }> = [];
  const entriesDir = path.join(repoRoot, 'changelog', 'entries');

  for (const spec of config.repos) {
    try {
      const fetchResult = await fetchNewReleases(octokit, spec, latestDate);

      if (fetchResult.status === 'empty') {
        skipped.push({
          owner: spec.owner,
          repo: spec.repo,
          decision: 'skip',
          reason: fetchResult.reason,
        });
        continue;
      }

      for (const release of fetchResult.releases) {
        const result = await processRelease(release, {
          repoRoot,
          summarization: config.summarization,
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
