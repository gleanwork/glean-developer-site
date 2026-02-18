import path from 'path';
import type { Plugin } from '@docusaurus/types';

export default function themeGlean(): Plugin<void> {
  return {
    name: 'docusaurus-theme-glean',
    getThemePath() {
      return path.join(__dirname, 'theme');
    },
    getClientModules() {
      return [require.resolve('./css/brand.css')];
    },
  };
}
