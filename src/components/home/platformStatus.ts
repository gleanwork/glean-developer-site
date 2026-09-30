import type { ExperimentalEndpoint } from '@site/src/types/experimental';

export type PlatformStage = 'ga' | 'experimental';

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

/** Platform API capabilities shown on the homepage announcement, in display order. */
export const PLATFORM_CAPABILITIES: PlatformCapability[] = [
  { label: 'Search', docPrefixes: ['platform-search'] },
  { label: 'Chat', docPrefixes: ['platform-chat'] },
  { label: 'Agents', docPrefixes: ['platform-agents'] },
  { label: 'Skills', docPrefixes: ['platform-skills'] },
  {
    label: 'Triggers',
    docPrefixes: ['platform-triggers', 'platform-trigger-presets'],
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

/**
 * A capability is experimental while any of its endpoints is still marked
 * `x-glean-experimental` in the generated `experimental.json`; otherwise GA.
 */
export function getPlatformStatuses(
  endpoints: Pick<ExperimentalEndpoint, 'docId'>[],
  capabilities: PlatformCapability[] = PLATFORM_CAPABILITIES,
): PlatformCapabilityStatus[] {
  return capabilities.map((capability) => ({
    label: capability.label,
    stage: endpoints.some((e) => belongsToCapability(e.docId, capability))
      ? 'experimental'
      : 'ga',
  }));
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
  return { label: ga ? 'Generally available' : 'Experimental', ga };
}
