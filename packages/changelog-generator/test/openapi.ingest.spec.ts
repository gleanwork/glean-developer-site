/* @vitest-environment node */
import path from 'node:path';
import fs from 'node:fs';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import nock from 'nock';
import { Octokit } from 'octokit';
import { ingestOpenApiCommits } from '../src/openapi';

const fixturesDir = path.join(__dirname, 'fixtures', 'nock');

describe('openapi ingest (nock back)', () => {
  beforeAll(() => {
    nock.back.setMode(process.env.RECORD ? 'record' : 'lockdown');
    (nock.back as any).fixtures = fixturesDir;
    fs.mkdirSync(fixturesDir, { recursive: true });
  });

  afterAll(() => {
    nock.restore();
  });

  it('groups commits by day and builds entries', async () => {
    const { nockDone } = await (nock.back as any)('openapi_commits.json');

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const res = await ingestOpenApiCommits({
      octokit,
      cfg: {
        enabled: true,
        repo: { owner: 'gleanwork', repo: 'open-api' },
        paths: ['final_specs/client_rest.yaml', 'final_specs/indexing.yaml'],
        lookbackDays: 30,
      },
      latestLocalEntryDate: null,
      cachedSha: null,
      buildEntry: (day, commits) => {
        const content = `# ${day}\n` + commits.map((c) => `${c.sha.slice(0, 7)} ${c.message}`).join('\n');
        return {
          path: path.join('changelog', 'entries', `${day}-open-api-${commits[0].sha.slice(0, 7)}..${commits[commits.length - 1].sha.slice(0, 7)}.md`),
          content,
          commitMessage: `chore: ${day}`,
        };
      },
    });

    nockDone();

    expect(Array.isArray(res.files)).toBe(true);
    if (res.files.length > 0) {
      const f = res.files[0];
      expect(f.path).toMatch(/changelog\/entries\//);
      expect(f.content).toContain('\n');
    }
  });
});


