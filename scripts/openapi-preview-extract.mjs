#!/usr/bin/env node

/**
 * Extract one operation from an OpenAPI spec into a standalone preview spec:
 * the operation, plus every component it references (directly or through
 * other components), so all `$ref`s resolve inside the output file.
 *
 * Used for preview-only API reference pages (see openapi/preview/README.md).
 * Run by hand through `pnpm preview-api:refresh`; no workflow runs it.
 *
 * Transforms, mirroring what the published final spec does for the same
 * operation, so the page reads like the rest of the Platform API reference:
 *   - Prefixes the path with the source server's base path (`/api`), because
 *     openapi-server-url.mjs then rewrites servers to a bare origin.
 *   - Injects the `X-Glean-Include-Experimental` header on opt-in operations,
 *     as openapi-capitalize-language.mjs does for the final specs.
 *   - Drops `x-glean-sdk`: no SDK exposes a held-back operation.
 *
 * Usage:
 *   node scripts/openapi-preview-extract.mjs <spec.yaml|url> <method> <path> <output.yaml>
 */

import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';
import { injectExperimentalHeaders } from './openapi-capitalize-language.mjs';

const [source, rawMethod, operationPath, output] = process.argv.slice(2);

if (!source || !rawMethod || !operationPath || !output) {
  console.error(
    'Usage: node scripts/openapi-preview-extract.mjs <spec.yaml|url> <method> <path> <output.yaml>',
  );
  process.exit(1);
}

const method = rawMethod.toLowerCase();

async function readSpec(input) {
  if (/^https?:\/\//.test(input)) {
    const res = await fetch(input);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching ${input}`);
    }
    return yaml.load(await res.text());
  }
  return yaml.load(fs.readFileSync(input, 'utf8'));
}

function collectRefs(node, found) {
  if (Array.isArray(node)) {
    for (const item of node) collectRefs(item, found);
  } else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === '$ref' && typeof value === 'string') found.add(value);
      else collectRefs(value, found);
    }
  }
}

/** Every `#/components/<type>/<name>` reachable from `root`. */
function reachableComponents(spec, root) {
  const seen = new Set();
  const queue = new Set();
  collectRefs(root, queue);

  while (queue.size > 0) {
    const [ref] = queue;
    queue.delete(ref);
    if (seen.has(ref)) continue;

    const match = ref.match(/^#\/components\/([^/]+)\/([^/]+)$/);
    if (!match) {
      throw new Error(`Unsupported $ref (only local components): ${ref}`);
    }
    const [, type, name] = match;
    const target = spec.components?.[type]?.[name];
    if (target === undefined) {
      throw new Error(`Unresolved $ref: ${ref}`);
    }
    seen.add(ref);
    collectRefs(target, queue);
  }
  return seen;
}

/** The base path of the first server URL, e.g. `/api`, or '' for none. */
function serverBasePath(spec) {
  const url = spec.servers?.[0]?.url;
  if (!url) return '';
  const pathname = new URL(url.replace(/\{[^}]+\}/g, 'x')).pathname;
  return pathname.replace(/\/+$/, '');
}

async function main() {
  const spec = await readSpec(source);

  const operation = spec.paths?.[operationPath]?.[method];
  if (!operation) {
    throw new Error(
      `${method.toUpperCase()} ${operationPath} not found in ${source}`,
    );
  }

  const { 'x-glean-sdk': _sdk, ...previewOperation } = operation;

  const security = operation.security ?? spec.security;
  const refs = reachableComponents(spec, previewOperation);
  for (const requirement of security ?? []) {
    for (const scheme of Object.keys(requirement)) {
      refs.add(`#/components/securitySchemes/${scheme}`);
    }
  }

  // Walk the source in order so the output keeps upstream ordering.
  const components = {};
  for (const [type, entries] of Object.entries(spec.components ?? {})) {
    for (const [name, value] of Object.entries(entries ?? {})) {
      if (refs.has(`#/components/${type}/${name}`)) {
        components[type] ??= {};
        components[type][name] = value;
      }
    }
  }

  const preview = {
    openapi: spec.openapi,
    info: {
      ...spec.info,
      'x-preview-extract': {
        source,
        operation: `${method.toUpperCase()} ${operationPath}`,
        refresh: 'pnpm preview-api:refresh',
      },
    },
    servers: spec.servers,
    ...(security ? { security } : {}),
    paths: {
      [`${serverBasePath(spec)}${operationPath}`]: {
        [method]: previewOperation,
      },
    },
    components,
  };

  injectExperimentalHeaders(preview);

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, yaml.dump(preview, { lineWidth: -1, noRefs: true }));

  const counts = Object.entries(components)
    .map(([type, entries]) => `${Object.keys(entries).length} ${type}`)
    .join(', ');
  console.log(
    `Wrote ${method.toUpperCase()} ${operationPath} to ${output} (${counts})`,
  );
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
