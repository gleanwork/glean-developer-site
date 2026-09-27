// @vitest-environment node
//
// MCP clients send tool calls in parallel, and a warm Vercel instance handles
// them concurrently through one McpDocsServer. Every overlapping request must
// get its own transport and server; reusing one fails with "Already connected
// to a transport". This runs locally with a slow stub search provider so the
// requests are guaranteed to overlap without calling Glean. A burst against
// production cannot do that reliably without spending the shared Glean rate
// limit that real users depend on.
import fs from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { McpDocsServer } from 'docusaurus-plugin-mcp-server';
import { afterAll, beforeAll, expect, test } from 'vitest';

const OVERLAPPING_REQUESTS = 16;
const SEARCH_DELAY_MS = 50;

let httpServer: http.Server;
let url: string;
let dir: string;

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-overlap-'));
  fs.writeFileSync(path.join(dir, 'docs.json'), '{}');
  fs.writeFileSync(path.join(dir, 'search-index.json'), '{}');
  const provider = path.join(dir, 'slow-provider.mjs');
  fs.writeFileSync(
    provider,
    `export default class SlowProvider {
      name = 'slow-stub';
      async initialize() {}
      isReady() { return true; }
      async search() {
        await new Promise((resolve) => setTimeout(resolve, ${SEARCH_DELAY_MS}));
        return [];
      }
    }`,
  );

  // Same shape as api/mcp.ts, with the stub in place of the Glean provider.
  const server = new McpDocsServer({
    docsPath: path.join(dir, 'docs.json'),
    indexPath: path.join(dir, 'search-index.json'),
    name: 'overlap-test',
    version: '0.0.0',
    search: provider,
  });
  await server.initialize();

  httpServer = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        await server.handleHttpRequest(req, res, JSON.parse(body));
      } catch (error) {
        res.writeHead(500, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: String(error) }));
      }
    });
  });
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  url = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}/`;
});

afterAll(async () => {
  await new Promise((resolve) => httpServer.close(resolve));
  fs.rmSync(dir, { recursive: true, force: true });
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
