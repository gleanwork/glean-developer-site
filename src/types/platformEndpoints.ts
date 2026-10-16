/**
 * Shared contract for the generated `src/data/platform-endpoints.json`.
 *
 * The writer is `scripts/platform-endpoints-lib.ts`; the reader is
 * `src/components/ApiOverview`, which renders the endpoint table on each
 * Platform API family overview page. Keep this file free of Node-only imports
 * so it can be bundled on the client.
 */

import type { HttpMethod } from './experimental';

export interface PlatformEndpoint {
  /** Uppercase HTTP method, e.g. "POST". */
  method: HttpMethod;
  /** API path as written in the spec, e.g. "/api/agents/search". */
  path: string;
  /** Operation summary from the spec, e.g. "Search agents". */
  summary: string;
  /**
   * Full Docusaurus doc id of the generated endpoint page, e.g.
   * "api/platform-api/platform-agents-search".
   */
  docId: string;
}

export interface PlatformEndpointFamily {
  /** OpenAPI tag the family is built from, e.g. "IdP Groups". */
  tag: string;
  /** Endpoints in spec order. */
  endpoints: PlatformEndpoint[];
}

export interface PlatformEndpointsData {
  /**
   * Families keyed by the slug of their tag, e.g. "agents" or "idp-groups".
   * Overview pages select a family with `<ApiOverview apiFamily="..." />`.
   */
  families: Record<string, PlatformEndpointFamily>;
}
