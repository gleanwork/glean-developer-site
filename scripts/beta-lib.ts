import fs from 'node:fs';
import * as yaml from 'js-yaml';
import kebabCase from 'lodash/kebabCase.js';
import type { BetaEndpoint, BetaData, HttpMethod } from '../src/types/beta';
import { getOperationRelease, requiresOptIn } from './release-lib.mjs';

// Re-export the shared contract so callers/tests can import from one place.
export type { BetaEndpoint, BetaData, HttpMethod };

/**
 * A spec to scan together with the doc-id prefix its operations are generated
 * under (the plugin's `outputDir` minus the leading `docs/`), e.g.
 * `api/platform-api` or `api/client-api/activity`.
 */
export interface BetaSource {
  specPath: string;
  docIdPrefix: string;
}

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

interface OperationLike {
  operationId?: string;
  summary?: string;
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
 * Extract every operation that needs the opt-in header, which is
 * `x-glean-release` with `stage: beta`, from a single parsed OpenAPI document.
 * Pure — no IO.
 *
 * @param docIdPrefix The generated doc-id prefix for this spec (the plugin's
 *   `outputDir` without the leading `docs/`), used to build each endpoint's
 *   full `docId`.
 */
export function extractBetaEndpoints(
  spec: OpenApiDocLike,
  docIdPrefix: string,
): BetaEndpoint[] {
  const endpoints: BetaEndpoint[] = [];
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
      if (!requiresOptIn(op)) continue;

      const introduced = getOperationRelease(op)?.introduced;
      const baseId = computeBaseId(op);

      endpoints.push({
        method: method.toUpperCase() as HttpMethod,
        path: apiPath,
        operationId: op.operationId,
        baseId,
        docId: `${prefix}/${baseId}`,
        ...(introduced ? { introduced } : {}),
      });
    }
  }

  return endpoints;
}

/**
 * Build the final data object from a flat list of beta endpoints:
 * dedupe by `docId`, sort by path then method, and add metadata.
 */
export function buildBetaData(endpoints: BetaEndpoint[]): BetaData {
  const seen = new Set<string>();
  const deduped: BetaEndpoint[] = [];
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
 * Read the given specs, extract all beta endpoints (with full doc ids),
 * and write the aggregated result to `outputLocation` as JSON.
 */
export async function generateBeta(
  sources: BetaSource[],
  outputLocation: string,
): Promise<BetaData> {
  const all: BetaEndpoint[] = [];

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
    all.push(...extractBetaEndpoints(spec, docIdPrefix));
  }

  const data = buildBetaData(all);
  fs.writeFileSync(outputLocation, JSON.stringify(data, null, 2) + '\n');
  return data;
}
