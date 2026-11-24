import platformEndpointsData from '@site/src/data/platform-endpoints.json';
import type { BetaEndpoint } from '@site/src/types/beta';
import type { PlatformEndpointsData } from '@site/src/types/platformEndpoints';

export type PlatformStage = 'ga' | 'beta';

export interface PlatformCapability {
  label: string;
  /**
   * Generated doc-id slugs under `api/platform-api/` that belong to this
   * capability, e.g. `platform-search` matches `platform-search` and
   * `platform-search-filters`.
   */
  docPrefixes: string[];
}

export interface PlatformCapabilityStatus {
  label: string;
  stage: PlatformStage;
}

const PLATFORM_DOC_ROOT = 'api/platform-api/';

/** Every endpoint the Platform overview pages publish, in spec order. */
const PUBLISHED_PLATFORM_ENDPOINTS: readonly { docId: string }[] =
  Object.values(
    (platformEndpointsData as PlatformEndpointsData).families,
  ).flatMap((family) => family.endpoints);

/** Platform API capabilities shown on the homepage announcement, in display order. */
export const PLATFORM_CAPABILITIES: PlatformCapability[] = [
  { label: 'Search', docPrefixes: ['platform-search'] },
  { label: 'Documents', docPrefixes: ['platform-documents'] },
  { label: 'Chat', docPrefixes: ['platform-chat'] },
  { label: 'Agents', docPrefixes: ['platform-agents'] },
  { label: 'Skills', docPrefixes: ['platform-skills'] },
  {
    label: 'Triggers',
    docPrefixes: ['platform-triggers', 'platform-trigger-presets'],
  },
  {
    label: 'Usage',
    docPrefixes: ['platform-usage', 'platform-admin-usage'],
  },
  { label: 'Users', docPrefixes: ['platform-users'] },
  { label: 'Departments', docPrefixes: ['platform-departments'] },
  {
    label: 'Admin',
    docPrefixes: [
      'platform-admin-agents',
      'platform-admin-idp-groups',
      'platform-admin-oauth-clients',
    ],
  },
];

export function belongsToCapability(
  docId: string,
  capability: PlatformCapability,
): boolean {
  if (!docId.startsWith(PLATFORM_DOC_ROOT)) return false;
  const slug = docId.slice(PLATFORM_DOC_ROOT.length);
  return capability.docPrefixes.some(
    (prefix) => slug === prefix || slug.startsWith(`${prefix}-`),
  );
}

/** True when this generated page is in the beta endpoint list. */
export function isBetaEndpoint(
  docId: string,
  endpoints: readonly Pick<BetaEndpoint, 'docId'>[],
): boolean {
  return endpoints.some((endpoint) => endpoint.docId === docId);
}

/**
 * A capability's stage follows its GA surface. It is beta only when
 * every endpoint it publishes is beta. One GA endpoint keeps the
 * capability GA; the beta endpoint stays flagged on its own.
 *
 * `catalog` is the published endpoint list (`platform-endpoints.json`). A
 * capability with nothing published yet is beta when every endpoint
 * we know about for it is beta.
 */
export function getPlatformStatuses(
  endpoints: readonly Pick<BetaEndpoint, 'docId'>[],
  capabilities: readonly PlatformCapability[] = PLATFORM_CAPABILITIES,
  catalog: readonly Pick<
    BetaEndpoint,
    'docId'
  >[] = PUBLISHED_PLATFORM_ENDPOINTS,
): PlatformCapabilityStatus[] {
  const betaIds = new Set(endpoints.map((endpoint) => endpoint.docId));

  return capabilities.map((capability) => {
    const published = catalog.filter((endpoint) =>
      belongsToCapability(endpoint.docId, capability),
    );
    const known =
      published.length > 0
        ? published
        : endpoints.filter((endpoint) =>
            belongsToCapability(endpoint.docId, capability),
          );
    const beta =
      known.length > 0 &&
      known.every((endpoint) => betaIds.has(endpoint.docId));
    return {
      label: capability.label,
      stage: beta ? 'beta' : 'ga',
    };
  });
}

/**
 * Title badge: GA once any capability has graduated; the chips carry the
 * per-capability detail.
 */
export function platformBadge(statuses: PlatformCapabilityStatus[]): {
  label: string;
  ga: boolean;
} {
  const ga = statuses.some((s) => s.stage === 'ga');
  return { label: ga ? 'Generally available' : 'Beta', ga };
}
