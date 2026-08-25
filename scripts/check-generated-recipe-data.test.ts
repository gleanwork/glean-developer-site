import { describe, expect, it } from 'vitest';
import { catalogIdDrift } from './check-generated-recipe-data.mjs';

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
