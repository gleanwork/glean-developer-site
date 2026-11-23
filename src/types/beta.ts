/**
 * Shared contract for the generated `src/data/beta.json`, which lists the
 * operations that need the opt-in header: `x-glean-release` with
 * `stage: beta`.
 *
 * This is the single source of truth for both the writer
 * (`scripts/beta-lib.ts`) and the reader
 * (`src/theme/DocSidebarItem/Link`), so the producer and consumer stay in sync.
 * Keep this file free of Node-only imports so it can be bundled on the client.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface BetaEndpoint {
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
  /** ISO date from `x-glean-release.introduced`, when present. */
  introduced?: string;
}

export interface BetaData {
  endpoints: BetaEndpoint[];
  generatedAt: string;
  totalCount: number;
}
