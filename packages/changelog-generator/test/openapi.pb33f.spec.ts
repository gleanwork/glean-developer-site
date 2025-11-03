/* @vitest-environment node */
import path from 'node:path';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/openapi-changes-runner.js', () => ({
  runOpenApiChanges: () => ({ changed: [{ kind: 'paths' }] }),
}));

import { ingestOpenApiCommits } from '../src/openapi.js';

describe('openapi ingest via openapi-changes runner (mocked)', () => {
  it('includes a day entry when openapi-changes reports changes', async () => {
    const fakeCommitSha = 'abcdef1234567890';
    const fakeParentSha = '123456abcdef0000';

    const octokit: any = {
      rest: {
        repos: {
          listCommits: vi.fn().mockResolvedValue({
            data: [
              {
                sha: fakeCommitSha,
                commit: { message: 'Add GET /v1/widgets', committer: { date: '2025-01-02T04:05:06Z' } },
              },
            ],
          }),
          getCommit: vi.fn().mockResolvedValue({
            data: { parents: [{ sha: fakeParentSha }], files: [{ filename: 'final_specs/client_rest.yaml' }] },
          }),
          getContent: vi.fn().mockImplementation(({ path: p, ref }: any) => {
            const content = ref === fakeParentSha
              ? 'openapi: 3.0.0\npaths:\n  /v1/widgets: {}\n'
              : 'openapi: 3.0.0\npaths:\n  /v1/widgets:\n    get: {}\n';
            return Promise.resolve({ data: { type: 'file', content: Buffer.from(content).toString('base64') } });
          }),
        },
      },
      paginate: {
        iterator: vi.fn().mockImplementation(function* (fn: any, params: any) {
          const result = {
            data: [
              {
                sha: fakeCommitSha,
                commit: { message: 'Add GET /v1/widgets', committer: { date: '2025-01-02T04:05:06Z' } },
              },
            ],
          };
          yield result;
        }),
      },
    };

    const res = await ingestOpenApiCommits({
      octokit,
      cfg: {
        enabled: true,
        repo: { owner: 'gleanwork', repo: 'open-api' },
        paths: ['final_specs/client_rest.yaml'],
        lookbackDays: 7,
        diffEnabled: true,
        diffEngine: 'openapi-changes',
      },
      latestLocalEntryDate: null,
      cachedSha: null,
      buildEntry: async (day, commits) => {
        const content = `# ${day}\n` + commits.map((c) => `${c.sha.slice(0, 7)} ${c.message}`).join('\n');
        return {
          path: path.join('changelog', 'entries', `${day}-rest-api-updates-open-api.md`),
          content,
          commitMessage: `chore: ${day}`,
        };
      },
    });

    expect(res.files.length).toBeGreaterThan(0);
    expect(res.files[0].path).toMatch(/rest-api-updates-open-api\.md$/);
  });
});


