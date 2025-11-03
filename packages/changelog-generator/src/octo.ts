import { Octokit } from 'octokit';
import type { Endpoints } from '@octokit/types';

export function createOctokit(): Octokit {
  const token = process.env.GITHUB_TOKEN;
  return new Octokit({ auth: token });
}

export type RepoReleases =
  Endpoints['GET /repos/{owner}/{repo}/releases']['response']['data'];

export async function listReleases(
  octokit: Octokit,
  params: { owner: string; repo: string },
): Promise<RepoReleases> {
  const releases: RepoReleases = [];
  
  for await (const response of octokit.paginate.iterator(
    octokit.rest.repos.listReleases,
    {
      owner: params.owner,
      repo: params.repo,
      per_page: 100,
    }
  )) {
    releases.push(...response.data);
    if (releases.length >= 100) break;
  }
  
  return releases;
}


