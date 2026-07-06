import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import {
  extractExperimentalEndpoints,
  buildExperimentalOutput,
  computeBaseId,
  type ExperimentalEndpoint,
} from './experimental-lib';

function loadSpec(spec: string) {
  return yaml.load(spec) as any;
}

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
    expect(extractExperimentalEndpoints(spec)).toEqual([]);
  });

  it('extracts an operation-level x-glean-experimental endpoint', () => {
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
    const result = extractExperimentalEndpoints(spec);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      method: 'POST',
      path: '/api/agents/search',
      operationId: 'platform-agents-search',
      baseId: 'platform-agents-search',
      id: '4abc1e17',
      introduced: '2026-05-12',
    });
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
    const result = extractExperimentalEndpoints(spec);
    expect(result[0].baseId).toBe('search-agents-now');
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
    const result = extractExperimentalEndpoints(spec);
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
    const result = extractExperimentalEndpoints(spec);
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

describe('buildExperimentalOutput', () => {
  const make = (
    overrides: Partial<ExperimentalEndpoint>,
  ): ExperimentalEndpoint => ({
    method: 'GET',
    path: '/api/a',
    baseId: 'a-get',
    ...overrides,
  });

  it('returns empty output for no endpoints', () => {
    const output = buildExperimentalOutput([]);
    expect(output.endpoints).toEqual([]);
    expect(output.totalCount).toBe(0);
    expect(output.generatedAt).toBeDefined();
  });

  it('sorts by path then method', () => {
    const output = buildExperimentalOutput([
      make({ path: '/z', method: 'GET', baseId: 'z-get' }),
      make({ path: '/a', method: 'POST', baseId: 'a-post' }),
      make({ path: '/a', method: 'GET', baseId: 'a-get' }),
    ]);
    expect(output.endpoints.map((e) => `${e.path} ${e.method}`)).toEqual([
      '/a GET',
      '/a POST',
      '/z GET',
    ]);
  });

  it('dedupes by method + baseId', () => {
    const output = buildExperimentalOutput([
      make({ baseId: 'a-get' }),
      make({ baseId: 'a-get' }),
    ]);
    expect(output.endpoints).toHaveLength(1);
    expect(output.totalCount).toBe(1);
  });
});
