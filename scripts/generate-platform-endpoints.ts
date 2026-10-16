#!/usr/bin/env tsx

/**
 * Generate platform-endpoints.json from the Platform OpenAPI spec by grouping
 * operations by tag.
 *
 * The output is consumed by src/components/ApiOverview, which renders the
 * "API Endpoints" table on each Platform API family overview page
 * (docs/api/platform-api/*-overview.mdx). Generating it keeps those tables in
 * step with the spec when endpoints are added.
 *
 * Usage: pnpm generate:platform-endpoints
 */

import { generatePlatformEndpoints } from './platform-endpoints-lib';
import { openApiPluginOptions } from '../openapi.config';

const { specPath, outputDir } = openApiPluginOptions.config.platform;

try {
  const data = generatePlatformEndpoints(
    specPath,
    // outputDir is docs-relative ("docs/api/platform-api"); doc ids drop "docs/".
    outputDir.replace(/^docs\//, ''),
    './src/data/platform-endpoints.json',
  );
  const families = Object.keys(data.families);
  console.log(
    `Wrote platform-endpoints.json with ${families.length} families: ${families.join(', ')}`,
  );
} catch (error) {
  console.error('Error generating Platform API endpoints:', error);
  process.exit(1);
}
