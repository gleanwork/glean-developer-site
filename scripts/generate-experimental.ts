#!/usr/bin/env tsx

/**
 * Generate experimental.json from OpenAPI specs by extracting operation-level
 * x-glean-experimental properties.
 *
 * The output is consumed by:
 *   - src/theme/DocSidebarItem/Link (renders an "Experimental" sidebar tag)
 *
 * The on-page banner is generated separately at gen-api-docs time from the
 * x-glean-experimental extension on the operation (see
 * scripts/generator/customMdGenerators.ts).
 *
 * Usage: pnpm generate:experimental
 */

import { generateExperimental } from './experimental-lib';

async function main() {
  await generateExperimental(
    [
      './openapi/client/client-capitalized.yaml',
      './openapi/indexing/indexing-capitalized.yaml',
      './openapi/platform/platform-capitalized.yaml',
    ],
    './src/data/experimental.json',
  );
}

main().catch((error) => {
  console.error('Error generating experimental endpoints:', error);
  process.exit(1);
});
