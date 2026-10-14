// @vitest-environment node
//
// MCP clients send tool calls in parallel, and a warm Vercel instance handles
// them concurrently through one handler and McpDocsServer. Every overlapping
// request must get its own transport and server; reusing one fails with
// "Already connected to a transport". This runs locally with a slow stub
// search ranker so the requests are guaranteed to overlap; a burst against
// production cannot guarantee that.
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type {
  ArtifactBundle,
  SearchRanker,
} from 'docusaurus-plugin-mcp-server';
import { createNodeHandler } from 'docusaurus-plugin-mcp-server/adapters/node';
import { afterAll, beforeAll, expect, test } from 'vitest';

const OVERLAPPING_REQUESTS = 16;
const SEARCH_DELAY_MS = 50;

let httpServer: http.Server;
let url: string;

beforeAll(async () => {
  // The smallest bundle the server accepts: no pages, no search index.
  const artifacts: ArtifactBundle = {
    formatVersion: 1,
    manifest: {
      serverName: 'overlap-test',
      version: '0.0.0',
      buildTime: new Date(0).toISOString(),
      docCount: 0,
    },
    docs: {},
  };
  const slowSearch: SearchRanker = {
    name: 'slow-stub',
    async search() {
      await new Promise((resolve) => setTimeout(resolve, SEARCH_DELAY_MS));
      return [];
    },
  };

  // Same handler as api/mcp.ts, with a slow stub in place of local search.
  const handler = createNodeHandler({ artifacts, search: slowSearch });

  httpServer = http.createServer((req, res) => void handler(req, res));
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  url = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}/`;
});

afterAll(async () => {
  await new Promise((resolve) => httpServer.close(resolve));
});

test('every overlapping tool call succeeds', async () => {
  const responses = await Promise.all(
    Array.from({ length: OVERLAPPING_REQUESTS }, async (_, i) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: i + 1,
          method: 'tools/call',
          params: { name: 'docs_search', arguments: { query: 'oauth' } },
        }),
      });
      return { status: response.status, body: await response.text() };
    }),
  );

  expect(responses.filter((r) => r.status !== 200)).toEqual([]);
  for (const [i, { body }] of responses.entries()) {
    expect(JSON.parse(body)).toMatchObject({ jsonrpc: '2.0', id: i + 1 });
  }
});
