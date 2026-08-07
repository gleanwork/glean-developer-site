import type { FeatureFlagsMap } from '../lib/featureFlagTypes';
import { DEFAULT_FLAGS } from '../lib/defaultFlags';

let memo: FeatureFlagsMap | null = null;

export function getBuildTimeFlags(): FeatureFlagsMap {
  if (memo) return memo;

  // Seed the default-on flags first so env overrides (FF_* / FEATURE_FLAGS_JSON)
  // can still turn them off, but they default on when nothing is set.
  const flags: FeatureFlagsMap = { ...DEFAULT_FLAGS };
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
    const slug = key.replace(/^FF_/, '').toLowerCase().replace(/_/g, '-');
    flags[slug] = { enabled: value === 'true' };
  }

  memo = flags;
  return flags;
}
