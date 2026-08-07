import type { FeatureFlagsMap } from './featureFlagTypes';

/**
 * Flags that ship ENABLED BY DEFAULT.
 *
 * These are merged as the base beneath the build-time env flags
 * (`FF_*` / `FEATURE_FLAGS_JSON`) and the runtime Edge Config response. Any of
 * those sources can still override an entry here — e.g. Edge Config can set
 * `{ "enabled": false }` as a kill switch — but with no override the default
 * below applies.
 *
 * This differs from ordinary flags, which are missing → off (see
 * `evaluateFlag`'s `reason: 'missing'`): entries here are on until someone
 * turns them off.
 */
export const DEFAULT_FLAGS: FeatureFlagsMap = {
  // New Claude Code plugin page: install-first flow plus a "/glean_run setup my
  // Glean" section. The previous page is preserved as the fallback and renders
  // whenever this flag is turned off.
  'claude-code-plugin-v2': {
    enabled: true,
    description:
      'New Claude Code plugin page (install-first + /glean_run setup my Glean).',
  },
};
