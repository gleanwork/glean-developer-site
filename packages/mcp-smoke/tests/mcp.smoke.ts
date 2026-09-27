import { test, expect } from '@gleanwork/mcp-server-tester/fixtures/mcp';

// Direct-mode smoke tests: fixed tool calls with deterministic assertions, no
// LLM. They cover the path a real agent takes: MCP handshake, tool discovery,
// then a search and a fetch that go through Glean with the Vercel credentials.
//
// Queries and URLs point at long-lived pages. If a page moves, update it here.

const QUICKSTART_URL =
  'https://developers.glean.com/libraries/indexing-sdk/quickstart';

test('exposes docs_search and docs_fetch', async ({ mcp }) => {
  const names = (await mcp.listTools()).map((tool) => tool.name);
  expect(names).toEqual(expect.arrayContaining(['docs_search', 'docs_fetch']));
});

test('docs_search returns developer docs results from Glean', async ({
  mcp,
}) => {
  const result = await mcp.callTool('docs_search', {
    query: 'indexing sdk quickstart',
    limit: 3,
  });
  // A Glean auth or config failure surfaces as a tool error. An empty index
  // surfaces as "No matching documents found." Both should fail here.
  expect(result).not.toBeToolError();
  expect(result).toMatchToolPattern(/Found [0-9]+ result/);
  expect(result).toContainToolText('developers.glean.com');
});

test('docs_fetch returns page content', async ({ mcp }) => {
  const result = await mcp.callTool('docs_fetch', { url: QUICKSTART_URL });
  expect(result).not.toBeToolError();
  expect(result).toContainToolText('glean-indexing-sdk');
});
