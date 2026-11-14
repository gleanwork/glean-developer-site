import type { DeprecationItem } from './deprecations';

/**
 * Lifecycle stage shown on an API reference page.
 *
 * The stage comes from `x-glean-release.stage`. Published specs never contain
 * `unreleased` nodes. Operations without `x-glean-release` fall back to the
 * older extensions:
 * - endpoint-level `x-glean-deprecated` (or `deprecated: true`) → `deprecated`
 * - `x-glean-experimental`, `x-beta`, or `x-visibility: Preview` → `beta`
 * - otherwise → `ga`
 */
export type ReleaseStage = 'beta' | 'ga' | 'deprecated';

export type ApiFamily = 'platform' | 'client' | 'indexing';

export interface EndpointRelease {
  stage: ReleaseStage;
  /** ISO date the current stage started, when known. */
  since?: string;
  /** Deprecated stage only: removal date. */
  removal?: string;
  /** Guide for the stage, e.g. a migration guide for deprecated. */
  docs?: string;
  /** Beta stage only: calls need the opt-in header. */
  optIn?: boolean;
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
