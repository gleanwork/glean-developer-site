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
      message: 'Use POST /api/agents/search instead.',
      docs: 'https://developers.glean.com/api/platform-api/agents-overview',
    });
  });

  it('drops a deprecation message that only restates the badge', () => {
    const generic = {
      ...endpointDeprecation,
      message: 'Endpoint is deprecated',
    };
    expect(deriveRelease(base, [generic]).message).toBeUndefined();
  });

  it('maps x-glean-experimental to beta with its introduced date', () => {
    const release = deriveRelease(
      { ...base, 'x-glean-experimental': { introduced: '2026-06-23' } },
      [],
    );
    expect(release).toEqual({
      stage: 'beta',
      since: '2026-06-23',
      optIn: true,
    });
  });

  it('maps x-beta and Preview visibility to beta without the opt-in header', () => {
    expect(deriveRelease({ ...base, 'x-beta': true }, [])).toEqual({
      stage: 'beta',
    });
    expect(deriveRelease({ ...base, 'x-visibility': 'Preview' }, [])).toEqual({
      stage: 'beta',
    });
  });

  it('reads each x-glean-release stage', () => {
    expect(
      deriveRelease(
        {
          ...base,
          'x-glean-release': { stage: 'beta', docs: '/guides/beta' },
        },
        [],
      ),
    ).toEqual({ stage: 'beta', docs: '/guides/beta', optIn: true });
    expect(
      deriveRelease({ ...base, 'x-glean-release': { stage: 'ga' } }, []),
    ).toEqual({ stage: 'ga' });
    expect(
      deriveRelease(
        {
          ...base,
          'x-glean-release': {
            stage: 'deprecated',
            docs: '/guides/migrate',
            deprecation: {
              message: 'Use POST /api/agents/search instead.',
              introduced: '2026-10-01',
              removal: '2027-04-15',
            },
          },
        },
        [],
      ),
    ).toEqual({
      stage: 'deprecated',
      since: '2026-10-01',
      removal: '2027-04-15',
      message: 'Use POST /api/agents/search instead.',
      docs: '/guides/migrate',
    });
  });

  it('ignores the older markers when x-glean-release is present', () => {
    expect(
      deriveRelease(
        {
          ...base,
          deprecated: true,
          'x-beta': true,
          'x-glean-experimental': { introduced: '2026-06-23' },
          'x-glean-release': { stage: 'ga' },
        },
        [],
      ),
    ).toEqual({ stage: 'ga' });
  });

  it('prefers the deprecations.json entry for a deprecated stage', () => {
    expect(
      deriveRelease(
        {
          ...base,
          'x-glean-release': {
            stage: 'deprecated',
            deprecation: { message: 'From the spec', removal: '2027-01-01' },
          },
        },
        [endpointDeprecation],
      ).message,
    ).toBe('Use POST /api/agents/search instead.');
  });

  it('keeps deprecated ahead of beta for the older markers', () => {
    expect(
      deriveRelease(
        {
          ...base,
          'x-glean-experimental': { introduced: '2026-06-23' },
          'x-glean-deprecated': {
            message: 'Use POST /api/agents/search instead.',
            introduced: '2026-08-25',
            removal: '2027-04-15',
          },
        },
        [],
      ).stage,
    ).toBe('deprecated');
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
