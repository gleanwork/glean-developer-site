import type { Config } from '@docusaurus/types';
import { getBuildTimeFlags } from './build/buildTimeFlags';
import { flagsSnapshotToBooleans } from './lib/featureFlags';
import { getNavbarItems } from './build/filtering';

export function withFeatureFlags(config: Config): Config {
  const raw = getBuildTimeFlags();
  const booleans = flagsSnapshotToBooleans(raw, {});

  const themeConfig = config.themeConfig as any;
  if (themeConfig?.navbar?.items) {
    themeConfig.navbar.items = getNavbarItems(
      themeConfig.navbar.items,
      booleans,
    );
  }

  config.customFields = {
    ...config.customFields,
    __BUILD_FLAGS__: raw,
    __BUILD_FLAGS_BOOLEANS__: booleans,
  };

  return config;
}
