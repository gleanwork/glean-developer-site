import type { DeprecationItem } from '../../src/types/deprecations';
import type {
  ApiFamily,
  EndpointAuthorization,
  EndpointMetadataData,
  EndpointRelease,
  EndpointScopes,
} from '../../src/types/endpointMetadata';
import { LEGACY_SCOPES_FALLBACK } from './legacyScopesFallback';

interface SecurityScheme {
  type?: string;
  scheme?: string;
}

/** The subset of the plugin's ApiItem this module reads. */
export interface ApiOperation {
  method: string;
  path: string;
  operationId?: string;
  deprecated?: boolean;
  'x-visibility'?: string;
  'x-beta'?: boolean;
  'x-glean-experimental'?: { id?: string; introduced?: string } | boolean;
  'x-glean-scopes'?: EndpointScopes;
  'x-glean-release'?: { stage?: string; version?: string };
  security?: Array<Record<string, string[]>>;
  securitySchemes?: Record<string, SecurityScheme>;
}

const AUTH_DOCS: Record<ApiFamily, string> = {
  platform: '/api/platform-api/authentication',
  client: '/api-info/client/authentication/overview',
  indexing: '/api-info/indexing/authentication/overview',
};

const TOKEN_TYPES: Record<ApiFamily, string[]> = {
  platform: ['OAuth access token', 'Glean-issued token'],
  client: ['OAuth access token', 'Glean-issued token'],
  indexing: ['Glean-issued indexing token'],
};

export function detectApiFamily(
  infoPath: string | undefined,
  endpointPath: string,
): ApiFamily {
  if (infoPath?.includes('indexing-api')) return 'indexing';
  if (infoPath?.includes('client-api')) return 'client';
  if (infoPath?.includes('platform-api')) return 'platform';
  if (endpointPath.startsWith('/api/index/')) return 'indexing';
  if (endpointPath.startsWith('/rest/api/')) return 'client';
  return 'platform';
}

function experimentalIntroduced(
  value: ApiOperation['x-glean-experimental'],
): string | undefined {
  return value && typeof value === 'object' ? value.introduced : undefined;
}

function normalizeStage(stage: string | undefined) {
  switch (stage?.toLowerCase()) {
    case 'experimental':
      return 'experimental' as const;
    case 'beta':
      return 'beta' as const;
    case 'ga':
      return 'ga' as const;
    default:
      return undefined;
  }
}

/**
 * Derive the lifecycle stage. Precedence: an endpoint-level deprecation wins
 * (it is the most actionable), then `x-glean-release.stage` when present,
 * then the legacy experimental/beta markers, then GA.
 */
export function deriveRelease(
  api: ApiOperation,
  deprecations: DeprecationItem[],
): EndpointRelease {
  const endpointDeprecation = deprecations.find((d) => d.type === 'endpoint');
  const version = api['x-glean-release']?.version;
  const releaseVersion =
    version && version !== 'unreleased' ? version : undefined;

  if (endpointDeprecation || api.deprecated) {
    return {
      stage: 'deprecated',
      since: endpointDeprecation?.introduced,
      removal: endpointDeprecation?.removal,
      docs: endpointDeprecation?.docs,
      version: releaseVersion,
    };
  }

  const declared = normalizeStage(api['x-glean-release']?.stage);
  const isExperimental =
    declared === 'experimental' ||
    (!declared && Boolean(api['x-glean-experimental']));

  if (isExperimental) {
    return {
      stage: 'experimental',
      since: experimentalIntroduced(api['x-glean-experimental']),
      version: releaseVersion,
    };
  }

  const isBeta =
    declared === 'beta' ||
    (!declared &&
      (api['x-beta'] === true || api['x-visibility'] === 'Preview'));
  if (isBeta) {
    return { stage: 'beta', version: releaseVersion };
  }

  return { stage: 'ga', version: releaseVersion };
}

export function deriveAuthorization(
  api: ApiOperation,
  family: ApiFamily,
): EndpointAuthorization | null {
  const requirements = api.security ?? [];
  const schemes = requirements.flatMap((req) => Object.keys(req));
  if (schemes.length === 0) return null;

  const bearer = schemes.some((name) => {
    const s = api.securitySchemes?.[name];
    return s?.type === 'http' && s.scheme?.toLowerCase() === 'bearer';
  });

  return {
    schemes,
    header: bearer ? 'Authorization: Bearer <token>' : schemes.join(', '),
    tokenTypes: TOKEN_TYPES[family],
    docsUrl: AUTH_DOCS[family],
  };
}

/**
 * Scopes come from `x-glean-scopes` (askscio/scio#295400). Only legacy
 * scopes are exposed for now; Platform scopes are dropped until they are
 * ready. Until the published spec carries the extension, fall back to
 * LEGACY_SCOPES_FALLBACK.
 */
export function deriveScopes(api: ApiOperation): EndpointScopes | null {
  const legacy =
    api['x-glean-scopes']?.legacy ??
    (api.operationId ? LEGACY_SCOPES_FALLBACK[api.operationId] : undefined);
  return legacy?.length ? { legacy } : null;
}

export function buildEndpointMetadata(
  api: ApiOperation,
  infoPath: string | undefined,
  deprecations: DeprecationItem[],
): EndpointMetadataData {
  const family = detectApiFamily(infoPath, api.path);
  return {
    method: api.method,
    path: api.path,
    api: family,
    release: deriveRelease(api, deprecations),
    authorization: deriveAuthorization(api, family),
    scopes: deriveScopes(api),
    deprecations,
  };
}
