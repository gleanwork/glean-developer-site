import fs from 'node:fs';
import * as yaml from 'js-yaml';
import { computeBaseId } from './experimental-lib';
import type { HttpMethod } from '../src/types/experimental';
import type {
  PlatformEndpoint,
  PlatformEndpointsData,
} from '../src/types/platformEndpoints';

export type { PlatformEndpoint, PlatformEndpointsData };

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

interface OperationLike {
  operationId?: string;
  summary?: string;
  tags?: string[];
}

interface OpenApiDocLike {
  paths?: Record<string, Record<string, unknown>>;
}

/** "IdP Groups" → "idp-groups". The key overview pages pass as `apiFamily`. */
export function familyKey(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * The HTTP path a client calls for a spec path key.
 *
 * The Platform spec models SDK method variants, such as streaming, as extra
 * path keys with a URL fragment (`/api/chat#stream`). The fragment exists only
 * so Speakeasy generates a separate SDK method. HTTP clients call the base path
 * and select the variant in the request body, so the docs show the base path.
 */
export function httpPath(specPath: string): string {
  const fragment = specPath.indexOf('#');
  return fragment === -1 ? specPath : specPath.slice(0, fragment);
}

/**
 * Group every operation in a parsed Platform spec by its first tag. Pure — no
 * IO. Families and their endpoints keep spec order, so the output is stable
 * across runs and a regenerated file only changes when the spec does.
 *
 * Operations without a tag are skipped: they have no family overview page.
 * SDK-only variant operations (`/api/chat#stream`) keep their own row, summary
 * and doc link, but show the HTTP path they are sent to.
 */
export function extractPlatformEndpoints(
  spec: OpenApiDocLike,
  docIdPrefix: string,
): PlatformEndpointsData {
  const prefix = docIdPrefix.replace(/\/+$/, '');
  const families: PlatformEndpointsData['families'] = {};

  for (const [apiPath, methods] of Object.entries(spec?.paths ?? {})) {
    if (!methods || typeof methods !== 'object') continue;

    for (const [method, operation] of Object.entries(methods)) {
      if (!HTTP_METHODS.includes(method as (typeof HTTP_METHODS)[number])) {
        continue;
      }
      if (!operation || typeof operation !== 'object') continue;

      const op = operation as OperationLike;
      const tag = op.tags?.[0];
      if (!tag) continue;

      const key = familyKey(tag);
      const family = (families[key] ??= { tag, endpoints: [] });
      const endpoint: PlatformEndpoint = {
        method: method.toUpperCase() as HttpMethod,
        path: httpPath(apiPath),
        summary: op.summary ?? op.operationId ?? apiPath,
        docId: `${prefix}/${computeBaseId(op)}`,
      };
      family.endpoints.push(endpoint);
    }
  }

  return { families };
}

/** Serialize the data the way it is committed: two-space JSON, newline. */
export function serializePlatformEndpoints(
  data: PlatformEndpointsData,
): string {
  return JSON.stringify(data, null, 2) + '\n';
}

/**
 * Read the Platform spec, group its endpoints by tag, and write the result to
 * `outputLocation` as JSON.
 */
export function generatePlatformEndpoints(
  specPath: string,
  docIdPrefix: string,
  outputLocation: string,
): PlatformEndpointsData {
  const spec = yaml.load(fs.readFileSync(specPath, 'utf8')) as OpenApiDocLike;
  const data = extractPlatformEndpoints(spec, docIdPrefix);
  fs.writeFileSync(outputLocation, serializePlatformEndpoints(data));
  return data;
}
