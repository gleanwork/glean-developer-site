#!/usr/bin/env node

/**
 * Generate deprecations.json from OpenAPI specs by extracting x-glean-deprecated properties
 *
 * Usage: node scripts/generate-deprecations.mjs
 */

import { generateDeprecations } from './deprecations-lib.mjs';

generateDeprecations();
