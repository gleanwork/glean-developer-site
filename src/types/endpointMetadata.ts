import type { DeprecationItem } from './deprecations';

/**
 * Lifecycle stage shown on an API reference page.
 *
 * Today the stage is derived from existing extensions:
 * - `x-glean-experimental` → `experimental`
 * - `x-beta` / `x-visibility: Preview` → `beta`
 * - endpoint-level `x-glean-deprecated` (or `deprecated: true`) → `deprecated`
 * - otherwise → `ga`
 *
 * Once `x-glean-release.stage` lands (RFC: Lifecycle Stage and Release
 * Version for Platform APIs) it becomes the source of truth for the first
 * three; `deprecated` stays an overlay from the deprecation flow.
 */
export type ReleaseStage = 'experimental' | 'beta' | 'ga' | 'deprecated';

export type ApiFamily = 'platform' | 'client' | 'indexing';

export interface EndpointRelease {
  stage: ReleaseStage;
  /** ISO date the current stage started, when known. */
  since?: string;
  /**
   * Release that first shipped the current stage (`x-glean-release.version`).
   * Not in any spec yet — reserved so layouts leave room for it.
   */
  version?: string;
  /** Deprecated stage only: removal date and migration guide URL. */
  removal?: string;
  docs?: string;
  /**
   * Deprecated stage only: replacement guidance, e.g. "Use POST
   * /api/agents/search instead." Omitted when it only restates the badge.
   */
  message?: string;
}

export interface EndpointScopes {
  /** Legacy token scopes, e.g. `AGENTS`. */
  legacy?: string[];
  /**
   * Fine-grained Platform scopes, e.g. `agents:read`. Present in
   * `x-glean-scopes` but not ready yet, so the generator drops them.
   */
  platform?: string[];
}

export interface EndpointAuthorization {
  /** Security scheme names from the spec, e.g. `APIToken`. */
  schemes: string[];
  /** Example request header, e.g. `Authorization: Bearer <token>`. */
  header: string;
  /** Accepted credential types, in display order. */
  tokenTypes: string[];
  docsUrl: string;
}

export interface EndpointMetadataData {
  method: string;
  path: string;
  api: ApiFamily;
  release: EndpointRelease;
  authorization: EndpointAuthorization | null;
  scopes: EndpointScopes | null;
  /** Active deprecations for this endpoint (endpoint- and field-level). */
  deprecations: DeprecationItem[];
}
