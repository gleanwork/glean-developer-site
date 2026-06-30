import { describe, it, expect } from 'vitest';
import { getLocationFromPath } from './deprecations';

describe('getLocationFromPath', () => {
  it('labels indexing API paths as "Indexing API"', () => {
    expect(getLocationFromPath('/api/index/v1/bulkindexemployees')).toBe(
      'Indexing API',
    );
    expect(getLocationFromPath('/api/index/v1/getdocumentcount')).toBe(
      'Indexing API',
    );
  });

  it('labels client API paths as "Client API"', () => {
    expect(getLocationFromPath('/rest/api/v1/chat')).toBe('Client API');
    expect(getLocationFromPath('/rest/api/v1/governance/data/policies/{id}')).toBe(
      'Client API',
    );
  });

  it('defaults unknown paths to "Client API"', () => {
    expect(getLocationFromPath('/some/other/path')).toBe('Client API');
  });
});
