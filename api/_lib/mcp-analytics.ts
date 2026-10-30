/**
 * Usage events from the docs MCP endpoint (api/mcp.ts), sent to Vercel Web
 * Analytics. The plugin reports every docs_search and docs_fetch call through
 * `onEvent`. This module keeps only fields that follow the rules in
 * src/lib/analytics.ts: two properties at most, and values from a fixed set
 * or site paths. The agent's search query and the URI it fetched are never
 * sent.
 *
 * Vercel doesn't serve files under api/_lib as functions.
 */
import type {
  McpDocsEvent,
  McpDocsFetchEvent,
  McpDocsSearchEvent,
} from 'docusaurus-plugin-mcp-server';

/** Vercel rejects names, keys, and values longer than this. */
const MAX_LENGTH = 255;

/**
 * `track`, loaded with a dynamic import. This file compiles to CommonJS (see
 * api/tsconfig.json), where a static import becomes `require()`, and
 * @vercel/analytics/server resolves to an ES module under Node. The function
 * failed to load with ERR_REQUIRE_ESM on Vercel. The import starts when this
 * module loads, so the first event doesn't wait for it.
 */
const trackModule = import('@vercel/analytics/server');
// Keep a failed import from being an unhandled rejection before any event
// awaits it. Each trackMcpEvent call still sees the failure.
trackModule.catch(() => {});

export interface McpAnalyticsEvents {
  /**
   * What are agents trying to find, do they find it, and which agents search?
   * `top` is the path of the search's first result, `none`, or `error`.
   */
  mcp_search: { top: string; client: string };
  /** Which pages do agents read, and which agents read them? */
  mcp_fetch: { page: string; client: string };
}

export type McpAnalyticsEvent = {
  [N in keyof McpAnalyticsEvents]: {
    name: N;
    properties: McpAnalyticsEvents[N];
  };
}[keyof McpAnalyticsEvents];

/** The analytics event for one tool call. */
export function analyticsEventFor(event: McpDocsEvent): McpAnalyticsEvent {
  const client = clientId(event.client?.name);
  if (event.tool === 'docs_search') {
    return {
      name: 'mcp_search',
      properties: { top: topResult(event), client },
    };
  }
  return {
    name: 'mcp_fetch',
    properties: { page: fetchedPage(event), client },
  };
}

/**
 * What a docs_fetch call read: the page's path, `skill` for a skill file,
 * `not-found`, or `error`. A page is named by the ID the server resolved,
 * never by the URI the agent sent, which can be anything.
 */
export function fetchedPage(event: McpDocsFetchEvent): string {
  if (!event.ok) return 'error';
  if (event.resolved === 'skill-file') return 'skill';
  if (event.resolved !== 'document' || !event.documentId) return 'not-found';
  return pagePath(event.documentId);
}

/**
 * What a docs_search call surfaced: the path of its first result, `none`, or
 * `error`. The result comes from the search index, so this says what the
 * agent was looking for without the query it sent.
 */
export function topResult(event: McpDocsSearchEvent): string {
  if (!event.ok) return 'error';
  const first = event.results?.[0];
  return first ? pagePath(first.url) : 'none';
}

/**
 * A page's path, from its absolute URL. The base only matters for a bare
 * path. `pathname` drops any query string and fragment.
 */
function pagePath(url: string): string {
  try {
    return new URL(url, 'https://localhost').pathname.slice(0, MAX_LENGTH);
  } catch {
    return 'unknown';
  }
}

/**
 * The name the client reported, as an ID such as `claude-code`, or
 * `unknown`. Only clients on protocol 2026-07-28 name themselves on every
 * call. 2025-era clients do it only in `initialize`, so their calls are
 * `unknown`.
 */
export function clientId(name: string | undefined): string {
  const id = (name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
  return id || 'unknown';
}

/**
 * Sends one tool call to Vercel Web Analytics. On Vercel, `track` reads the
 * request's headers from the request context and passes its send to the
 * context's `waitUntil`, so the response doesn't wait for it. `track` logs
 * its own errors and never rejects. The plugin logs a failed import.
 */
export async function trackMcpEvent(event: McpDocsEvent): Promise<void> {
  const { name, properties } = analyticsEventFor(event);
  const { track } = await trackModule;
  await track(name, properties);
}
