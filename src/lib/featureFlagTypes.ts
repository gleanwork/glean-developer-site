export type FeatureFlagDefinition = {
  description?: string;
  enabled: boolean;
  rolloutPercentage?: number;
  allowedUsers?: Array<string>;
  metadata?: Record<string, unknown>;
};

export type FeatureFlagsMap = Record<string, FeatureFlagDefinition>;

export type FeatureEvaluationContext = {
  userId?: string;
  userEmail?: string;
  visitorId?: string;
};

export type FeatureEvaluationResult = {
  enabled: boolean;
  reason: 'explicit' | 'allowed-user' | 'rollout' | 'disabled' | 'missing';
};



