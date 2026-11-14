#!/usr/bin/env tsx

/**
 * Generate experimental.json from OpenAPI specs by extracting beta operations
 * (x-glean-release with stage: beta, or the older x-glean-experimental).
 *
 * The output is consumed by:
 *   - src/theme/DocSidebarItem/Link (renders a "Beta" sidebar tag)
 *
 * The on-page stage badge is generated separately at gen-api-docs time from
 * the operation's lifecycle extensions (see
 * scripts/generator/customMdGenerators.ts).
 *
 * Sources are derived from openapi.config.ts so each endpoint's full doc id
 * (API family + baseId) is computed from the same `outputDir` the docs plugin
 * uses — the sidebar then matches on the exact doc id.
 *
 * Usage: pnpm generate:experimental
 */

import {
  generateExperimental,
  type ExperimentalSource,
} from './experimental-lib';
import { openApiPluginOptions } from '../openapi.config';

const sources: ExperimentalSource[] = Object.values(
  openApiPluginOptions.config,
).map((entry) => ({
  specPath: entry.specPath,
  // outputDir is the docs-relative dir (e.g. "docs/api/platform-api"); the doc
  // id prefix drops the leading "docs/" (e.g. "api/platform-api").
  docIdPrefix: entry.outputDir.replace(/^docs\//, ''),
}));

async function main() {
  await generateExperimental(sources, './src/data/experimental.json');
}

main().catch((error) => {
  console.error('Error generating experimental endpoints:', error);
  process.exit(1);
});
