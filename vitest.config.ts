import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '*.config.ts',
        '*.config.js',
        '.docusaurus/',
        'build/',
      ],
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@site': path.resolve(__dirname, './'),
      '@theme/ApiExplorer/Body': path.resolve(
        __dirname,
        './src/theme/ApiExplorer/Body',
      ),
      '@theme/ApiExplorer/ParamOptions/ParamFormItems/ParamTextFormItem':
        path.resolve(
          __dirname,
          './src/theme/ApiExplorer/ParamOptions/ParamFormItems/ParamTextFormItem',
        ),
      '@theme/ApiExplorer/Request': path.resolve(
        __dirname,
        './src/theme/ApiExplorer/Request',
      ),
      '@theme/ApiExplorer': path.resolve(
        __dirname,
        './node_modules/docusaurus-theme-openapi-docs/lib/theme/ApiExplorer',
      ),
      '@theme-original/ApiExplorer/Body': path.resolve(
        __dirname,
        './node_modules/docusaurus-theme-openapi-docs/lib/theme/ApiExplorer/Body',
      ),
      '@theme-original/ApiExplorer/FormTextInput': path.resolve(
        __dirname,
        './node_modules/docusaurus-theme-openapi-docs/lib/theme/ApiExplorer/FormTextInput',
      ),
      '@theme-original/ApiExplorer/Request': path.resolve(
        __dirname,
        './node_modules/docusaurus-theme-openapi-docs/lib/theme/ApiExplorer/Request',
      ),
      '@theme/ApiItem': path.resolve(
        __dirname,
        './node_modules/docusaurus-theme-openapi-docs/lib/theme/ApiItem',
      ),
      '@theme/translationIds': path.resolve(
        __dirname,
        './node_modules/docusaurus-theme-openapi-docs/lib/theme/translationIds.js',
      ),
      '@theme': path.resolve(
        __dirname,
        './node_modules/@docusaurus/theme-classic/lib/theme',
      ),
      '@docusaurus': path.resolve(
        __dirname,
        './node_modules/@docusaurus/core/lib/client/exports',
      ),
      '@gleanwork/mcp-config-schema/browser': path.resolve(
        __dirname,
        './node_modules/@gleanwork/mcp-config-schema/dist/browser.js',
      ),
    },
  },
});
