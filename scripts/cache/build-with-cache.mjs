#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger, PerfLogger } from '@docusaurus/logger';
import { BuildCache } from './BuildCache.mjs';
import { OpenAPICache } from './openapi-cache.mjs';
import { ChangelogCache } from './changelog-cache.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..', '..');

async function buildWithCache() {
  const startTime = Date.now();
  const verbose = process.env.VERBOSE === 'true' || process.argv.includes('--verbose');
  
  // Initialize cache
  const cache = new BuildCache('.build-cache', { verbose });
  cache.initialize();
  
  // Show immediate feedback
  if (!verbose) {
    logger.info('Preparing build with cache...');
  } else {
    logger.info('Starting Glean Developer Site build with cache');
  }
  
  let success = true;

  try {
    // Step 1: Generate changelog and RSS feed
    if (verbose) {
      logger.info('[Build] Step 1: Generating changelog and RSS feed');
    }
    
    const changelogCache = new ChangelogCache({ verbose });
    const changelogSuccess = await changelogCache.generate();
    
    if (!changelogSuccess) {
      logger.error('Changelog generation failed');
      success = false;
    }

    // Step 2: Generate OpenAPI documentation (if not disabled)
    if (process.env.GENERATE_API_DOCS !== 'false') {
      if (verbose) {
        logger.info('[Build] Step 2: Generating OpenAPI documentation');
      }
      
      const openapiCache = new OpenAPICache({ verbose });
      const openapiSuccess = await openapiCache.generateAll();
      
      if (!openapiSuccess) {
        logger.error('OpenAPI generation failed');
        success = false;
      }
    } else {
      if (verbose) {
        logger.info('[Build] Step 2: Skipping OpenAPI generation (GENERATE_API_DOCS=false)');
      }
    }

    // Step 3: Run Docusaurus build
    if (success) {
      if (verbose) {
        logger.info('[Build] Step 3: Running Docusaurus build');
      }
      
      // Set GENERATE_API_DOCS=false since we already handled it via cache
      const env = { ...process.env, GENERATE_API_DOCS: 'false' };
      
      await PerfLogger.async('Docusaurus build', () => {
        execSync('docusaurus build', {
          cwd: ROOT_DIR,
          stdio: 'inherit',
          env
        });
      });
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    if (success) {
      logger.newLine();
      logger.success(`✓ Build completed successfully in ${logger.num(duration)}s`);
      
      if (verbose) {
        cache.printStats();
      }
    } else {
      logger.error(`✗ Build failed after ${duration}s`);
      process.exit(1);
    }
  } catch (error) {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    logger.error(`✗ Build failed after ${duration}s with error: ${error.message}`);
    if (verbose && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the build
buildWithCache();