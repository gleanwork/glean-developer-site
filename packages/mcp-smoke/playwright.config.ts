import { defineConfig } from '@playwright/test';
import type { MCPConfig } from '@gleanwork/mcp-server-tester';

// MCP_URL: the endpoint under test. Defaults to production; the workflow sets
// it to a Vercel preview URL when it runs on a deploy.
const serverUrl = process.env.MCP_URL ?? 'https://developers.glean.com/mcp';

// The type argument declares the tester's `mcpConfig` project option, which
// @playwright/test does not know about.
export default defineConfig<{ mcpConfig: MCPConfig }>({
  testDir: './tests',
  // *.smoke.ts, not *.spec.ts / *.test.ts: the root vitest run picks up
  // every *.test / *.spec file in the repo and cannot load Playwright tests.
  testMatch: '**/*.smoke.ts',
  // Retry to ride out a cold start or a one-off network blip. Anything that
  // still fails after that is a real outage.
  retries: 2,
  timeout: 60_000,
  workers: 1,
  reporter: process.env.CI
    ? [['list'], ['json', { outputFile: 'test-results/results.json' }]]
    : [['list']],
  projects: [
    {
      name: 'devdocs-mcp',
      use: { mcpConfig: { transport: 'http', serverUrl } },
    },
  ],
});
