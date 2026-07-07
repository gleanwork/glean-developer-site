import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import {
  extractExperimentalEndpoints,
  buildExperimentalData,
  computeBaseId,
  type ExperimentalEndpoint,
} from './experimental-lib';

function loadSpec(spec: string) {
  return yaml.load(spec) as any;
}

const PREFIX = 'api/platform-api';

describe('extractExperimentalEndpoints', () => {
  it('returns nothing for a spec without experimental endpoints', () => {
    const spec = loadSpec(`
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /api/v1/search:
    post:
      operationId: search
      responses:
        200:
          description: Success
`);
    expect(extractExperimentalEndpoints(spec, PREFIX)).toEqual([]);
  });

  it('extracts an operation-level x-glean-experimental endpoint with a full docId', () => {
    const spec = loadSpec(`
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /api/agents/search:
    post:
      operationId: platform-agents-search
      summary: Search agents
      x-glean-experimental:
        id: 4abc1e17
        introduced: "2026-05-12"
      responses:
        200:
          description: Success
`);
    const result = extractExperimentalEndpoints(spec, PREFIX);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      method: 'POST',
      path: '/api/agents/search',
      operationId: 'platform-agents-search',
      baseId: 'platform-agents-search',
      docId: 'api/platform-api/platform-agents-search',
      id: '4abc1e17',
      introduced: '2026-05-12',
    });
  });

  it('builds the docId from the given prefix (API family aware)', () => {
    const spec = loadSpec(`
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /activity:
    post:
      operationId: activity
      x-glean-experimental:
        id: a1
      responses:
        200:
          description: Success
`);
    const result = extractExperimentalEndpoints(
      spec,
      'api/client-api/activity',
    );
    expect(result[0].docId).toBe('api/client-api/activity/activity');
  });

  it('tolerates a trailing slash in the prefix', () => {
    const spec = loadSpec(`
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /a:
    get:
      operationId: a-get
      x-glean-experimental:
        id: a1
      responses:
        200:
          description: Success
`);
    const result = extractExperimentalEndpoints(spec, 'api/platform-api/');
    expect(result[0].docId).toBe('api/platform-api/a-get');
  });

  it('derives baseId from the summary when operationId is absent', () => {
    const spec = loadSpec(`
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /api/agents/search:
    get:
      summary: Search Agents Now
      x-glean-experimental:
        id: abc
      responses:
        200:
          description: Success
`);
    const result = extractExperimentalEndpoints(spec, PREFIX);
    expect(result[0].baseId).toBe('search-agents-now');
    expect(result[0].docId).toBe('api/platform-api/search-agents-now');
    expect(result[0].operationId).toBeUndefined();
  });

  it('handles multiple methods and paths', () => {
    const spec = loadSpec(`
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /api/a:
    get:
      operationId: a-get
      x-glean-experimental:
        id: a1
      responses:
        200:
          description: Success
    post:
      operationId: a-post
      responses:
        200:
          description: Success
  /api/b:
    post:
      operationId: b-post
      x-glean-experimental:
        id: b1
      responses:
        200:
          description: Success
`);
    const result = extractExperimentalEndpoints(spec, PREFIX);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.baseId).sort()).toEqual(['a-get', 'b-post']);
  });

  it('ignores non-http-method keys like parameters', () => {
    const spec = loadSpec(`
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /api/a:
    parameters:
      - name: foo
        in: query
        schema:
          type: string
    get:
      operationId: a-get
      x-glean-experimental:
        id: a1
      responses:
        200:
          description: Success
`);
    const result = extractExperimentalEndpoints(spec, PREFIX);
    expect(result).toHaveLength(1);
    expect(result[0].method).toBe('GET');
  });
});

describe('computeBaseId', () => {
  it('kebab-cases the operation id', () => {
    expect(computeBaseId({ operationId: 'platform-agents-search' })).toBe(
      'platform-agents-search',
    );
    expect(computeBaseId({ operationId: 'platformAgentsSearch' })).toBe(
      'platform-agents-search',
    );
  });

  it('falls back to the summary', () => {
    expect(computeBaseId({ summary: 'Search Agents' })).toBe('search-agents');
  });

  it('returns empty string when neither is present', () => {
    expect(computeBaseId({})).toBe('');
  });
});

describe('buildExperimentalData', () => {
  const make = (
    overrides: Partial<ExperimentalEndpoint>,
  ): ExperimentalEndpoint => ({
    method: 'GET',
    path: '/api/a',
    baseId: 'a-get',
    docId: 'api/platform-api/a-get',
    ...overrides,
  });

  it('returns empty output for no endpoints', () => {
    const data = buildExperimentalData([]);
    expect(data.endpoints).toEqual([]);
    expect(data.totalCount).toBe(0);
    expect(data.generatedAt).toBeDefined();
  });

  it('sorts by path then method', () => {
    const data = buildExperimentalData([
      make({ path: '/z', method: 'GET', docId: 'api/platform-api/z-get' }),
      make({ path: '/a', method: 'POST', docId: 'api/platform-api/a-post' }),
      make({ path: '/a', method: 'GET', docId: 'api/platform-api/a-get' }),
    ]);
    expect(data.endpoints.map((e) => `${e.path} ${e.method}`)).toEqual([
      '/a GET',
      '/a POST',
      '/z GET',
    ]);
  });

  it('dedupes by docId', () => {
    const data = buildExperimentalData([
      make({ docId: 'api/platform-api/a-get' }),
      make({ docId: 'api/platform-api/a-get' }),
    ]);
    expect(data.endpoints).toHaveLength(1);
    expect(data.totalCount).toBe(1);
  });

  it('keeps same baseId in different API families as distinct endpoints', () => {
    const data = buildExperimentalData([
      make({ docId: 'api/platform-api/a-get' }),
      make({ docId: 'api/client-api/activity/a-get' }),
    ]);
    expect(data.endpoints).toHaveLength(2);
  });
});
