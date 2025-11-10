#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BuildCache } from './cache.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..', '..');

class CacheValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.cache = new BuildCache({ verbose: true });
  }

  error(message) {
    this.errors.push(message);
    console.error(`✗ ${message}`);
  }

  warn(message) {
    this.warnings.push(message);
    console.warn(`⚠ ${message}`);
  }

  success(message) {
    console.log(`✓ ${message}`);
  }

  log(message) {
    console.log(message);
  }

  validateCacheDirectory() {
    this.log('\n[1] Validating cache directory structure...');
    
    const cacheDir = path.join(ROOT_DIR, '.build-cache');
    
    if (!fs.existsSync(cacheDir)) {
      this.warn('Cache directory does not exist (.build-cache)');
      return false;
    }
    
    this.success('Cache directory exists');
    
    const lockfilePath = path.join(cacheDir, 'lockfile.json');
    if (!fs.existsSync(lockfilePath)) {
      this.warn('Lockfile does not exist');
      return false;
    }
    
    this.success('Lockfile exists');
    
    try {
      const lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
      
      if (!lockfile.version) {
        this.error('Lockfile missing version field');
      } else {
        this.success(`Lockfile version: ${lockfile.version}`);
      }
      
      if (!lockfile.targets) {
        this.error('Lockfile missing targets field');
      } else {
        this.success(`Lockfile has ${Object.keys(lockfile.targets).length} targets`);
      }
    } catch (error) {
      this.error(`Failed to parse lockfile: ${error.message}`);
      return false;
    }
    
    return true;
  }

  validateGeneratedFiles() {
    this.log('\n[2] Validating generated files...');
    
    const changelogJson = path.join(ROOT_DIR, 'src', 'data', 'changelog.json');
    const changelogXml = path.join(ROOT_DIR, 'static', 'changelog.xml');
    
    if (!fs.existsSync(changelogJson)) {
      this.error('Changelog JSON missing: src/data/changelog.json');
    } else {
      this.success('Changelog JSON exists');
      
      try {
        const data = JSON.parse(fs.readFileSync(changelogJson, 'utf8'));
        if (!data.entries || !Array.isArray(data.entries)) {
          this.error('Changelog JSON has invalid structure');
        } else {
          this.success(`Changelog has ${data.entries.length} entries`);
        }
      } catch (error) {
        this.error(`Changelog JSON is invalid: ${error.message}`);
      }
    }
    
    if (!fs.existsSync(changelogXml)) {
      this.error('RSS feed missing: static/changelog.xml');
    } else {
      this.success('RSS feed exists');
    }
  }

  validateOpenAPIFiles() {
    this.log('\n[3] Validating OpenAPI generated files...');
    
    const apiDirs = [
      { path: 'docs/api/indexing-api', name: 'Indexing API' },
      { path: 'docs/api/client-api/chat', name: 'Chat API' },
      { path: 'docs/api/client-api/search', name: 'Search API' }
    ];
    
    for (const { path: dirPath, name } of apiDirs) {
      const fullPath = path.join(ROOT_DIR, dirPath);
      
      if (!fs.existsSync(fullPath)) {
        this.error(`${name} directory missing: ${dirPath}`);
        continue;
      }
      
      const files = fs.readdirSync(fullPath);
      const mdxFiles = files.filter(f => f.endsWith('.api.mdx'));
      
      if (mdxFiles.length === 0) {
        this.warn(`${name} has no .api.mdx files`);
      } else {
        this.success(`${name} has ${mdxFiles.length} API files`);
      }
      
      const unwantedFiles = files.filter(f => 
        f === 'sidebar.ts' || f.endsWith('.info.mdx') || f.endsWith('.tag.mdx')
      );
      
      if (unwantedFiles.length > 0) {
        this.error(`${name} has unwanted artifacts: ${unwantedFiles.join(', ')}`);
      }
    }
  }

  validateOverviewFiles() {
    this.log('\n[4] Validating hand-written overview files...');
    
    const clientApis = [
      'activity', 'agents', 'announcements', 'answers', 'authentication',
      'chat', 'collections', 'documents', 'entities', 'governance',
      'insights', 'messages', 'pins', 'search', 'shortcuts',
      'summarize', 'tools', 'verification'
    ];
    
    for (const api of clientApis) {
      const overviewPath = path.join(ROOT_DIR, 'docs', 'api', 'client-api', api, 'overview.mdx');
      
      if (!fs.existsSync(overviewPath)) {
        this.error(`Missing overview file: docs/api/client-api/${api}/overview.mdx`);
      } else {
        this.success(`${api} overview file exists`);
      }
    }
    
    const indexingOverviews = [
      'authentication-overview.mdx',
      'datasources-overview.mdx',
      'documents-overview.mdx',
      'people-overview.mdx',
      'permissions-overview.mdx',
      'shortcuts-overview.mdx',
      'troubleshooting-overview.mdx'
    ];
    
    for (const overview of indexingOverviews) {
      const overviewPath = path.join(ROOT_DIR, 'docs', 'api', 'indexing-api', overview);
      
      if (!fs.existsSync(overviewPath)) {
        this.error(`Missing indexing overview: docs/api/indexing-api/${overview}`);
      } else {
        this.success(`${overview} exists`);
      }
    }
  }

  validateCacheTargets() {
    this.log('\n[5] Validating cache targets...');
    
    this.cache.initialize();
    
    const expectedTargets = [
      'changelog',
      'openapi:transform:client:capitalize',
      'openapi:transform:client:split',
      'openapi:transform:indexing',
      'openapi:indexing',
      'openapi:client:chat'
    ];
    
    for (const target of expectedTargets) {
      const targetData = this.cache.lockfile?.targets?.[target];
      
      if (!targetData) {
        this.warn(`Target '${target}' not in lockfile (may not have been built yet)`);
      } else {
        this.success(`Target '${target}' exists with ${Object.keys(targetData.inputs || {}).length} inputs`);
      }
    }
  }

  async runValidation() {
    console.log('==========================================');
    console.log('  Build Cache Validation');
    console.log('==========================================\n');

    this.validateCacheDirectory();
    this.validateGeneratedFiles();
    this.validateOpenAPIFiles();
    this.validateOverviewFiles();
    this.validateCacheTargets();

    console.log('\n==========================================');
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('  ✓ All validations passed');
    } else {
      if (this.errors.length > 0) {
        console.log(`  ✗ ${this.errors.length} error(s) found`);
      }
      if (this.warnings.length > 0) {
        console.log(`  ⚠ ${this.warnings.length} warning(s) found`);
      }
    }
    console.log('==========================================\n');

    return this.errors.length === 0;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new CacheValidator();
  
  validator.runValidation().then(success => {
    process.exit(success ? 0 : 1);
  });
}

