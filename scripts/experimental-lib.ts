import fs from 'node:fs';
import yaml from 'js-yaml';
import kebabCase from 'lodash/kebabCase.js';
import type {
  ExperimentalEndpoint,
  ExperimentalData,
  HttpMethod,
} from '../src/types/experimental';

// Re-export the shared contract so callers/tests can import from one place.
export type { ExperimentalEndpoint, ExperimentalData, HttpMethod };

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

/**
 * A spec to scan together with the doc-id prefix its operations are generated
 * under (the plugin's `outputDir` minus the leading `docs/`), e.g.
 * `api/platform-api` or `api/client-api/activity`.
 */
export interface ExperimentalSource {
  specPath: string;
  docIdPrefix: string;
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
 *
 * @param docIdPrefix The generated doc-id prefix for this spec (the plugin's
 *   `outputDir` without the leading `docs/`), used to build each endpoint's
 *   full `docId`.
 */
export function extractExperimentalEndpoints(
  spec: OpenApiDocLike,
  docIdPrefix: string,
): ExperimentalEndpoint[] {
  const endpoints: ExperimentalEndpoint[] = [];
  const paths = spec?.paths ?? {};
  const prefix = docIdPrefix.replace(/\/+$/, '');

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

      const baseId = computeBaseId(op);

      endpoints.push({
        method: method.toUpperCase() as HttpMethod,
        path: apiPath,
        operationId: op.operationId,
        baseId,
        docId: `${prefix}/${baseId}`,
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
 * Build the final data object from a flat list of experimental endpoints:
 * dedupe by `docId`, sort by path then method, and add metadata.
 */
export function buildExperimentalData(
  endpoints: ExperimentalEndpoint[],
): ExperimentalData {
  const seen = new Set<string>();
  const deduped: ExperimentalEndpoint[] = [];
  for (const endpoint of endpoints) {
    if (seen.has(endpoint.docId)) continue;
    seen.add(endpoint.docId);
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
 * Read the given specs, extract all experimental endpoints (with full doc ids),
 * and write the aggregated result to `outputLocation` as JSON.
 */
export async function generateExperimental(
  sources: ExperimentalSource[],
  outputLocation: string,
): Promise<ExperimentalData> {
  const all: ExperimentalEndpoint[] = [];

  for (const { specPath, docIdPrefix } of sources) {
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
    all.push(...extractExperimentalEndpoints(spec, docIdPrefix));
  }

  const data = buildExperimentalData(all);
  fs.writeFileSync(outputLocation, JSON.stringify(data, null, 2) + '\n');
  return data;
}
