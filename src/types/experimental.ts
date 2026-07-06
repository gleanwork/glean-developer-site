/**
 * Shared contract for the generated `src/data/experimental.json`.
 *
 * This is the single source of truth for both the writer
 * (`scripts/experimental-lib.ts`) and the reader
 * (`src/theme/DocSidebarItem/Link`), so the producer and consumer stay in sync.
 * Keep this file free of Node-only imports so it can be bundled on the client.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ExperimentalEndpoint {
  /** Uppercase HTTP method, e.g. "POST". */
  method: HttpMethod;
  /** API path as written in the spec, e.g. "/agents/search". */
  path: string;
  /** Operation id from the spec, when present. */
  operationId?: string;
  /**
   * Kebab-cased id derived from the operation id (falling back to the summary),
   * matching the last segment of the generated doc id.
   */
  baseId: string;
  /**
   * Full Docusaurus doc id of the generated endpoint page, e.g.
   * "api/platform-api/platform-agents-search". The sidebar link component
   * matches an item's `docId` against this exactly (including API family), so
   * a kebab collision in a different API can't produce a false pill.
   */
  docId: string;
  /** Stable id from the `x-glean-experimental.id` field, when present. */
  id?: string;
  /** ISO date the endpoint was introduced, when present. */
  introduced?: string;
}

export interface ExperimentalData {
  endpoints: ExperimentalEndpoint[];
  generatedAt: string;
  totalCount: number;
}
