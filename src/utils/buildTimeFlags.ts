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
    const slug = key.replace(/^FF_/, '').toLowerCase().replace(/__/g, '-');
    flags[slug] = { enabled: value === 'true' };
  }

  memo = flags;
  return flags;
}
