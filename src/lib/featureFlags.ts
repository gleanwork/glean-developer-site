import { FeatureEvaluationContext, FeatureEvaluationResult, FeatureFlagsMap } from './featureFlagTypes';

function stableHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0) % 100;
}

export function pickIdentity(context: FeatureEvaluationContext): string | undefined {
  if (context.userEmail) return context.userEmail.toLowerCase();
  if (context.userId) return context.userId;
  if (context.visitorId) return context.visitorId;
  return undefined;
}

export function evaluateFlag(
  flags: FeatureFlagsMap,
  flagName: string,
  context: FeatureEvaluationContext = {}
): FeatureEvaluationResult {
  const def = flags[flagName];
  if (!def) return { enabled: false, reason: 'missing' };

  const now = context.currentTime ? new Date(context.currentTime) : new Date();
  
  if (def.enableAfter) {
    const enableDate = new Date(def.enableAfter);
    if (!isNaN(enableDate.getTime()) && now < enableDate) {
      return { enabled: false, reason: 'not-yet-enabled' };
    }
  }
  
  if (def.disableAfter) {
    const disableDate = new Date(def.disableAfter);
    if (!isNaN(disableDate.getTime()) && now > disableDate) {
      return { enabled: false, reason: 'expired' };
    }
  }

  if (def.enabled === false) return { enabled: false, reason: 'disabled' };

  if (def.allowedUsers && def.allowedUsers.length > 0) {
    const identity = pickIdentity(context);
    if (identity && def.allowedUsers.map((v) => v.toLowerCase()).includes(identity.toLowerCase())) {
      return { enabled: true, reason: 'allowed-user' };
    }
  }

  if (typeof def.rolloutPercentage === 'number') {
    const pct = Math.max(0, Math.min(100, Math.floor(def.rolloutPercentage)));
    if (pct >= 100) return { enabled: true, reason: 'explicit' };
    if (pct <= 0) return { enabled: def.enabled, reason: def.enabled ? 'explicit' : 'disabled' };

    const identity = pickIdentity(context);
    if (!identity) {
      return { enabled: def.enabled, reason: def.enabled ? 'explicit' : 'disabled' };
    }
    const bucket = stableHash(`${flagName}:${identity}`);
    return { enabled: bucket < pct, reason: 'rollout' };
  }

  return { enabled: !!def.enabled, reason: 'explicit' };
}

export function flagsSnapshotToBooleans(
  flags: FeatureFlagsMap,
  context: FeatureEvaluationContext = {}
): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const key of Object.keys(flags)) {
    out[key] = evaluateFlag(flags, key, context).enabled;
  }
  return out;
}



