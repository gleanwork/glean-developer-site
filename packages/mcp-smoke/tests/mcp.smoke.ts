import { test, expect } from '@gleanwork/mcp-server-tester/fixtures/mcp';

// Direct-mode smoke tests: fixed tool calls with deterministic assertions, no
// LLM. They cover the path a real agent takes: MCP handshake, tool discovery,
// then a search and a fetch that go through Glean with the Vercel credentials.
//
// Queries and URLs point at long-lived pages. If a page moves, update it here.

const QUICKSTART_URL =
  'https://developers.glean.com/libraries/indexing-sdk/quickstart';

// Same endpoint the fixture uses; see playwright.config.ts.
const SERVER_URL = process.env.MCP_URL ?? 'https://developers.glean.com/mcp';

// MCP clients send tool calls in parallel, and a warm serverless instance
// takes them concurrently. The fixture makes one call at a time, so it cannot
// see a server that breaks when requests overlap. The calls have to stay in
// flight long enough to overlap: tools/list returns too quickly, so this uses
// docs_fetch, which waits on Glean. Eight calls stay well under Glean's
// search rate limit.
const OVERLAPPING_REQUESTS = 8;
const OVERLAP_ROUNDS = 3;

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

function errorMessage(body: string): string {
  try {
    const message = JSON.parse(body)?.error?.message;
    if (typeof message === 'string') return message.slice(0, 160);
  } catch {
    // Not JSON: fall through to the raw body.
  }
  return body.split('\n')[0].slice(0, 160);
}

async function fetchPage(id: number) {
  const response = await fetch(SERVER_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: { name: 'docs_fetch', arguments: { url: QUICKSTART_URL } },
    }),
  });
  return { status: response.status, body: await response.text() };
}

test('handles overlapping requests', async () => {
  for (let round = 0; round < OVERLAP_ROUNDS; round++) {
    const responses = await Promise.all(
      Array.from({ length: OVERLAPPING_REQUESTS }, (_, i) =>
        fetchPage(round * OVERLAPPING_REQUESTS + i + 1),
      ),
    );

    // One stable line per failure mode, so the alert issue does not churn:
    // the status and server message, without the request id.
    const failed = responses.find((r) => r.status !== 200);
    expect(
      failed && `HTTP ${failed.status}: ${errorMessage(failed.body)}`,
      'every overlapping request succeeds',
    ).toBeUndefined();
    for (const { body } of responses) {
      expect(body).toContain('glean-indexing-sdk');
    }
  }
});
