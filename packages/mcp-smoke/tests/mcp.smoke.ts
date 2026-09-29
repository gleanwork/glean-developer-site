import { test, expect } from '@gleanwork/mcp-server-tester/fixtures/mcp';

// Direct-mode smoke tests: fixed tool calls with deterministic assertions, no
// LLM. They cover the path a real agent takes: MCP handshake, tool discovery,
// the docs-research skill, then a search and a fetch against the index that
// the build bundles into the function.
//
// Queries and URLs point at long-lived pages. If a page moves, update it here.

const QUICKSTART_URL =
  'https://developers.glean.com/libraries/indexing-sdk/quickstart';

test('exposes docs_search and docs_fetch', async ({ mcp }) => {
  const names = (await mcp.listTools()).map((tool) => tool.name);
  expect(names).toEqual(expect.arrayContaining(['docs_search', 'docs_fetch']));
});

test('reports the deploy commit as its version', async ({ mcp }) => {
  // A short commit on Vercel, 'dev' locally. The old hard-coded '1.0.0'
  // meant a bad answer could not be traced to a deploy.
  expect(mcp.client.getServerVersion()?.version).toMatch(/^([0-9a-f]{7}|dev)$/);
});

test('publishes the docs-research skill', async ({ mcp }) => {
  const { resources } = await mcp.client.listResources();
  expect(resources.map((resource) => resource.uri)).toContain(
    'skill://docs-research/SKILL.md',
  );
});

test('docs_search returns developer docs results', async ({ mcp }) => {
  const result = await mcp.callTool('docs_search', {
    query: 'indexing sdk quickstart',
    limit: 3,
  });
  // A missing or stale index surfaces as a tool error, and an empty one as
  // "No matching documents found." Both should fail here.
  expect(result).not.toBeToolError();
  expect(result).toMatchToolPattern(/Found [0-9]+ result/);
  expect(result).toContainToolText('developers.glean.com');
});

test('docs_fetch returns page content', async ({ mcp }) => {
  const result = await mcp.callTool('docs_fetch', { url: QUICKSTART_URL });
  expect(result).not.toBeToolError();
  expect(result).toContainToolText('glean-indexing-sdk');
});
