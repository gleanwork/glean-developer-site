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

function joinLabels(labels: string[]): string {
  if (labels.length <= 2) return labels.join(' and ');
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
}

/** Announcement copy derived from capability statuses. */
export function describePlatformStatuses(
  statuses: PlatformCapabilityStatus[],
): { tag: string; title: string; body: string } {
  const ga = statuses.filter((s) => s.stage === 'ga').map((s) => s.label);
  const experimental = statuses
    .filter((s) => s.stage === 'experimental')
    .map((s) => s.label);

  if (ga.length === 0) {
    return {
      tag: 'Experimental',
      title: 'Introducing Glean Platform APIs',
      body: `${joinLabels(experimental)} are rolling out in experimental preview.`,
    };
  }

  const verb = (labels: string[]) => (labels.length === 1 ? 'is' : 'are');
  const gaSentence = `${joinLabels(ga)} ${verb(ga)} ready for production.`;
  const previewSentence =
    experimental.length > 0
      ? ` ${joinLabels(experimental)} ${verb(experimental)} available in experimental preview.`
      : '';

  return {
    tag: 'Generally available',
    title: 'Glean Platform APIs are generally available',
    body: `Build search, chat, and agent experiences into your applications. ${gaSentence}${previewSentence}`,
  };
}
