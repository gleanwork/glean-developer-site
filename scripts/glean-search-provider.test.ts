// @vitest-environment node
//
// Runs the real provider against a local stand-in for Glean's getdocuments.
//
// docs_fetch has to tell three cases apart: the page exists, the page does not
// exist, and Glean could not answer. The last one is not "Page not found": a
// client that is told a page does not exist will stop looking for it, when it
// should retry.
//
// It also has to find a page in one call whichever object type the indexer
// gave it. The document id includes that type, and the indexer decides it
// from source files the provider cannot see.
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { v5 as uuidv5 } from 'uuid';
import { afterAll, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import GleanSearchProvider from '../api/glean-search-provider.mjs';

const ORIGIN = 'https://developers.glean.com';
const GUIDE = `${ORIGIN}/guides/mcp`;
const PROSE_UNDER_API = `${ORIGIN}/api/platform-api/getting-started`;
const ENDPOINT = `${ORIGIN}/api/platform-api/platform-search`;

// The id scheme the indexer's SDK uses: datasource, object type, UUIDv5(url).
const docId = (objectType: string, url: string) =>
  `CUSTOM_DEVDOCS_${objectType}_${uuidv5(url, uuidv5.URL)}`;

type Doc = { title: string; content: { fullTextList: string[] } };
let indexed: Map<string, Doc>;
let failWith: number | null;
let calls: Array<Array<{ id?: string; url?: string }>>;
let gleanServer: http.Server;

beforeAll(async () => {
  gleanServer = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      if (failWith) {
        res.writeHead(failWith, { 'content-type': 'application/json' });
        return res.end('{"message":"Too many requests"}');
      }
      // Like Glean: one entry per requested spec, keyed by its id or URL. A
      // spec with no document gets an error entry.
      const specs = JSON.parse(raw).documentSpecs;
      calls.push(specs);
      const documents = Object.fromEntries(
        specs.map((spec: { id?: string; url?: string }) => {
          const key = (spec.id ?? spec.url)!;
          return [key, indexed.get(key) ?? { error: 'Document not found' }];
        }),
      );
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ documents }));
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

beforeEach(() => {
  failWith = null;
  calls = [];
  indexed = new Map([
    [docId('infoPage', GUIDE), page('Glean MCP', 'Connect a host.')],
    [
      docId('infoPage', PROSE_UNDER_API),
      page('Platform API Quickstart', 'Create a token, then call /api/search.'),
    ],
    [docId('apiReference', ENDPOINT), page('Search', 'POST /api/search')],
  ]);
});

afterAll(async () => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  await new Promise((resolve) => gleanServer.close(resolve));
});

function page(title: string, text: string): Doc {
  return { title, content: { fullTextList: [`# ${title}`, text] } };
}

async function provider() {
  const p = new GleanSearchProvider();
  await p.initialize({ baseUrl: ORIGIN });
  return p;
}

test.each([
  ['a guide', GUIDE, 'Connect a host.'],
  ['prose under /api/', PROSE_UNDER_API, 'call /api/search'],
  ['an endpoint page', ENDPOINT, 'POST /api/search'],
])('fetches %s in one Glean call', async (_kind, url, text) => {
  const doc = await (await provider()).getDocument(url);

  expect(doc).toMatchObject({ url });
  expect(doc?.markdown).toContain(text);
  expect(calls).toHaveLength(1);
});

test('falls back to a URL lookup when neither id is indexed', async () => {
  const url = `${ORIGIN}/guides/renamed`;
  indexed.set(url, page('Renamed', 'Found by URL.'));

  const doc = await (await provider()).getDocument(url);

  expect(doc?.markdown).toContain('Found by URL.');
  expect(
    calls.map((specs) => specs.map((s) => ('url' in s ? 'url' : 'id'))),
  ).toEqual([['id', 'id'], ['url']]);
});

test('returns null when Glean has no such page', async () => {
  await expect(
    (await provider()).getDocument(`${ORIGIN}/guides/missing`),
  ).resolves.toBeNull();
});

test('treats an empty document as missing', async () => {
  // Glean can answer a URL lookup for an unknown page with an empty document.
  const url = `${ORIGIN}/guides/empty`;
  indexed.set(url, { title: '', content: { fullTextList: [] } });

  await expect((await provider()).getDocument(url)).resolves.toBeNull();
});

test('throws when Glean cannot answer, instead of reporting a missing page', async () => {
  failWith = 429;

  await expect((await provider()).getDocument(GUIDE)).rejects.toMatchObject({
    statusCode: 429,
  });
});

test('search throws when Glean cannot answer', async () => {
  failWith = 429;

  await expect((await provider()).search('oauth')).rejects.toMatchObject({
    statusCode: 429,
  });
});
