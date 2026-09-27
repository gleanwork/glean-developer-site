// @vitest-environment node
//
// docs_fetch has to tell three cases apart: the page exists, the page does not
// exist, and Glean could not answer. The last one is not "Page not found": a
// client that is told a page does not exist will stop looking for it, when it
// should retry. Runs the real provider against a local stand-in for Glean.
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest';
import GleanSearchProvider from '../api/glean-search-provider.mjs';

const PAGE = 'https://developers.glean.com/guides/mcp';

type Reply = { status: number; body: unknown };
let reply: (path: string, body: any) => Reply;
let gleanServer: http.Server;

beforeAll(async () => {
  gleanServer = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      const { status, body } = reply(req.url ?? '', raw ? JSON.parse(raw) : {});
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    });
  });
  await new Promise<void>((resolve) => gleanServer.listen(0, resolve));
  const { port } = gleanServer.address() as AddressInfo;
  vi.stubEnv('GLEAN_API_TOKEN', 'test-token');
  vi.stubEnv('GLEAN_SERVER_URL', `http://127.0.0.1:${port}`);
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  reply = () => ({ status: 500, body: {} });
});

afterAll(async () => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  await new Promise((resolve) => gleanServer.close(resolve));
});

async function provider() {
  const p = new GleanSearchProvider();
  await p.initialize({ baseUrl: 'https://developers.glean.com' });
  return p;
}

// Glean keys getdocuments results by the requested id or URL.
function documents(body: any, doc: object) {
  const spec = body.documentSpecs[0];
  return { documents: { [spec.id ?? spec.url]: doc } };
}

test('returns the page when Glean has it', async () => {
  reply = (_path, body) => ({
    status: 200,
    body: documents(body, {
      title: 'Glean MCP',
      content: { fullTextList: ['# Glean MCP', 'Connect a host.'] },
    }),
  });

  const doc = await (await provider()).getDocument(PAGE);

  expect(doc).toMatchObject({ url: PAGE, title: 'Glean MCP' });
  expect(doc?.markdown).toContain('Connect a host.');
});

test('returns null when Glean has no such page', async () => {
  // Glean answers a lookup for an unknown page with an empty document.
  reply = (_path, body) => ({ status: 200, body: documents(body, {}) });

  await expect((await provider()).getDocument(PAGE)).resolves.toBeNull();
});

test('returns null when Glean reports an error for that document', async () => {
  reply = (_path, body) => ({
    status: 200,
    body: documents(body, { error: 'document not found' }),
  });

  await expect((await provider()).getDocument(PAGE)).resolves.toBeNull();
});

test('throws when Glean cannot answer, instead of reporting a missing page', async () => {
  reply = () => ({ status: 429, body: { message: 'Too many requests' } });

  await expect((await provider()).getDocument(PAGE)).rejects.toMatchObject({
    statusCode: 429,
  });
});

test('search throws when Glean cannot answer', async () => {
  reply = () => ({ status: 429, body: { message: 'Too many requests' } });

  await expect((await provider()).search('oauth')).rejects.toMatchObject({
    statusCode: 429,
  });
});
