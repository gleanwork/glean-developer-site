import fs from 'node:fs';
import { find, type ISearchResult } from 'openapi-field-finder';
import {
  DEPRECATED_EXTENSION,
  RELEASE_EXTENSION,
  getReleaseDeprecation,
  getReleaseEnumValueDeprecations,
} from './release-lib.mjs';

interface XGleanDeprecatedBase {
  id: string;
  message: string;
  introduced: string;
  removal: string;
  docs?: string;
}

export interface XGleanDeprecatedObject extends XGleanDeprecatedBase {}
export interface XGleanDeprecatedEnumProperty extends XGleanDeprecatedBase {
  kind: 'property';
}
export interface XGleanDeprecatedEnumValue extends XGleanDeprecatedBase {
  kind: 'enum-value';
  'enum-value': string;
}

export type XGleanDeprecatedArrayElement =
  XGleanDeprecatedEnumProperty | XGleanDeprecatedEnumValue;

export type XGleanDeprecated =
  XGleanDeprecatedObject | XGleanDeprecatedArrayElement[];

interface XGleanReleaseDeprecation {
  message?: string;
  introduced?: string;
  removal?: string;
  docs?: string;
  'enum-value'?: string;
}

interface XGleanReleaseObject {
  stage: string;
  docs?: string;
  deprecation?: XGleanReleaseDeprecation;
}

interface XGleanReleaseEnumValue {
  stage: string;
  'enum-value'?: string;
  docs?: string;
  deprecation?: XGleanReleaseDeprecation;
}

/**
 * `x-glean-release`, which replaces `x-glean-deprecated`. The object form sets
 * the node's stage. The list form only deprecates enum values.
 */
export type XGleanRelease = XGleanReleaseObject | XGleanReleaseEnumValue[];

/**
 * Search results keyed by dot path. Keys end in `.x-glean-deprecated` or
 * `.x-glean-release`.
 */
export type LifecycleSearchResult = ISearchResult<
  XGleanDeprecated | XGleanRelease
>;

export type DeprecationType = 'endpoint' | 'parameter' | 'field' | 'enum-value';

export interface DeprecationItem {
  id: string;
  type: DeprecationType;
  name: string;
  message: string;
  introduced: string;
  removal: string;
  docs?: string;
  enumValue?: string;
}

export interface EndpointGroup {
  method: string;
  path: string;
  deprecations: DeprecationItem[];
}

export interface DeprecationsOutput {
  endpoints: EndpointGroup[];
  generatedAt: string;
  totalCount: number;
}

export async function generateDeprecations(
  inputSpecs: string[],
  outputLocation: string,
  extraEndpoints?: EndpointGroup[],
) {
  const deprecations: LifecycleSearchResult = {
    ...(await find<XGleanDeprecated>(DEPRECATED_EXTENSION, inputSpecs)),
    ...(await find<XGleanRelease>(RELEASE_EXTENSION, inputSpecs)),
  };

  const output = convertToDeprecationsOutput(deprecations, extraEndpoints);
  fs.writeFileSync(outputLocation, JSON.stringify(output, null, 2) + '\n');
}

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

interface ParsedPath {
  apiPath: string;
  method: string | null;
  context: string[];
}

const ANNOTATION_SUFFIX = /\.(x-glean-deprecated|x-glean-release)$/;

/** The dot path of the node that carries the annotation. */
function nodePath(dotPath: string): string {
  return dotPath.replace(ANNOTATION_SUFFIX, '');
}

/**
 * Parse a dot-notation path to extract endpoint info
 * @example "paths./users.get.x-glean-deprecated" → { apiPath: "/users", method: "GET", context: [] }
 * @example "paths./users.get.parameters.0.x-glean-release" → { apiPath: "/users", method: "GET", context: ["parameters", "0"] }
 */
function parseDotPath(dotPath: string): ParsedPath | null {
  const withoutProperty = nodePath(dotPath);
  if (!withoutProperty.startsWith('paths.')) return null;

  const parts = withoutProperty.slice(6).split('.');
  const methodIndex = parts.findIndex((p) =>
    HTTP_METHODS.includes(p as (typeof HTTP_METHODS)[number]),
  );

  if (methodIndex === -1) {
    // Path-level (no HTTP method) - e.g., path-level parameters
    const keywordIndex = parts.findIndex((p) => p === 'parameters');
    if (keywordIndex === -1) return null;

    return {
      apiPath: parts.slice(0, keywordIndex).join('.'),
      method: null,
      context: parts.slice(keywordIndex),
    };
  }

  return {
    apiPath: parts.slice(0, methodIndex).join('.'),
    method: parts[methodIndex].toUpperCase(),
    context: parts.slice(methodIndex + 1),
  };
}

/**
 * Determine deprecation type from context path
 */
function getDeprecationType(context: string[]): DeprecationType {
  if (context.length === 0) return 'endpoint';
  if (context[0] === 'parameters') return 'parameter';
  return 'field';
}

/**
 * Extract name from context path
 */
function extractName(context: string[], endpointKey: string): string {
  if (context.length === 0) return endpointKey;

  // Parameter: use index as name (actual name not available without spec)
  if (context[0] === 'parameters' && context.length >= 2) {
    return `param[${context[1]}]`;
  }

  // Field: find property name in context
  const propsIndex = context.lastIndexOf('properties');
  if (propsIndex !== -1 && context.length > propsIndex + 1) {
    return context[propsIndex + 1];
  }

  return context.includes('schema') ? 'schema' : context.at(-1) || 'unknown';
}

/**
 * A stable id for an `x-glean-release` deprecation, which has no id of its
 * own. The page and the RSS feed use it to tell entries apart.
 */
function releaseDeprecationId(
  endpointKey: string,
  type: DeprecationType,
  name: string,
  enumValue?: string,
): string {
  return [endpointKey, type, name, enumValue].filter(Boolean).join(' ');
}

/**
 * The deprecation items that one `x-glean-release` annotation produces: one
 * for a deprecated node, or one per deprecated enum value.
 */
function releaseDeprecationItems(
  value: XGleanRelease,
  endpointKey: string,
  type: DeprecationType,
  name: string,
): DeprecationItem[] {
  const node = { [RELEASE_EXTENSION]: value };
  const own = getReleaseDeprecation(node);
  const items: DeprecationItem[] = own
    ? [
        createDeprecationItem(
          {
            ...own,
            id: releaseDeprecationId(endpointKey, type, name),
          } as XGleanDeprecatedBase,
          type,
          name,
        ),
      ]
    : [];

  for (const { enumValue, deprecation } of getReleaseEnumValueDeprecations(
    node,
  )) {
    items.push(
      createDeprecationItem(
        {
          ...deprecation,
          id: releaseDeprecationId(endpointKey, 'enum-value', name, enumValue),
        } as XGleanDeprecatedBase,
        'enum-value',
        name,
        enumValue,
      ),
    );
  }

  return items;
}

/**
 * Create a DeprecationItem from x-glean-deprecated data
 */
function createDeprecationItem(
  deprecated: XGleanDeprecatedBase,
  type: DeprecationType,
  name: string,
  enumValue?: string,
): DeprecationItem {
  const item: DeprecationItem = {
    id: deprecated.id,
    type,
    name,
    message: deprecated.message,
    introduced: deprecated.introduced,
    removal: deprecated.removal,
  };
  if (deprecated.docs) item.docs = deprecated.docs;
  if (enumValue) item.enumValue = enumValue;
  return item;
}

export function convertToDeprecationsOutput(
  results: LifecycleSearchResult,
  extraEndpoints?: EndpointGroup[],
): DeprecationsOutput {
  const endpoints = new Map<string, EndpointGroup>();

  // A node with x-glean-release ignores its x-glean-deprecated.
  const releaseNodes = new Set(
    Object.keys(results)
      .filter((dotPath) => dotPath.endsWith(`.${RELEASE_EXTENSION}`))
      .map(nodePath),
  );

  // Merge extra endpoints first (for local testing)
  if (extraEndpoints) {
    for (const extra of extraEndpoints) {
      const key = `${extra.method} ${extra.path}`;
      if (!endpoints.has(key)) {
        endpoints.set(key, {
          method: extra.method,
          path: extra.path,
          deprecations: [...extra.deprecations],
        });
      } else {
        endpoints.get(key)!.deprecations.push(...extra.deprecations);
      }
    }
  }

  for (const [dotPath, value] of Object.entries(results)) {
    const isRelease = dotPath.endsWith(`.${RELEASE_EXTENSION}`);
    if (!isRelease && releaseNodes.has(nodePath(dotPath))) continue;

    const parsed = parseDotPath(dotPath);
    if (!parsed) continue;

    const { apiPath, context } = parsed;
    const methods = parsed.method ? [parsed.method] : [];

    // Skip path-level items without methods for now
    // (would need spec to know which methods exist)
    if (methods.length === 0) continue;

    for (const method of methods) {
      const key = `${method} ${apiPath}`;

      if (!endpoints.has(key)) {
        endpoints.set(key, { method, path: apiPath, deprecations: [] });
      }

      const endpoint = endpoints.get(key)!;
      const type = getDeprecationType(context);
      const name = extractName(context, key);

      if (isRelease) {
        endpoint.deprecations.push(
          ...releaseDeprecationItems(value as XGleanRelease, key, type, name),
        );
        continue;
      }

      const legacy = value as XGleanDeprecated;
      if (Array.isArray(legacy)) {
        // Enum value deprecations (array format)
        for (const item of legacy) {
          if ('kind' in item && item.kind === 'enum-value') {
            endpoint.deprecations.push(
              createDeprecationItem(
                item,
                'enum-value',
                name,
                item['enum-value'],
              ),
            );
          } else if ('kind' in item && item.kind === 'property') {
            endpoint.deprecations.push(createDeprecationItem(item, type, name));
          }
        }
      } else {
        endpoint.deprecations.push(createDeprecationItem(legacy, type, name));
      }
    }
  }

  // Deduplicate by id within each endpoint
  for (const endpoint of endpoints.values()) {
    const seen = new Set<string>();
    endpoint.deprecations = endpoint.deprecations.filter((d) => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
  }

  // x-glean-release is also on beta and GA nodes, which deprecate nothing.
  const allEndpoints = Array.from(endpoints.values())
    .filter((ep) => ep.deprecations.length > 0)
    .sort((a, b) => {
      const pathCmp = a.path.localeCompare(b.path);
      return pathCmp !== 0 ? pathCmp : a.method.localeCompare(b.method);
    });

  const totalCount = allEndpoints.reduce(
    (sum, ep) => sum + ep.deprecations.length,
    0,
  );

  return {
    endpoints: allEndpoints,
    generatedAt: new Date().toISOString(),
    totalCount,
  };
}
