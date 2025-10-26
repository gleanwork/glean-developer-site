#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { logger, PerfLogger } from '@docusaurus/logger';
import { BuildCache } from './BuildCache.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..', '..');

export class OpenAPICache {
  constructor(options = {}) {
    this.verbose = options.verbose || 
                   process.env.VERBOSE === 'true' || 
                   process.argv.includes('--verbose');
    this.cache = new BuildCache('.build-cache', { verbose: this.verbose });
    this.cache.initialize();
    
    this.clientAPIs = [
      'activity', 'announcements', 'answers', 'authentication', 
      'chat', 'agents', 'collections', 'documents', 'insights', 
      'messages', 'pins', 'search', 'entities', 'shortcuts', 
      'summarize', 'verification', 'tools', 'governance'
    ];
  }

  log(message, level = 'info') {
    // Pass through to cache's log method
    this.cache.log(message, level);
  }

  async fetchSpec(url) {
    try {
      this.log(`Fetching OpenAPI spec from: ${url}`, 'verbose');
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      logger.error(`Failed to fetch spec from ${url}: ${error.message}`);
      return null;
    }
  }

  getLocalSpecPath(api, subApi = null) {
    if (api === 'indexing') {
      return path.join(ROOT_DIR, 'openapi', 'indexing', 'indexing-capitalized.yaml');
    } else if (api === 'client' && subApi) {
      return path.join(ROOT_DIR, 'openapi', 'client', 'split-apis', `${subApi}.yaml`);
    } else if (api === 'client') {
      return path.join(ROOT_DIR, 'openapi', 'client', 'client-capitalized.yaml');
    }
    return null;
  }

  getSpecContentSync(api, subApi = null) {
    const specPath = this.getLocalSpecPath(api, subApi);
    if (!specPath || !fs.existsSync(specPath)) {
      return '';
    }
    return fs.readFileSync(specPath, 'utf8');
  }

  calculateCacheKey(specContent, api, subApi = null) {
    const parts = [
      specContent,
      api,
      subApi || '',
      process.env.NODE_ENV || 'development',
      '1.0.0' // Cache version
    ];
    return this.cache.calculateHash(parts.join('|'));
  }

  getApiOutputDir(api, subApi = null) {
    if (api === 'indexing') {
      return path.join(ROOT_DIR, 'docs', 'api', 'indexing-api');
    } else if (api === 'client' && subApi) {
      return path.join(ROOT_DIR, 'docs', 'api', 'client-api', subApi);
    }
    return null;
  }

  preserveOverviewFiles(outputDir) {
    const overviewFiles = [];
    const patterns = ['overview.mdx', '-overview.mdx'];
    
    if (fs.existsSync(outputDir)) {
      const files = fs.readdirSync(outputDir);
      for (const file of files) {
        if (patterns.some(pattern => file.endsWith(pattern))) {
          const filePath = path.join(outputDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          overviewFiles.push({ name: file, content });
          this.log(`Preserved overview file: ${file}`, 'verbose');
        }
      }
    }
    
    return overviewFiles;
  }

  restoreOverviewFiles(outputDir, overviewFiles) {
    for (const file of overviewFiles) {
      const filePath = path.join(outputDir, file.name);
      fs.writeFileSync(filePath, file.content);
      this.log(`Restored overview file: ${file.name}`, 'verbose');
    }
  }

  cleanApiDirectory(outputDir, preserveOverview = true) {
    if (!fs.existsSync(outputDir)) {
      return [];
    }

    let overviewFiles = [];
    if (preserveOverview) {
      overviewFiles = this.preserveOverviewFiles(outputDir);
    }

    // Remove all files except overview files
    const files = fs.readdirSync(outputDir);
    for (const file of files) {
      const filePath = path.join(outputDir, file);
      const isOverview = file.endsWith('overview.mdx') || file.endsWith('-overview.mdx');
      
      if (!isOverview || !preserveOverview) {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
      }
    }

    return overviewFiles;
  }

  runCommand(command, description = null) {
    if (description && this.verbose) {
      this.log(description, 'verbose');
    }
    
    this.log(`$ ${command}`, 'verbose');
    
    try {
      execSync(command, { 
        cwd: ROOT_DIR,
        stdio: this.verbose ? 'inherit' : 'pipe'
      });
      return true;
    } catch (error) {
      logger.error(`Command failed: ${command}`);
      if (!this.verbose && error.stdout) {
        logger.error(error.stdout.toString());
      }
      if (!this.verbose && error.stderr) {
        logger.error(error.stderr.toString());
      }
      return false;
    }
  }

  async generateIndexingAPI() {
    const specContent = this.getSpecContentSync('indexing');
    const cacheKey = this.calculateCacheKey(specContent, 'indexing');
    
    if (this.cache.isValid('openapi', 'indexing', cacheKey)) {
      const outputDir = this.getApiOutputDir('indexing');
      if (this.cache.restoreDirectory('openapi', 'indexing', outputDir)) {
        this.log('✓ Using cached indexing API documentation', 'verbose');
        return true;
      }
    }

    this.log('⟳ Regenerating indexing API documentation', 'verbose');
    
    const outputDir = this.getApiOutputDir('indexing');
    const overviewFiles = this.cleanApiDirectory(outputDir);
    
    this.log('Generating indexing API documentation', 'verbose');
    const success = this.runCommand(
      'yarn docusaurus gen-api-docs indexing',
      'Running docusaurus gen-api-docs for indexing'
    );
    
    if (success) {
      this.restoreOverviewFiles(outputDir, overviewFiles);
      this.cache.storeDirectory('openapi', 'indexing', outputDir, cacheKey, ['overview.mdx']);
      return true;
    }
    
    return false;
  }

  async generateClientAPIs() {
    const results = [];
    let cachedCount = 0;
    let generatedCount = 0;
    
    // First check if all client sub-APIs are already cached
    const allClientApisCached = this.clientAPIs.every(subApi => {
      const specContent = this.getSpecContentSync('client', subApi);
      const cacheKey = this.calculateCacheKey(specContent, 'client', subApi);
      return this.cache.isValid('openapi', `client-${subApi}`, cacheKey);
    });

    if (allClientApisCached) {
      logger.success('✓ All client OpenAPI sub-APIs are cached, skipping transformation');
    } else {
      // Only run these expensive transformation steps if we need to regenerate any API
      this.runCommand(
        'yarn openapi:capitalize:client',
        'Capitalizing client OpenAPI spec'
      );
      
      this.runCommand(
        'yarn openapi:break:client',
        'Splitting client OpenAPI spec'
      );
    }
    
    for (const subApi of this.clientAPIs) {
      const specContent = this.getSpecContentSync('client', subApi);
      const cacheKey = this.calculateCacheKey(specContent, 'client', subApi);
      
      if (this.cache.isValid('openapi', `client-${subApi}`, cacheKey)) {
        const outputDir = this.getApiOutputDir('client', subApi);
        if (this.cache.restoreDirectory('openapi', `client-${subApi}`, outputDir)) {
          this.log(`✓ Using cached ${subApi} API documentation`, 'verbose');
          cachedCount++;
          results.push(true);
          continue;
        }
      }

      this.log(`⟳ Regenerating ${subApi} API documentation`, 'verbose');
      generatedCount++;
      
      const outputDir = this.getApiOutputDir('client', subApi);
      const overviewFiles = this.cleanApiDirectory(outputDir);
      
      this.log(`Generating ${subApi} API documentation`, 'verbose');
      const success = this.runCommand(
        `yarn docusaurus gen-api-docs ${subApi}`,
        `Running docusaurus gen-api-docs for ${subApi}`
      );
      
      if (success) {
        this.restoreOverviewFiles(outputDir, overviewFiles);
        this.cache.storeDirectory('openapi', `client-${subApi}`, outputDir, cacheKey, ['overview.mdx']);
        results.push(true);
      } else {
        results.push(false);
      }
    }
    
    // Log summary
    if (!this.verbose) {
      const cachedMsg = cachedCount > 0 ? logger.green(`${cachedCount} cached`) : logger.dim('0 cached');
      const generatedMsg = generatedCount > 0 ? logger.yellow(`${generatedCount} regenerated`) : logger.dim('0 regenerated');
      logger.info(`OpenAPI docs: ${cachedMsg}, ${generatedMsg}`);
    }
    
    return results.every(r => r === true);
  }

  async generateAll() {
    return await PerfLogger.async('Generate OpenAPI documentation', async () => {
      const startTime = Date.now();
      
      // First, ensure we have the latest specs
      await this.ensureLatestSpecs();
      
      // Generate indexing API
      const indexingResult = await this.generateIndexingAPI();
      
      // Generate client APIs
      const clientResult = await this.generateClientAPIs();
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(1);
      
      if (indexingResult && clientResult) {
        if (this.verbose) {
          logger.success(`✓ OpenAPI documentation generation complete (${duration}s)`);
        }
        return true;
      } else {
        logger.error('✗ Some OpenAPI documentation generation failed');
        return false;
      }
    });
  }

  async ensureLatestSpecs() {
    // Check if we should fetch remote specs
    const shouldFetchRemote = process.env.FETCH_REMOTE_SPECS === 'true';
    
    if (shouldFetchRemote) {
      this.log('Fetching remote OpenAPI specs...', 'verbose');
      
      const indexingUrl = process.env.INDEXING_SPEC_URL || 'https://api.glean.com/indexing/openapi.yaml';
      const clientUrl = process.env.CLIENT_SPEC_URL || 'https://api.glean.com/client/openapi.yaml';
      
      const [indexingSpec, clientSpec] = await Promise.all([
        this.fetchSpec(indexingUrl),
        this.fetchSpec(clientUrl)
      ]);
      
      if (indexingSpec) {
        const indexingPath = path.join(ROOT_DIR, 'openapi', 'indexing', 'indexing.yaml');
        fs.writeFileSync(indexingPath, indexingSpec);
        this.log('Updated indexing OpenAPI spec', 'verbose');
      }
      
      if (clientSpec) {
        const clientPath = path.join(ROOT_DIR, 'openapi', 'client', 'client.yaml');
        fs.writeFileSync(clientPath, clientSpec);
        this.log('Updated client OpenAPI spec', 'verbose');
      }
    } else {
      this.log('Using local OpenAPI specs (set FETCH_REMOTE_SPECS=true to fetch latest)', 'verbose');
    }
  }

  validateCache() {
    const issues = [];
    
    // Check indexing API
    const indexingSpec = this.getSpecContentSync('indexing');
    const indexingCacheKey = this.calculateCacheKey(indexingSpec, 'indexing');
    const indexingOutputDir = this.getApiOutputDir('indexing');
    
    if (this.cache.isValid('openapi', 'indexing', indexingCacheKey)) {
      if (!fs.existsSync(path.join(indexingOutputDir, 'sidebar.ts'))) {
        issues.push('Indexing API cache exists but output files are missing');
      }
    }
    
    // Check client APIs
    for (const subApi of this.clientAPIs) {
      const specContent = this.getSpecContentSync('client', subApi);
      const cacheKey = this.calculateCacheKey(specContent, 'client', subApi);
      const outputDir = this.getApiOutputDir('client', subApi);
      
      if (this.cache.isValid('openapi', `client-${subApi}`, cacheKey)) {
        if (!fs.existsSync(path.join(outputDir, 'sidebar.ts'))) {
          issues.push(`${subApi} API cache exists but output files are missing`);
        }
      }
    }
    
    if (issues.length > 0) {
      logger.warn('Cache validation issues found:');
      issues.forEach(issue => logger.warn(`  - ${issue}`));
      return false;
    }
    
    logger.success('✓ OpenAPI cache validation passed');
    return true;
  }

  clearCache(subApi = null) {
    if (subApi) {
      this.cache.clear(`openapi/client-${subApi}`);
      logger.success(`Cleared cache for ${subApi} API`);
    } else {
      // Clear all OpenAPI caches
      this.cache.clear('openapi');
      logger.success('Cleared all OpenAPI caches');
    }
  }

  getCacheStats() {
    const stats = {
      indexing: false,
      client: {},
      totalSize: 0,
      totalEntries: 0
    };
    
    // Check indexing
    const indexingSpec = this.getSpecContentSync('indexing');
    const indexingCacheKey = this.calculateCacheKey(indexingSpec, 'indexing');
    stats.indexing = this.cache.isValid('openapi', 'indexing', indexingCacheKey);
    
    // Check client APIs
    for (const subApi of this.clientAPIs) {
      const specContent = this.getSpecContentSync('client', subApi);
      const cacheKey = this.calculateCacheKey(specContent, 'client', subApi);
      stats.client[subApi] = this.cache.isValid('openapi', `client-${subApi}`, cacheKey);
    }
    
    // Get overall stats from cache
    const cacheStats = this.cache.getStats();
    stats.totalSize = cacheStats.totalSize;
    stats.totalEntries = cacheStats.categories.openapi || 0;
    
    return stats;
  }

  printCacheStats() {
    const stats = this.getCacheStats();
    
    logger.newLine();
    logger.info('OpenAPI Cache Status:');
    logger.info(`  Indexing API: ${stats.indexing ? logger.green('✓ Cached') : logger.yellow('✗ Not cached')}`);
    logger.info('  Client APIs:');
    
    const cached = [];
    const notCached = [];
    
    for (const [api, isCached] of Object.entries(stats.client)) {
      if (isCached) {
        cached.push(api);
      } else {
        notCached.push(api);
      }
    }
    
    if (cached.length > 0) {
      logger.info(`    Cached (${cached.length}): ${logger.green(cached.join(', '))}`);
    }
    if (notCached.length > 0) {
      logger.info(`    Not cached (${notCached.length}): ${logger.yellow(notCached.join(', '))}`);
    }
    
    logger.info(`  Total entries: ${logger.num(stats.totalEntries)}`);
    logger.info(`  Total size: ${logger.num((stats.totalSize / 1024 / 1024).toFixed(2))} MB`);
  }
}

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const cache = new OpenAPICache();
  
  switch (command) {
    case 'generate':
      await cache.generateAll();
      break;
    case 'validate':
      cache.validateCache();
      break;
    case 'stats':
      cache.printCacheStats();
      break;
    case 'clear':
      const subApi = process.argv[3];
      cache.clearCache(subApi);
      break;
    default:
      logger.info('Usage: openapi-cache.mjs [generate|validate|stats|clear [subApi]]');
  }
}