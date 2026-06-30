// @vitest-environment node
import { describe, it, expect } from 'vitest';
// @ts-expect-error - .mjs script without type declarations
import { getLocationFromPath } from './generate-deprecations-rss.mjs';

describe('getLocationFromPath (RSS feed)', () => {
  it('labels indexing API paths as "Indexing API"', () => {
    expect(getLocationFromPath('/api/index/v1/bulkindexemployees')).toBe(
      'Indexing API',
    );
    expect(getLocationFromPath('/api/index/v1/getusercount')).toBe(
      'Indexing API',
    );
  });

  it('labels client API paths as "Client API"', () => {
    expect(getLocationFromPath('/rest/api/v1/chat')).toBe('Client API');
    expect(getLocationFromPath('/rest/api/v1/listanswers')).toBe('Client API');
  });

  it('defaults unknown paths to "Client API"', () => {
    expect(getLocationFromPath('/some/other/path')).toBe('Client API');
  });
});
