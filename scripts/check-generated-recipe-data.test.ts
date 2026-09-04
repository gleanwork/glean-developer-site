import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  catalogIdDrift,
  publishedRecipeDrift,
} from './check-generated-recipe-data.mjs';

describe('catalogIdDrift', () => {
  it('treats hidden registry entries as absent from the compiled catalog', () => {
    expect(
      catalogIdDrift(
        [{ id: 'embed-search-chat' }, { id: 'wip', hidden: true }],
        { recipes: [{ id: 'embed-search-chat' }] },
      ),
    ).toEqual({
      listedCount: 1,
      onlyCompiled: [],
      onlyListed: [],
    });
  });

  it('flags a hidden recipe that leaked into the compiled catalog', () => {
    const drift = catalogIdDrift(
      [{ id: 'embed-search-chat' }, { id: 'wip', hidden: true }],
      { recipes: [{ id: 'embed-search-chat' }, { id: 'wip' }] },
    );

    expect(drift.onlyCompiled).toEqual(['wip']);
    expect(drift.onlyListed).toEqual([]);
  });
});

describe('publishedRecipeDrift', () => {
  it('ignores a change that only reshapes the entries it already had', () => {
    expect(
      publishedRecipeDrift(
        [{ id: 'embed-search-chat' }],
        [{ id: 'embed-search-chat', capabilities: ['search'] }],
      ),
    ).toEqual({ added: [], removed: [] });
  });

  it('reports a recipe published by hand', () => {
    expect(
      publishedRecipeDrift(
        [{ id: 'embed-search-chat' }],
        [{ id: 'embed-search-chat' }, { id: 'skill-publishing-pipeline' }],
      ),
    ).toEqual({ added: ['skill-publishing-pipeline'], removed: [] });
  });

  it('reports a recipe removed by hand', () => {
    expect(
      publishedRecipeDrift(
        [{ id: 'embed-search-chat' }, { id: 'oncall-copilot' }],
        [{ id: 'embed-search-chat' }],
      ),
    ).toEqual({ added: [], removed: ['oncall-copilot'] });
  });

  it('does not count a newly hidden recipe as published', () => {
    expect(
      publishedRecipeDrift(
        [{ id: 'embed-search-chat' }, { id: 'wip', hidden: true }],
        [{ id: 'embed-search-chat' }, { id: 'wip', hidden: true }],
      ),
    ).toEqual({ added: [], removed: [] });
  });
});

describe('the sync branch the check exempts', () => {
  it('is the branch the sync workflow actually pushes to', () => {
    const read = (file: string) =>
      fs.readFileSync(path.resolve(import.meta.dirname, '..', file), 'utf8');

    const workflowBranch = /^\s*branch:\s*(\S+)\s*$/m.exec(
      read('.github/workflows/sync-cookbook-registry.yml'),
    )?.[1];
    const exemptBranch = /^const SYNC_BRANCH = '(.+)';$/m.exec(
      read('scripts/check-generated-recipe-data.mjs'),
    )?.[1];

    expect(workflowBranch).toBeDefined();
    expect(exemptBranch).toBe(workflowBranch);
  });
});
