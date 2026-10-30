// @vitest-environment node
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type {
  ArtifactBundle,
  McpDocsFetchEvent,
  McpDocsSearchEvent,
  SearchRanker,
} from 'docusaurus-plugin-mcp-server';
import { createNodeHandler } from 'docusaurus-plugin-mcp-server/adapters/node';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const trackSpy = vi.hoisted(() => vi.fn(async () => {}));
vi.mock('@vercel/analytics/server', () => ({ track: trackSpy }));

import {
  analyticsEventFor,
  clientId,
  fetchedPage,
  topResult,
  trackMcpEvent,
} from './mcp-analytics';

const QUERY = 'how do I rotate my token sk-live-123';

function search(
  overrides: Partial<McpDocsSearchEvent> = {},
): McpDocsSearchEvent {
  return {
    type: 'tool_call',
    tool: 'docs_search',
    ok: true,
    durationMs: 3,
    query: QUERY,
    limit: 5,
    resultCount: 2,
    results: [
      {
        url: 'https://developers.glean.com/api/client-api/chat/chat',
        route: '/api/client-api/chat/chat',
      },
      {
        url: 'https://developers.glean.com/guides/chat',
        route: '/guides/chat',
      },
    ],
    ...overrides,
  };
}

function fetchEvent(
  overrides: Partial<McpDocsFetchEvent> = {},
): McpDocsFetchEvent {
  return {
    type: 'tool_call',
    tool: 'docs_fetch',
    ok: true,
    durationMs: 3,
    uri: 'https://developers.glean.com/api/client-api/chat?token=secret#top',
    resolved: 'document',
    documentId: 'https://developers.glean.com/api/client-api/chat',
    ...overrides,
  };
}

describe('analyticsEventFor', () => {
  it('reports the page a search surfaced first, and never the query', () => {
    expect(analyticsEventFor(search())).toEqual({
      name: 'mcp_search',
      properties: { top: '/api/client-api/chat/chat', client: 'unknown' },
    });
    expect(
      analyticsEventFor(search({ resultCount: 0, results: [] })).properties,
    ).toEqual({ top: 'none', client: 'unknown' });
    expect(
      analyticsEventFor(
        search({ ok: false, resultCount: undefined, results: undefined }),
      ).properties,
    ).toEqual({ top: 'error', client: 'unknown' });
    expect(JSON.stringify(analyticsEventFor(search()))).not.toContain('token');
  });

  it('reports the path of the page a fetch read, and never the URI sent', () => {
    const event = analyticsEventFor(fetchEvent());
    expect(event).toEqual({
      name: 'mcp_fetch',
      properties: { page: '/api/client-api/chat', client: 'unknown' },
    });
    expect(JSON.stringify(event)).not.toContain('secret');
  });

  it('names the client when the call says which it is', () => {
    expect(
      analyticsEventFor(
        search({ client: { name: 'Claude Code', version: '2.1' } }),
      ).properties.client,
    ).toBe('claude-code');
  });
});

describe('fetchedPage', () => {
  it('drops a query string and fragment from the document ID', () => {
    expect(
      fetchedPage(
        fetchEvent({ documentId: 'https://developers.glean.com/docs/x?a=1#b' }),
      ),
    ).toBe('/docs/x');
  });

  it('accepts a document ID that is a bare path', () => {
    expect(fetchedPage(fetchEvent({ documentId: '/docs/x' }))).toBe('/docs/x');
  });

  it('reports skill files, missing pages, and errors without the URI', () => {
    expect(
      fetchedPage(
        fetchEvent({ resolved: 'skill-file', documentId: undefined }),
      ),
    ).toBe('skill');
    expect(
      fetchedPage(fetchEvent({ resolved: 'not-found', documentId: undefined })),
    ).toBe('not-found');
    expect(
      fetchedPage(
        fetchEvent({ ok: false, resolved: undefined, documentId: undefined }),
      ),
    ).toBe('error');
  });
});

describe('topResult', () => {
  it('drops a query string and fragment from the result URL', () => {
    expect(
      topResult(
        search({
          results: [
            {
              url: 'https://developers.glean.com/docs/x?a=1#b',
              route: '/docs/x',
            },
          ],
        }),
      ),
    ).toBe('/docs/x');
  });

  it('is none when the event has no result list', () => {
    expect(topResult(search({ results: undefined }))).toBe('none');
  });
});

describe('clientId', () => {
  it('turns a reported name into an ID', () => {
    expect(clientId('Cursor')).toBe('cursor');
    expect(clientId('  claude_code / beta ')).toBe('claude-code-beta');
  });

  it('is unknown when the client sent no name, or nothing usable', () => {
    expect(clientId(undefined)).toBe('unknown');
    expect(clientId('***')).toBe('unknown');
  });

  it('caps the length', () => {
    expect(clientId('a'.repeat(300))).toHaveLength(64);
  });
});

// The same handler as api/mcp.ts, over a one-page bundle, so the events are
// the ones the plugin really reports.
describe('trackMcpEvent as the handler onEvent', () => {
  let httpServer: http.Server;
  let url: string;

  beforeAll(async () => {
    const artifacts: ArtifactBundle = {
      formatVersion: 1,
      manifest: {
        serverName: 'analytics-test',
        version: '0.0.0',
        buildTime: new Date(0).toISOString(),
        docCount: 1,
        baseUrl: 'https://developers.glean.com',
      },
      docs: {
        '/docs/intro': {
          route: '/docs/intro',
          title: 'Intro',
          description: '',
          markdown: '# Intro\n\nHello.',
          headings: [],
        },
      },
    };
    // Finds the one page for "intro", and nothing for anything else.
    const search: SearchRanker = {
      name: 'stub',
      async search(query) {
        return query.includes('intro')
          ? [
              {
                url: 'https://developers.glean.com/docs/intro',
                route: '/docs/intro',
                title: 'Intro',
                score: 1,
                snippet: 'Hello.',
              },
            ]
          : [];
      },
    };
    const handler = createNodeHandler({
      artifacts,
      search,
      onEvent: trackMcpEvent,
    });
    httpServer = http.createServer((req, res) => void handler(req, res));
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    url = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}/`;
  });

  afterAll(async () => {
    await new Promise((resolve) => httpServer.close(resolve));
  });

  beforeEach(() => {
    trackSpy.mockClear();
  });

  async function callTool(name: string, args: Record<string, unknown>) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name, arguments: args },
      }),
    });
    expect(response.status).toBe(200);
    await response.text();
    // The server doesn't wait for onEvent, so let it run.
    await vi.waitFor(() => expect(trackSpy).toHaveBeenCalled());
  }

  it('sends a search as mcp_search with the first result path', async () => {
    await callTool('docs_search', { query: `${QUERY} intro` });
    expect(trackSpy).toHaveBeenCalledExactlyOnceWith('mcp_search', {
      top: '/docs/intro',
      client: 'unknown',
    });
  });

  it('sends a search that finds nothing as none', async () => {
    await callTool('docs_search', { query: QUERY });
    expect(trackSpy).toHaveBeenCalledExactlyOnceWith('mcp_search', {
      top: 'none',
      client: 'unknown',
    });
  });

  it('sends a fetch as mcp_fetch with the page path', async () => {
    await callTool('docs_fetch', {
      url: 'https://developers.glean.com/docs/intro?ref=agent#hello',
    });
    expect(trackSpy).toHaveBeenCalledExactlyOnceWith('mcp_fetch', {
      page: '/docs/intro',
      client: 'unknown',
    });
  });

  it('sends a fetch of a missing page as not-found', async () => {
    await callTool('docs_fetch', { url: '/docs/nope' });
    expect(trackSpy).toHaveBeenCalledExactlyOnceWith('mcp_fetch', {
      page: 'not-found',
      client: 'unknown',
    });
  });
});
