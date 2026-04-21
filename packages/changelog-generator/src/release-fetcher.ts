import type { Octokit } from 'octokit';
import { listReleases } from './octo.js';
import type { RepoReleases } from './octo.js';
import type { RepoSpec } from './config.js';
import type { RawRelease } from './types.js';

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

  if (candidates.length === 0) {
    return { status: 'empty', reason: 'no releases' };
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
