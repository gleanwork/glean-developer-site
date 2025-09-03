#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..', '..');

class CacheValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  log(message) {
    console.log(`[Validator] ${message}`);
  }

  error(message) {
    this.errors.push(message);
    console.error(`[Validator] ✗ ${message}`);
  }

  warn(message) {
    this.warnings.push(message);
    console.warn(`[Validator] ⚠ ${message}`);
  }

  success(message) {
    console.log(`[Validator] ✓ ${message}`);
  }

  checkFile(filePath, description) {
    if (fs.existsSync(filePath)) {
      this.success(`${description} exists: ${filePath}`);
      return true;
    } else {
      this.error(`${description} missing: ${filePath}`);
      return false;
    }
  }

  checkDirectory(dirPath, description) {
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      this.success(`${description} exists: ${dirPath}`);
      return true;
    } else {
      this.error(`${description} missing or not a directory: ${dirPath}`);
      return false;
    }
  }

  validateHandwrittenFiles() {
    this.log('\nValidating hand-written files are preserved...');
    
    const overviewFiles = [
      'docs/api/client-api/activity/overview.mdx',
      'docs/api/client-api/agents/overview.mdx',
      'docs/api/client-api/announcements/overview.mdx',
      'docs/api/client-api/answers/overview.mdx',
      'docs/api/client-api/authentication/overview.mdx',
      'docs/api/client-api/chat/overview.mdx',
      'docs/api/client-api/collections/overview.mdx',
      'docs/api/client-api/documents/overview.mdx',
      'docs/api/client-api/entities/overview.mdx',
      'docs/api/client-api/governance/overview.mdx',
      'docs/api/client-api/insights/overview.mdx',
      'docs/api/client-api/messages/overview.mdx',
      'docs/api/client-api/pins/overview.mdx',
      'docs/api/client-api/search/overview.mdx',
      'docs/api/client-api/shortcuts/overview.mdx',
      'docs/api/client-api/summarize/overview.mdx',
      'docs/api/client-api/tools/overview.mdx',
      'docs/api/client-api/verification/overview.mdx',
    ];

    const indexingOverviewFiles = [
      'docs/api/indexing-api/authentication-overview.mdx',
      'docs/api/indexing-api/datasources-overview.mdx',
      'docs/api/indexing-api/documents-overview.mdx',
      'docs/api/indexing-api/people-overview.mdx',
      'docs/api/indexing-api/permissions-overview.mdx',
      'docs/api/indexing-api/shortcuts-overview.mdx',
      'docs/api/indexing-api/troubleshooting-overview.mdx',
    ];

    let allPresent = true;

    for (const file of overviewFiles) {
      const filePath = path.join(ROOT_DIR, file);
      if (!this.checkFile(filePath, `Client API overview`)) {
        allPresent = false;
      }
    }

    for (const file of indexingOverviewFiles) {
      const filePath = path.join(ROOT_DIR, file);
      if (!this.checkFile(filePath, `Indexing API overview`)) {
        allPresent = false;
      }
    }

    return allPresent;
  }

  validateGeneratedFiles() {
    this.log('\nValidating generated files exist...');
    
    const requiredDirs = [
      'docs/api/client-api/activity',
      'docs/api/client-api/agents',
      'docs/api/client-api/announcements',
      'docs/api/client-api/answers',
      'docs/api/client-api/authentication',
      'docs/api/client-api/chat',
      'docs/api/client-api/collections',
      'docs/api/client-api/documents',
      'docs/api/client-api/entities',
      'docs/api/client-api/governance',
      'docs/api/client-api/insights',
      'docs/api/client-api/messages',
      'docs/api/client-api/pins',
      'docs/api/client-api/search',
      'docs/api/client-api/shortcuts',
      'docs/api/client-api/summarize',
      'docs/api/client-api/tools',
      'docs/api/client-api/verification',
      'docs/api/indexing-api',
    ];

    let allPresent = true;

    for (const dir of requiredDirs) {
      const dirPath = path.join(ROOT_DIR, dir);
      if (this.checkDirectory(dirPath, `API directory`)) {
        const files = fs.readdirSync(dirPath);
        const apiFiles = files.filter(f => f.endsWith('.api.mdx'));
        
        if (apiFiles.length === 0 && !dir.includes('indexing')) {
          this.warn(`No .api.mdx files in ${dir}`);
        } else {
          this.success(`Found ${apiFiles.length} API files in ${dir}`);
        }
      } else {
        allPresent = false;
      }
    }

    return allPresent;
  }

  validateNoUnwantedArtifacts() {
    this.log('\nValidating no unwanted build artifacts...');
    
    const unwantedPatterns = [
      { dir: 'docs/api/client-api', pattern: /sidebar\.ts$/ },
      { dir: 'docs/api/client-api', pattern: /\.info\.mdx$/ },
      { dir: 'docs/api/client-api', pattern: /\.tag\.mdx$/ },
      { dir: 'docs/api/indexing-api', file: 'sidebar.ts' },
      { dir: 'docs/api/indexing-api', file: 'glean-api.info.mdx' },
      { dir: 'docs/api/indexing-api', pattern: /\.info\.mdx$/ },
      { dir: 'docs/api/indexing-api', pattern: /\.tag\.mdx$/ },
    ];

    let hasArtifacts = false;

    for (const check of unwantedPatterns) {
      const dirPath = path.join(ROOT_DIR, check.dir);
      
      if (!fs.existsSync(dirPath)) continue;
      
      if (check.file) {
        const filePath = path.join(dirPath, check.file);
        if (fs.existsSync(filePath)) {
          this.error(`Unwanted artifact found: ${path.relative(ROOT_DIR, filePath)}`);
          hasArtifacts = true;
        }
      }
      
      if (check.pattern) {
        const files = this.findFilesRecursively(dirPath, check.pattern);
        for (const file of files) {
          this.error(`Unwanted artifact found: ${path.relative(ROOT_DIR, file)}`);
          hasArtifacts = true;
        }
      }
    }

    if (!hasArtifacts) {
      this.success('No unwanted build artifacts found');
    }

    return !hasArtifacts;
  }

  findFilesRecursively(dir, pattern) {
    const files = [];
    
    function traverse(currentDir) {
      if (!fs.existsSync(currentDir)) return;
      
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          traverse(fullPath);
        } else if (entry.isFile() && pattern.test(entry.name)) {
          files.push(fullPath);
        }
      }
    }
    
    traverse(dir);
    return files;
  }

  validateChangelogFiles() {
    this.log('\nValidating changelog files...');
    
    const changelogJson = path.join(ROOT_DIR, 'src', 'data', 'changelog.json');
    const changelogXml = path.join(ROOT_DIR, 'static', 'changelog.xml');
    
    const jsonExists = this.checkFile(changelogJson, 'Changelog JSON');
    const xmlExists = this.checkFile(changelogXml, 'RSS feed XML');
    
    if (jsonExists) {
      try {
        const data = JSON.parse(fs.readFileSync(changelogJson, 'utf-8'));
        if (data.entries && Array.isArray(data.entries)) {
          this.success(`Changelog JSON is valid with ${data.entries.length} entries`);
        } else {
          this.error('Changelog JSON has invalid structure');
          return false;
        }
      } catch (error) {
        this.error(`Changelog JSON is not valid JSON: ${error.message}`);
        return false;
      }
    }
    
    return jsonExists && xmlExists;
  }

  validateRedirects() {
    this.log('\nValidating redirects are preserved...');
    
    const redirectsFile = path.join(ROOT_DIR, 'redirects.json');
    const permalinksFile = path.join(ROOT_DIR, 'permalinks.json');
    
    const redirectsExists = this.checkFile(redirectsFile, 'Redirects file');
    const permalinksExists = this.checkFile(permalinksFile, 'Permalinks file');
    
    return redirectsExists && permalinksExists;
  }

  async compareBuildOutputs() {
    this.log('\nComparing cached vs non-cached build outputs...');
    this.log('This will take a few minutes...');
    
    const tempDir = path.join(ROOT_DIR, '.cache-validation-temp');
    
    try {
      fs.mkdirSync(tempDir, { recursive: true });
      
      this.log('Building with cache...');
      execSync('node scripts/cache/build-with-cache.mjs', {
        cwd: ROOT_DIR,
        stdio: 'pipe',
        env: { ...process.env }
      });
      
      const cachedOutputDir = path.join(tempDir, 'cached-build');
      execSync(`cp -r build ${cachedOutputDir}`, {
        cwd: ROOT_DIR,
        stdio: 'pipe'
      });
      
      this.log('Clearing cache and rebuilding without cache...');
      execSync('node scripts/cache/cache-cli.mjs clear', {
        cwd: ROOT_DIR,
        stdio: 'pipe'
      });
      
      execSync('yarn build', {
        cwd: ROOT_DIR,
        stdio: 'pipe',
        env: { ...process.env }
      });
      
      const uncachedOutputDir = path.join(tempDir, 'uncached-build');
      execSync(`cp -r build ${uncachedOutputDir}`, {
        cwd: ROOT_DIR,
        stdio: 'pipe'
      });
      
      this.log('Comparing outputs...');
      
      const cachedFiles = this.getAllFiles(cachedOutputDir);
      const uncachedFiles = this.getAllFiles(uncachedOutputDir);
      
      if (cachedFiles.length !== uncachedFiles.length) {
        this.error(`File count mismatch: cached=${cachedFiles.length}, uncached=${uncachedFiles.length}`);
        return false;
      }
      
      let identical = true;
      for (const file of cachedFiles) {
        const relativePath = path.relative(cachedOutputDir, file);
        const uncachedFile = path.join(uncachedOutputDir, relativePath);
        
        if (!fs.existsSync(uncachedFile)) {
          this.error(`File missing in uncached build: ${relativePath}`);
          identical = false;
        }
      }
      
      if (identical) {
        this.success('Build outputs are identical');
      }
      
      fs.rmSync(tempDir, { recursive: true, force: true });
      
      return identical;
      
    } catch (error) {
      this.error(`Build comparison failed: ${error.message}`);
      fs.rmSync(tempDir, { recursive: true, force: true });
      return false;
    }
  }

  getAllFiles(dir) {
    const files = [];
    
    function traverse(currentDir) {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          traverse(fullPath);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    }
    
    traverse(dir);
    return files;
  }

  async runValidation(options = {}) {
    console.log('\n========================================');
    console.log('  Cache Validation');
    console.log('========================================\n');

    const checks = [
      this.validateHandwrittenFiles(),
      this.validateGeneratedFiles(),
      this.validateNoUnwantedArtifacts(),
      this.validateChangelogFiles(),
      this.validateRedirects(),
    ];

    if (options.compareBuilds) {
      checks.push(await this.compareBuildOutputs());
    }

    const allPassed = checks.every(result => result);

    console.log('\n========================================');
    if (this.errors.length === 0) {
      console.log('  ✓ All validations passed');
    } else {
      console.log(`  ✗ Validation failed with ${this.errors.length} errors`);
      if (this.warnings.length > 0) {
        console.log(`  ⚠ ${this.warnings.length} warnings`);
      }
    }
    console.log('========================================\n');

    return allPassed;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new CacheValidator();
  const compareBuilds = process.argv.includes('--compare');
  
  validator.runValidation({ compareBuilds }).then(success => {
    process.exit(success ? 0 : 1);
  });
}
