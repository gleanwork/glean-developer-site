import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
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
    alias: {
      '@site': path.resolve(__dirname, './'),
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
