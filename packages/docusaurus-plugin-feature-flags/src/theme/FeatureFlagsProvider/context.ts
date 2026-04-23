import { createContext } from 'react';
import type { FeatureFlagsMap } from '../../lib/featureFlagTypes';

export type FeatureFlagsState = {
  flagConfigs: FeatureFlagsMap;
  flags: Record<string, boolean>;
  isEnabled: (flag: string) => boolean;
  refresh: () => void;
  debug: boolean;
};

export const initialState: FeatureFlagsState = {
  flagConfigs: {},
  flags: {},
  isEnabled: () => false,
  refresh: () => {},
  debug: false,
};

export const FeatureFlagsContext =
  createContext<FeatureFlagsState>(initialState);
