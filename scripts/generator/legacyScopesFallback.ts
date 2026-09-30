/**
 * TEMPORARY — delete once the published Platform spec carries
 * `x-glean-scopes`. `deriveScopes` prefers the spec, so this only fills the
 * gap until the next spec sync.
 *
 * Legacy scopes copied from askscio/scio#295400 (merged), which adds
 * `x-glean-scopes` to every Platform operation.
 */
export const LEGACY_SCOPES_FALLBACK: Record<string, string[]> = {
  'platform-agents-search': ['AGENTS'],
  'platform-agents-get': ['AGENTS'],
  'platform-agents-get-schemas': ['AGENTS'],
  'platform-agents-create-run': ['AGENTS'],
  'platform-agents-get-run': ['AGENTS'],
  'platform-agents-cancel-run': ['AGENTS'],
  'platform-agents-create-run-responses': ['AGENTS'],
  'platform-chat-create': ['CHAT'],
  'platform-chat-create-stream': ['CHAT'],
  'platform-search': ['SEARCH'],
  'platform-search-filters': ['SEARCH'],
  'platform-skills-list': ['SKILLS'],
  'platform-skills-get': ['SKILLS'],
  'platform-skills-get-content': ['SKILLS'],
  'platform-skills-list-versions': ['SKILLS'],
  'platform-skills-get-version': ['SKILLS'],
  'platform-skills-get-version-content': ['SKILLS'],
  'platform-skills-create': ['SKILLS'],
  'platform-skills-import': ['SKILLS'],
  'platform-skills-validate': ['SKILLS'],
  'platform-skills-preview-source': ['SKILLS'],
  'platform-skills-preview-source-stream': ['SKILLS'],
  'platform-skills-update': ['SKILLS'],
  'platform-skills-delete': ['SKILLS'],
  'platform-skills-sync': ['SKILLS'],
  'platform-skills-create-version': ['SKILLS'],
  'platform-triggers-list': ['TRIGGERS'],
  'platform-triggers-get': ['TRIGGERS'],
  'platform-triggers-events-search': ['TRIGGERS'],
  'platform-trigger-presets-list': ['TRIGGERS'],
  'platform-trigger-presets-get': ['TRIGGERS'],
  'platform-trigger-presets-input-values-list': ['TRIGGERS'],
  'platform-trigger-presets-events-search': ['TRIGGERS'],
  'platform-triggers-create': ['TRIGGERS'],
  'platform-triggers-update': ['TRIGGERS'],
  'platform-triggers-delete': ['TRIGGERS'],
};
