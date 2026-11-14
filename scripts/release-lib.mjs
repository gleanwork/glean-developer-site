/**
 * Readers for a node's lifecycle stage in the published OpenAPI specs.
 *
 * `x-glean-release` is the lifecycle annotation. Until every spec uses it,
 * these readers fall back to the older `x-glean-experimental` and
 * `x-glean-deprecated` annotations. A node that has `x-glean-release` ignores
 * the older ones.
 *
 * `x-glean-release` has two forms:
 *
 * - Object form, on operations, properties, and parameters:
 *
 *     x-glean-release:
 *       stage: deprecated # unreleased | beta | ga | deprecated
 *       docs: https://...
 *       deprecation:
 *         message: Use newField instead
 *         introduced: 2026-10-01
 *         removal: 2027-04-15
 *
 * - List form, only for enum values, and only to deprecate them:
 *
 *     x-glean-release:
 *       - stage: deprecated
 *         enum-value: LEGACY
 *         deprecation:
 *           message: Use STANDARD instead
 *           introduced: 2026-10-01
 *           removal: 2027-04-15
 *
 * `enum-value` can also sit inside `deprecation`. Published specs never
 * contain `stage: unreleased` nodes.
 *
 * Shared by the TypeScript generators and `openapi-capitalize-language.mjs`.
 */

export const RELEASE_EXTENSION = 'x-glean-release';
export const EXPERIMENTAL_EXTENSION = 'x-glean-experimental';
export const DEPRECATED_EXTENSION = 'x-glean-deprecated';

/**
 * @typedef {'unreleased' | 'beta' | 'ga' | 'deprecated'} ReleaseStage
 *
 * @typedef {object} ReleaseDeprecation
 * @property {string} [message]
 * @property {string} [introduced]
 * @property {string} [removal]
 * @property {string} [docs]
 *
 * @typedef {object} OperationRelease
 * @property {ReleaseStage} stage
 * @property {string} [docs] Guide for the stage.
 * @property {string} [introduced] Old `x-glean-experimental.introduced` only.
 * @property {ReleaseDeprecation} [deprecation] Deprecated stage only.
 */

const STAGES = new Set(['unreleased', 'beta', 'ga', 'deprecated']);
const OPT_IN_STAGES = new Set(['unreleased', 'beta']);

/** @param {unknown} value */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * The deprecation details of an `x-glean-release` entry, with the stage-level
 * `docs` filled in when the deprecation has none of its own.
 *
 * @param {Record<string, any>} entry An object-form value or a list-form item
 * @returns {ReleaseDeprecation | undefined}
 */
function releaseDeprecation(entry) {
  if (entry.stage !== 'deprecated' || !isPlainObject(entry.deprecation)) {
    return undefined;
  }
  const { 'enum-value': _enumValue, kind: _kind, ...rest } = entry.deprecation;
  /** @type {ReleaseDeprecation} */
  const deprecation = { ...rest };
  if (deprecation.docs === undefined && typeof entry.docs === 'string') {
    deprecation.docs = entry.docs;
  }
  return deprecation;
}

/**
 * The deprecation that the object form of `x-glean-release` sets on the node,
 * or undefined. Does not read `x-glean-deprecated`.
 *
 * @param {unknown} node An operation, parameter, or schema
 * @returns {ReleaseDeprecation | undefined}
 */
export function getReleaseDeprecation(node) {
  if (!isPlainObject(node)) return undefined;
  const release = node[RELEASE_EXTENSION];
  return isPlainObject(release) ? releaseDeprecation(release) : undefined;
}

/**
 * The enum values that the list form of `x-glean-release` deprecates. Does
 * not read `x-glean-deprecated`.
 *
 * @param {unknown} node A schema
 * @returns {Array<{ enumValue: string, deprecation: ReleaseDeprecation }>}
 */
export function getReleaseEnumValueDeprecations(node) {
  if (!isPlainObject(node)) return [];
  const release = node[RELEASE_EXTENSION];
  if (!Array.isArray(release)) return [];

  return release.flatMap((item) => {
    if (!isPlainObject(item)) return [];
    const enumValue =
      item['enum-value'] ??
      (isPlainObject(item.deprecation)
        ? item.deprecation['enum-value']
        : undefined);
    const deprecation = releaseDeprecation(item);
    if (!deprecation || typeof enumValue !== 'string') return [];
    return [{ enumValue, deprecation }];
  });
}

/**
 * The stage an operation sets on itself, or undefined when it sets none
 * (it is then GA).
 *
 * Reads the object form of `x-glean-release`. Without it, an object-form
 * `x-glean-deprecated` means deprecated and `x-glean-experimental` means beta.
 * Deprecated wins when an operation has both old annotations.
 *
 * @param {unknown} operation
 * @returns {OperationRelease | undefined}
 */
export function getOperationRelease(operation) {
  if (!isPlainObject(operation)) return undefined;

  const release = operation[RELEASE_EXTENSION];
  if (release !== undefined) {
    if (!isPlainObject(release) || !STAGES.has(release.stage)) {
      return undefined;
    }
    /** @type {OperationRelease} */
    const result = { stage: release.stage };
    if (typeof release.docs === 'string') result.docs = release.docs;
    const deprecation = releaseDeprecation(release);
    if (deprecation) result.deprecation = deprecation;
    return result;
  }

  const deprecated = operation[DEPRECATED_EXTENSION];
  if (isPlainObject(deprecated)) {
    const { message, introduced, removal, docs } = deprecated;
    return {
      stage: 'deprecated',
      deprecation: { message, introduced, removal, docs },
    };
  }

  const experimental = operation[EXPERIMENTAL_EXTENSION];
  if (experimental) {
    /** @type {OperationRelease} */
    const result = { stage: 'beta' };
    if (isPlainObject(experimental)) {
      if (typeof experimental.introduced === 'string') {
        result.introduced = experimental.introduced;
      }
      if (typeof experimental.docs === 'string') {
        result.docs = experimental.docs;
      }
    }
    return result;
  }

  return undefined;
}

/**
 * Whether calling the operation needs the opt-in header: `stage: beta` (or
 * `unreleased`), or an old `x-glean-experimental` annotation. An operation
 * with both old annotations still needs it.
 *
 * @param {unknown} operation
 * @returns {boolean}
 */
export function requiresOptIn(operation) {
  if (!isPlainObject(operation)) return false;

  const release = operation[RELEASE_EXTENSION];
  if (release !== undefined) {
    return isPlainObject(release) && OPT_IN_STAGES.has(release.stage);
  }

  return Boolean(operation[EXPERIMENTAL_EXTENSION]);
}
