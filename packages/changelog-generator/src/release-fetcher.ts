import type { Octokit } from 'octokit';
import { createRequire } from 'node:module';
import { listReleases } from './octo.js';
import type { RepoReleases } from './octo.js';
import type { RepoSpec } from './config.js';
import type { RawRelease } from './types.js';

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dbg: any = require('debug');
const dbgFetch = dbg('changelog:fetch');

export type FetchResult =
  | { status: 'ok'; releases: RawRelease[] }
  | { status: 'empty'; reason: string };

export async function fetchNewReleases(
  octokit: Octokit,
  spec: RepoSpec,
  cutoffDate: string | null,
): Promise<FetchResult> {
  const cutoff = cutoffDate ?? '0000-00-00';
  const releases: RepoReleases = await listReleases(octokit, {
    owner: spec.owner,
    repo: spec.repo,
  });

  const candidates = releases
    .filter((r) => !!r.published_at)
    .sort((a, b) => (a.published_at! < b.published_at! ? 1 : -1));

  dbgFetch(
    '%s/%s: api returned %d releases (%d dated), cutoff=%s',
    spec.owner,
    spec.repo,
    releases.length,
    candidates.length,
    cutoff,
  );

  if (candidates.length === 0) {
    throw new Error(
      `listReleases returned zero dated releases for ${spec.owner}/${spec.repo}. ` +
        `This repo is configured in config.yml because it has releases, so an empty ` +
        `response indicates a transient API failure (or incorrect auth scope). ` +
        `Re-run the workflow; if the problem persists, inspect the GITHUB_TOKEN scope.`,
    );
  }

  const newReleases = candidates.filter((r) => {
    const relDate = r.published_at!.slice(0, 10);
    return relDate > cutoff;
  });

  if (newReleases.length === 0) {
    return { status: 'empty', reason: 'no newer release than latest entry' };
  }

  return {
    status: 'ok',
    releases: newReleases.map((release) => {
      const relDate = release.published_at!.slice(0, 10);
      const tag = release.tag_name || 'unknown';
      const url = release.html_url || release.url || '';
      const body = release.body?.trim() ?? '';

      return {
        owner: spec.owner,
        repo: spec.repo,
        tag,
        url,
        publishedAt: relDate,
        body: body || `${spec.repo} ${tag}`,
        category: spec.category,
      };
    }),
  };
}
