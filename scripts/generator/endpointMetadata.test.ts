import { describe, expect, it } from 'vitest';
import type { DeprecationItem } from '../../src/types/deprecations';
import {
  buildEndpointMetadata,
  deriveAuthorization,
  deriveRelease,
  deriveScopes,
  detectApiFamily,
  type ApiOperation,
} from './endpointMetadata';

const base: ApiOperation = {
  method: 'get',
  path: '/api/agents/{agent_id}',
  operationId: 'platform-agents-get',
  security: [{ APIToken: [] }],
  securitySchemes: { APIToken: { type: 'http', scheme: 'bearer' } },
};

const endpointDeprecation: DeprecationItem = {
  id: 'd1',
  type: 'endpoint',
  name: 'POST /rest/api/v1/agents/search',
  message: 'Use POST /api/agents/search instead.',
  docs: 'https://developers.glean.com/api/platform-api/agents-overview',
  introduced: '2026-08-25',
  removal: '2027-04-15',
};

const fieldDeprecation: DeprecationItem = {
  id: 'd2',
  type: 'field',
  name: 'citations',
  message: 'Use citationsV2.',
  introduced: '2026-02-06',
  removal: '2026-10-15',
};

describe('deriveRelease', () => {
  it('defaults to GA', () => {
    expect(deriveRelease(base, [])).toEqual({ stage: 'ga' });
  });

  it('keeps GA when only fields are deprecated', () => {
    expect(deriveRelease(base, [fieldDeprecation]).stage).toBe('ga');
  });

  it('marks endpoint-level deprecations as deprecated', () => {
    expect(deriveRelease(base, [endpointDeprecation])).toEqual({
      stage: 'deprecated',
      since: '2026-08-25',
      removal: '2027-04-15',
      docs: 'https://developers.glean.com/api/platform-api/agents-overview',
      version: undefined,
    });
  });

  it('reads x-glean-experimental and its introduced date', () => {
    const release = deriveRelease(
      { ...base, 'x-glean-experimental': { introduced: '2026-06-23' } },
      [],
    );
    expect(release).toEqual({
      stage: 'experimental',
      since: '2026-06-23',
      version: undefined,
    });
  });

  it('maps x-beta and Preview visibility to beta', () => {
    expect(deriveRelease({ ...base, 'x-beta': true }, []).stage).toBe('beta');
    expect(
      deriveRelease({ ...base, 'x-visibility': 'Preview' }, []).stage,
    ).toBe('beta');
  });

  it('prefers x-glean-release when present and hides unreleased versions', () => {
    expect(
      deriveRelease(
        {
          ...base,
          'x-glean-experimental': { introduced: '2026-06-23' },
          'x-glean-release': { stage: 'GA', version: 'release-2026-09-24' },
        },
        [],
      ),
    ).toEqual({ stage: 'ga', version: 'release-2026-09-24' });
    expect(
      deriveRelease(
        {
          ...base,
          'x-glean-release': { stage: 'Beta', version: 'unreleased' },
        },
        [],
      ),
    ).toEqual({ stage: 'beta', version: undefined });
  });
});

describe('deriveScopes', () => {
  it('prefers x-glean-scopes from the spec', () => {
    expect(
      deriveScopes({ ...base, 'x-glean-scopes': { legacy: ['CUSTOM'] } }),
    ).toEqual({ legacy: ['CUSTOM'] });
  });

  it('drops Platform scopes until they are ready', () => {
    expect(
      deriveScopes({
        ...base,
        'x-glean-scopes': { legacy: ['AGENTS'], platform: ['agents:read'] },
      }),
    ).toEqual({ legacy: ['AGENTS'] });
  });

  it('falls back to the legacy scopes copied from the spec PR', () => {
    expect(deriveScopes(base)).toEqual({ legacy: ['AGENTS'] });
  });

  it('returns null for unknown operations', () => {
    expect(deriveScopes({ ...base, operationId: 'listanswers' })).toBeNull();
  });
});

describe('deriveAuthorization', () => {
  it('describes bearer auth with family-specific docs', () => {
    expect(deriveAuthorization(base, 'indexing')).toEqual({
      schemes: ['APIToken'],
      header: 'Authorization: Bearer <token>',
      tokenTypes: ['Glean-issued indexing token'],
      docsUrl: '/api-info/indexing/authentication/overview',
    });
  });

  it('returns null without security requirements', () => {
    expect(deriveAuthorization({ ...base, security: [] }, 'client')).toBeNull();
  });
});

describe('buildEndpointMetadata', () => {
  it('detects the API family from infoPath, then the path', () => {
    expect(detectApiFamily('api/platform-api/glean-platform-api', '/x')).toBe(
      'platform',
    );
    expect(detectApiFamily(undefined, '/rest/api/v1/chat')).toBe('client');
    expect(detectApiFamily(undefined, '/api/index/v1/indexdocument')).toBe(
      'indexing',
    );
  });

  it('assembles every section', () => {
    const data = buildEndpointMetadata(
      base,
      'api/platform-api/glean-platform-api',
      [fieldDeprecation],
    );
    expect(data).toMatchObject({
      method: 'get',
      path: '/api/agents/{agent_id}',
      api: 'platform',
      release: { stage: 'ga' },
      scopes: { legacy: ['AGENTS'] },
      deprecations: [fieldDeprecation],
    });
    expect(data.authorization?.docsUrl).toBe(
      '/api/platform-api/authentication',
    );
  });
});
