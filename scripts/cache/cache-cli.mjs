#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';
import { logger } from '@docusaurus/logger';
import { BuildCache } from './BuildCache.mjs';
import { OpenAPICache } from './openapi-cache.mjs';
import { ChangelogCache } from './changelog-cache.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const verbose = process.env.VERBOSE === 'true' || process.argv.includes('--verbose');

function printUsage() {
  logger.info('Cache management utility for Glean Developer Site');
  logger.newLine();
  logger.info('Usage: cache-cli.mjs <command> [options]');
  logger.newLine();
  logger.info('Commands:');
  logger.info('  clear [category]    Clear cache (all or specific category)');
  logger.info('  stats               Show cache statistics');
  logger.info('  rebuild             Clear cache and rebuild');
  logger.info('  validate            Validate cache integrity');
  logger.newLine();
  logger.info('Categories:');
  logger.info('  openapi             OpenAPI documentation cache');
  logger.info('  changelog           Changelog and RSS feed cache');
  logger.newLine();
  logger.info('Options:');
  logger.info('  --verbose           Show detailed output');
  logger.info('  --help              Show this help message');
  logger.newLine();
  logger.info('Examples:');
  logger.info('  cache-cli.mjs clear              # Clear all cache');
  logger.info('  cache-cli.mjs clear openapi      # Clear OpenAPI cache only');
  logger.info('  cache-cli.mjs stats              # Show cache statistics');
  logger.info('  cache-cli.mjs rebuild            # Clear and rebuild everything');
}

async function clearCache(category) {
  const cache = new BuildCache('.build-cache', { verbose });
  cache.initialize();
  
  if (category === 'openapi') {
    const openapiCache = new OpenAPICache({ verbose });
    openapiCache.clearCache();
  } else if (category === 'changelog') {
    const changelogCache = new ChangelogCache({ verbose });
    changelogCache.clearCache();
  } else if (category) {
    cache.clear(category);
  } else {
    cache.clear();
  }
}

function showStats() {
  const cache = new BuildCache('.build-cache', { verbose });
  cache.initialize();
  
  // Overall stats
  cache.printStats();
  
  // OpenAPI specific stats
  const openapiCache = new OpenAPICache({ verbose });
  openapiCache.printCacheStats();
  
  // Changelog specific stats
  const changelogCache = new ChangelogCache({ verbose });
  changelogCache.printCacheStats();
}

async function rebuild() {
  logger.info('Clearing all caches...');
  const cache = new BuildCache('.build-cache', { verbose });
  cache.initialize();
  cache.clear();
  
  logger.info('Rebuilding caches...');
  logger.newLine();
  
  // Rebuild changelog
  logger.info('Rebuilding changelog cache...');
  const changelogCache = new ChangelogCache({ verbose });
  const changelogSuccess = await changelogCache.generate();
  
  if (!changelogSuccess) {
    logger.error('Failed to rebuild changelog cache');
    process.exit(1);
  }
  
  // Rebuild OpenAPI
  logger.info('Rebuilding OpenAPI cache...');
  const openapiCache = new OpenAPICache({ verbose });
  const openapiSuccess = await openapiCache.generateAll();
  
  if (!openapiSuccess) {
    logger.error('Failed to rebuild OpenAPI cache');
    process.exit(1);
  }
  
  logger.success('✓ Cache rebuild complete');
  showStats();
}

async function validateCache() {
  logger.info('Validating cache integrity...');
  
  let valid = true;
  
  // Validate OpenAPI cache
  const openapiCache = new OpenAPICache({ verbose });
  if (!openapiCache.validateCache()) {
    valid = false;
  }
  
  // Validate changelog cache
  const changelogCache = new ChangelogCache({ verbose });
  if (!changelogCache.validateCache()) {
    valid = false;
  }
  
  if (valid) {
    logger.success('✓ All cache validations passed');
  } else {
    logger.error('✗ Cache validation failed');
    process.exit(1);
  }
}

// Main CLI logic
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];
  
  if (!command || command === '--help' || command === '-h') {
    printUsage();
    process.exit(0);
  }
  
  switch (command) {
    case 'clear':
      await clearCache(arg);
      break;
      
    case 'stats':
      showStats();
      break;
      
    case 'rebuild':
      await rebuild();
      break;
      
    case 'validate':
      await validateCache();
      break;
      
    default:
      logger.error(`Unknown command: ${command}`);
      logger.newLine();
      printUsage();
      process.exit(1);
  }
}

// Run the CLI
main().catch(error => {
  logger.error(`Fatal error: ${error.message}`);
  if (verbose) {
    console.error(error.stack);
  }
  process.exit(1);
});