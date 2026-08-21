import type { FeatureFlagsMap } from '../lib/featureFlagTypes';

let memo: FeatureFlagsMap | null = null;

export function getBuildTimeFlags(): FeatureFlagsMap {
  if (memo) return memo;

  const flags: FeatureFlagsMap = {};
  try {
    const raw = process.env.FEATURE_FLAGS_JSON;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        Object.assign(flags, parsed['feature-flags'] || parsed);
      }
    }
  } catch {}

  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith('FF_')) continue;
    // converts FF_FOO_BAZ_BAR to foo-baz-bar
    // AGENTS.md documents FF_COOKBOOKS=true, but the sidebar and homepage
    // gate on `cookbook` (the /cookbook route and plugin name). The generic
    // slugger would emit `cookbooks` and the documented preview command
    // would silently do nothing. Alias until PACT-461 removes the flag.
    const slug =
      key === 'FF_COOKBOOKS'
        ? 'cookbook'
        : key.replace(/^FF_/, '').toLowerCase().replace(/_/g, '-');
    flags[slug] = { enabled: value === 'true' };
  }

  memo = flags;
  return flags;
}
