import fs from 'node:fs';
import yaml from 'js-yaml';
import kebabCase from 'lodash/kebabCase.js';

/**
 * Shape of the `x-glean-experimental` vendor extension as authored in the
 * OpenAPI specs. Currently only used at the operation (endpoint) level.
 *
 * @example
 * x-glean-experimental:
 *   id: 4abc1e17-8e06-490b-99a7-e8f97592405a
 *   introduced: '2026-05-12'
 */
export interface XGleanExperimental {
  id?: string;
  introduced?: string;
}

export interface ExperimentalEndpoint {
  /** Uppercase HTTP method, e.g. "POST". */
  method: string;
  /** API path as written in the spec, e.g. "/agents/search". */
  path: string;
  /** Operation id from the spec, when present. */
  operationId?: string;
  /**
   * Kebab-cased id derived from the operation id (falling back to the summary).
   * This matches the last path segment of the generated doc's sidebar id
   * (e.g. "api/platform-api/platform-agents-search"), which is how the sidebar
   * link component matches an item to its experimental status.
   */
  baseId: string;
  /** Stable id from the `x-glean-experimental.id` field, when present. */
  id?: string;
  /** ISO date the endpoint was introduced, when present. */
  introduced?: string;
}

export interface ExperimentalOutput {
  endpoints: ExperimentalEndpoint[];
  generatedAt: string;
  totalCount: number;
}

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

interface OperationLike {
  operationId?: string;
  summary?: string;
  'x-glean-experimental'?: XGleanExperimental;
}

interface OpenApiDocLike {
  paths?: Record<string, Record<string, unknown>>;
}

/**
 * Compute the base doc id for an operation the same way the OpenAPI docs plugin
 * does: `kebabCase(operationId ?? summary)`.
 */
export function computeBaseId(operation: OperationLike): string {
  const source = operation.operationId ?? operation.summary ?? '';
  return kebabCase(source);
}

/**
 * Extract every operation-level `x-glean-experimental` endpoint from a single
 * parsed OpenAPI document. Pure — no IO.
 */
export function extractExperimentalEndpoints(
  spec: OpenApiDocLike,
): ExperimentalEndpoint[] {
  const endpoints: ExperimentalEndpoint[] = [];
  const paths = spec?.paths ?? {};

  for (const [apiPath, methods] of Object.entries(paths)) {
    if (!methods || typeof methods !== 'object') continue;

    for (const [method, operation] of Object.entries(methods)) {
      if (!HTTP_METHODS.includes(method as (typeof HTTP_METHODS)[number])) {
        continue;
      }
      if (!operation || typeof operation !== 'object') continue;

      const op = operation as OperationLike;
      const experimental = op['x-glean-experimental'];
      if (!experimental) continue;

      endpoints.push({
        method: method.toUpperCase(),
        path: apiPath,
        operationId: op.operationId,
        baseId: computeBaseId(op),
        ...(experimental.id ? { id: experimental.id } : {}),
        ...(experimental.introduced
          ? { introduced: experimental.introduced }
          : {}),
      });
    }
  }

  return endpoints;
}

/**
 * Build the final output object from a flat list of experimental endpoints:
 * dedupe by `method baseId`, sort by path then method, and add metadata.
 */
export function buildExperimentalOutput(
  endpoints: ExperimentalEndpoint[],
): ExperimentalOutput {
  const seen = new Set<string>();
  const deduped: ExperimentalEndpoint[] = [];
  for (const endpoint of endpoints) {
    const key = `${endpoint.method} ${endpoint.baseId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(endpoint);
  }

  deduped.sort((a, b) => {
    const pathCmp = a.path.localeCompare(b.path);
    return pathCmp !== 0 ? pathCmp : a.method.localeCompare(b.method);
  });

  return {
    endpoints: deduped,
    generatedAt: new Date().toISOString(),
    totalCount: deduped.length,
  };
}

/**
 * Read the given OpenAPI specs, extract all experimental endpoints, and write
 * the aggregated result to `outputLocation` as JSON.
 */
export async function generateExperimental(
  inputSpecs: string[],
  outputLocation: string,
): Promise<ExperimentalOutput> {
  const all: ExperimentalEndpoint[] = [];

  for (const specPath of inputSpecs) {
    if (!fs.existsSync(specPath)) {
      console.warn(`Warning: spec not found, skipping: ${specPath}`);
      continue;
    }
    let spec: OpenApiDocLike;
    try {
      spec = yaml.load(fs.readFileSync(specPath, 'utf8')) as OpenApiDocLike;
    } catch (error) {
      console.warn(
        `Warning: failed to parse ${specPath}: ${(error as Error).message}`,
      );
      continue;
    }
    all.push(...extractExperimentalEndpoints(spec));
  }

  const output = buildExperimentalOutput(all);
  fs.writeFileSync(outputLocation, JSON.stringify(output, null, 2) + '\n');
  return output;
}
