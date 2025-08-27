export type FeatureFlagDefinition = {
  description?: string;
  enabled: boolean;
  enableAfter?: string;
  disableAfter?: string;
  rolloutPercentage?: number;
  allowedUsers?: Array<string>;
  metadata?: Record<string, unknown>;
};

export type FeatureFlagsMap = Record<string, FeatureFlagDefinition>;

export type FeatureEvaluationContext = {
  userId?: string;
  userEmail?: string;
  visitorId?: string;
  currentTime?: Date | string;
};

export type FeatureEvaluationResult = {
  enabled: boolean;
  reason: 'explicit' | 'allowed-user' | 'rollout' | 'disabled' | 'missing' | 'not-yet-enabled' | 'expired';
};



