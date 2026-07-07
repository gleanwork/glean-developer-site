#!/usr/bin/env tsx

import {
  loadPlatformErrorsOutput,
  writePlatformErrorDocs,
} from './platform-errors-lib';

const output = loadPlatformErrorsOutput(
  './openapi/platform/platform-capitalized.yaml',
  './src/data/platform-error-remediations.yaml',
);

writePlatformErrorDocs(output, {
  dataPath: './src/data/platform-errors.json',
  docsDir: './docs/errors',
});
