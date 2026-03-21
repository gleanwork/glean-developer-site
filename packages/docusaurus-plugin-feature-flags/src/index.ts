import path from 'path';
import type { Plugin } from '@docusaurus/types';
import type { FeatureFlagPluginOptions } from './types';

export default function pluginFeatureFlags(
  context: any,
  options: FeatureFlagPluginOptions,
): Plugin<void> {
  return {
    name: 'docusaurus-plugin-feature-flags',
    getThemePath() {
      return path.join(__dirname, 'theme');
    },
    async contentLoaded({ actions }) {
      actions.setGlobalData({
        apiEndpoint: options.apiEndpoint ?? '/api/feature-flags',
        cacheTtlMs: options.cacheTtlMs ?? 300_000,
        debug: options.debug ?? false,
      });
    },
  };
}
