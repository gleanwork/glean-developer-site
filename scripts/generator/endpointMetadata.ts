import type { DeprecationItem } from '../../src/types/deprecations';
import type {
  ApiFamily,
  EndpointAuthorization,
  EndpointMetadataData,
  EndpointRelease,
  EndpointScopes,
} from '../../src/types/endpointMetadata';
import { LEGACY_SCOPES_FALLBACK } from './legacyScopesFallback';
import { getOperationRelease, requiresOptIn } from '../release-lib.mjs';

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
  'x-glean-deprecated'?: unknown;
  'x-glean-scopes'?: EndpointScopes;
  'x-glean-release'?: {
    stage?: string;
    docs?: string;
    deprecation?: {
      message?: string;
      introduced?: string;
      removal?: string;
      docs?: string;
    };
  };
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

/**
 * The deprecation's message, unless it only restates the badge
 * ("Endpoint is deprecated"). Replacement guidance such as
 * "Use POST /api/agents/search instead." is kept.
 */
export function deprecationMessage(
  message: string | undefined,
): string | undefined {
  const trimmed = message?.trim();
  if (!trimmed) return undefined;
  if (/^(this )?endpoint (is|has been) deprecated\.?$/i.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

/**
 * Derive the lifecycle stage from `x-glean-release` (see release-lib.mjs).
 *
 * Without `x-glean-release`, fall back to the older markers: an endpoint-level
 * deprecation (or `deprecated: true`) wins, as it is the most actionable, then
 * `x-glean-experimental`, `x-beta`, or `x-visibility: Preview` mean beta.
 * Otherwise the stage is GA.
 */
export function deriveRelease(
  api: ApiOperation,
  deprecations: DeprecationItem[],
): EndpointRelease {
  const endpointDeprecation = deprecations.find((d) => d.type === 'endpoint');
  const declared = api['x-glean-release'] !== undefined;
  const own = getOperationRelease(api);

  if (
    own?.stage === 'deprecated' ||
    (!declared && (endpointDeprecation || api.deprecated))
  ) {
    // deprecations.json covers only some specs, so fall back to the spec.
    const deprecation = endpointDeprecation ?? own?.deprecation;
    return {
      stage: 'deprecated',
      since: deprecation?.introduced,
      removal: deprecation?.removal,
      message: deprecationMessage(deprecation?.message),
      docs: deprecation?.docs ?? own?.docs,
    };
  }

  const isBeta =
    own?.stage === 'beta' ||
    (!declared &&
      (api['x-beta'] === true || api['x-visibility'] === 'Preview'));
  if (isBeta) {
    return {
      stage: 'beta',
      ...(own?.introduced ? { since: own.introduced } : {}),
      ...(own?.docs ? { docs: own.docs } : {}),
      // x-beta and Preview endpoints are open; the others need the header.
      ...(requiresOptIn(api) ? { optIn: true } : {}),
    };
  }

  return { stage: 'ga' };
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
