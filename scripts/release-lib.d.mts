// Types for release-lib.mjs. See that file for the x-glean-release shape.

export declare const RELEASE_EXTENSION: 'x-glean-release';
export declare const EXPERIMENTAL_EXTENSION: 'x-glean-experimental';
export declare const DEPRECATED_EXTENSION: 'x-glean-deprecated';

export type ReleaseStage = 'unreleased' | 'beta' | 'ga' | 'deprecated';

export interface ReleaseDeprecation {
  message?: string;
  introduced?: string;
  removal?: string;
  docs?: string;
}

export interface OperationRelease {
  stage: ReleaseStage;
  /** Guide for the stage. */
  docs?: string;
  /** Old `x-glean-experimental.introduced` only. */
  introduced?: string;
  /** Deprecated stage only. */
  deprecation?: ReleaseDeprecation;
}

export declare function getReleaseDeprecation(
  node: unknown,
): ReleaseDeprecation | undefined;

export declare function getReleaseEnumValueDeprecations(
  node: unknown,
): Array<{ enumValue: string; deprecation: ReleaseDeprecation }>;

export declare function getOperationRelease(
  operation: unknown,
): OperationRelease | undefined;

export declare function requiresOptIn(operation: unknown): boolean;
