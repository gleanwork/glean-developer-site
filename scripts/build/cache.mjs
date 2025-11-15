#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..', '..');

const CACHE_DIR = path.join(ROOT_DIR, '.build-cache');
const LOCKFILE_PATH = path.join(CACHE_DIR, 'lockfile.json');

export class BuildCache {
  constructor(options = {}) {
    this.verbose = options.verbose || process.env.VERBOSE === 'true';
    this.disabled = process.env.DISABLE_BUILD_CACHE === 'true';
    this.lockfile = null;
  }

  initialize() {
    if (this.disabled) {
      this.log('Build cache is disabled');
      return;
    }

    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    this.loadLockfile();
  }

  loadLockfile() {
    if (fs.existsSync(LOCKFILE_PATH)) {
      try {
        this.lockfile = JSON.parse(fs.readFileSync(LOCKFILE_PATH, 'utf8'));
        this.log('Loaded lockfile');
      } catch (error) {
        this.log(`Failed to load lockfile: ${error.message}`, 'warn');
        this.lockfile = this.createEmptyLockfile();
      }
    } else {
      this.lockfile = this.createEmptyLockfile();
      this.log('Created new lockfile');
    }
  }

  createEmptyLockfile() {
    return {
      version: 1,
      generated: new Date().toISOString(),
      targets: {}
    };
  }

  saveLockfile() {
    if (this.disabled) {
      return;
    }

    const tempPath = LOCKFILE_PATH + '.tmp';
    
    try {
      this.lockfile.generated = new Date().toISOString();
      fs.writeFileSync(tempPath, JSON.stringify(this.lockfile, null, 2));
      fs.renameSync(tempPath, LOCKFILE_PATH);
      this.log('Saved lockfile');
    } catch (error) {
      this.log(`Failed to save lockfile: ${error.message}`, 'error');
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  shouldRebuild(targetName, currentInputs) {
    if (this.disabled) {
      return { shouldRebuild: true, reason: 'Cache disabled' };
    }

    const target = this.lockfile.targets[targetName];
    
    if (!target) {
      const reason = 'No cache entry found (first build or cache cleared)';
      this.log(`Cache miss: ${targetName} (not in lockfile)`);
      return { shouldRebuild: true, reason };
    }

    if (!target.inputs) {
      const reason = 'Cache entry corrupted (no inputs recorded)';
      this.log(`Cache miss: ${targetName} (no inputs recorded)`);
      return { shouldRebuild: true, reason };
    }

    const inputKeys = Object.keys(currentInputs).sort();
    const cachedInputKeys = Object.keys(target.inputs).sort();
    
    if (inputKeys.length !== cachedInputKeys.length || 
        !inputKeys.every((key, index) => key === cachedInputKeys[index])) {
      const reason = 'Input keys changed (build configuration modified)';
      this.log(`Cache miss: ${targetName} (input keys changed)`);
      return { shouldRebuild: true, reason };
    }

    for (const key of inputKeys) {
      if (currentInputs[key] !== target.inputs[key]) {
        const reason = `${key} changed`;
        this.log(`Cache miss: ${targetName} (${key} changed)`);
        this.log(`  Expected: ${target.inputs[key]?.substring(0, 12)}...`);
        this.log(`  Got: ${currentInputs[key]?.substring(0, 12)}...`);
        return { shouldRebuild: true, reason };
      }
    }

    if (target.outputs) {
      for (const outputPath of target.outputs) {
        const fullPath = path.join(ROOT_DIR, outputPath);
        if (!fs.existsSync(fullPath)) {
          const reason = `Output missing: ${outputPath}`;
          this.log(`Cache miss: ${targetName} (output ${outputPath} missing)`);
          return { shouldRebuild: true, reason };
        }
      }
    }

    this.log(`Cache hit: ${targetName}`);
    return { shouldRebuild: false, reason: null };
  }

  markBuilt(targetName, inputs, outputs = []) {
    if (this.disabled) {
      return;
    }

    this.lockfile.targets[targetName] = {
      inputs,
      outputs,
      status: 'valid',
      lastBuilt: new Date().toISOString()
    };

    this.saveLockfile();
  }

  invalidate(targetName) {
    if (this.disabled) {
      return;
    }

    delete this.lockfile.targets[targetName];
    this.saveLockfile();
    this.log(`Invalidated: ${targetName}`);
  }

  storeBuildOutput(targetName, buildDir, inputs) {
    if (this.disabled) {
      return false;
    }

    const cacheTargetDir = path.join(CACHE_DIR, 'builds', targetName);
    const tempDir = cacheTargetDir + '.tmp';

    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }

      fs.mkdirSync(path.dirname(tempDir), { recursive: true });
      
      this.log(`Caching build output: ${targetName}`);
      this.copyDirectory(buildDir, tempDir);

      if (fs.existsSync(cacheTargetDir)) {
        fs.rmSync(cacheTargetDir, { recursive: true, force: true });
      }
      fs.renameSync(tempDir, cacheTargetDir);

      const relativePath = path.relative(ROOT_DIR, buildDir);
      this.markBuilt(targetName, inputs, [relativePath]);
      this.log(`Cached build output: ${targetName}`);
      return true;
    } catch (error) {
      this.log(`Failed to cache build output: ${error.message}`, 'error');
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      return false;
    }
  }

  restoreBuildOutput(targetName, buildDir) {
    if (this.disabled) {
      return false;
    }

    const cacheTargetDir = path.join(CACHE_DIR, 'builds', targetName);

    if (!fs.existsSync(cacheTargetDir)) {
      this.log(`Cannot restore: ${targetName} (cache directory missing)`);
      return false;
    }

    try {
      if (fs.existsSync(buildDir)) {
        fs.rmSync(buildDir, { recursive: true, force: true });
      }

      this.log(`Restoring build output: ${targetName}`);
      this.copyDirectory(cacheTargetDir, buildDir);
      this.log(`Restored build output: ${targetName}`);
      return true;
    } catch (error) {
      this.log(`Failed to restore build output: ${error.message}`, 'error');
      return false;
    }
  }

  copyDirectory(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  getStats() {
    if (this.disabled || !this.lockfile) {
      return { totalTargets: 0, validTargets: 0, targets: {} };
    }

    const stats = {
      totalTargets: Object.keys(this.lockfile.targets).length,
      validTargets: 0,
      targets: {}
    };

    for (const [name, target] of Object.entries(this.lockfile.targets)) {
      if (target.status === 'valid') {
        stats.validTargets++;
      }
      stats.targets[name] = {
        status: target.status,
        lastBuilt: target.lastBuilt,
        inputCount: Object.keys(target.inputs || {}).length,
        outputCount: (target.outputs || []).length
      };
    }

    return stats;
  }

  printStats() {
    const stats = this.getStats();
    
    console.log('\nCache Statistics:');
    console.log(`  Total targets: ${stats.totalTargets}`);
    console.log(`  Valid targets: ${stats.validTargets}`);
    
    if (stats.totalTargets > 0) {
      console.log('\n  Targets:');
      for (const [name, info] of Object.entries(stats.targets)) {
        console.log(`    ${name}:`);
        console.log(`      Status: ${info.status}`);
        console.log(`      Last built: ${info.lastBuilt}`);
        console.log(`      Inputs: ${info.inputCount}`);
        console.log(`      Outputs: ${info.outputCount}`);
      }
    }
  }

  getCacheSize() {
    if (!fs.existsSync(CACHE_DIR)) {
      return 0;
    }

    let totalSize = 0;

    function calculateDirSize(dirPath) {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          calculateDirSize(fullPath);
        } else if (entry.isFile()) {
          totalSize += fs.statSync(fullPath).size;
        }
      }
    }

    calculateDirSize(CACHE_DIR);
    return totalSize;
  }

  pruneStaleEntries(maxAgeDays = 7) {
    if (this.disabled || !this.lockfile) {
      return { removed: 0, freedBytes: 0 };
    }

    const now = new Date();
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    const removed = [];
    let freedBytes = 0;

    for (const [targetName, target] of Object.entries(this.lockfile.targets)) {
      if (!target.lastBuilt) {
        continue;
      }

      const lastBuilt = new Date(target.lastBuilt);
      const age = now - lastBuilt;

      if (age > maxAgeMs) {
        const cacheTargetDir = path.join(CACHE_DIR, 'builds', targetName);
        
        if (fs.existsSync(cacheTargetDir)) {
          const sizeBefore = this.getCacheSize();
          fs.rmSync(cacheTargetDir, { recursive: true, force: true });
          const sizeAfter = this.getCacheSize();
          freedBytes += sizeBefore - sizeAfter;
        }

        delete this.lockfile.targets[targetName];
        removed.push(targetName);
      }
    }

    if (removed.length > 0) {
      this.saveLockfile();
      this.log(`Pruned ${removed.length} stale cache entries (freed ${(freedBytes / 1024 / 1024).toFixed(2)} MB)`);
    }

    return { removed: removed.length, freedBytes };
  }

  clear(targetName = null) {
    if (targetName) {
      this.invalidate(targetName);
      
      const cacheTargetDir = path.join(CACHE_DIR, 'builds', targetName);
      if (fs.existsSync(cacheTargetDir)) {
        fs.rmSync(cacheTargetDir, { recursive: true, force: true });
      }
      console.log(`Cleared cache for: ${targetName}`);
    } else {
      if (fs.existsSync(CACHE_DIR)) {
        fs.rmSync(CACHE_DIR, { recursive: true, force: true });
      }
      this.lockfile = this.createEmptyLockfile();
      console.log('Cleared all cache');
    }
  }

  log(message, level = 'info') {
    if (!this.verbose && level === 'info') {
      return;
    }

    const prefix = level === 'error' ? '[ERROR]' : level === 'warn' ? '[WARN]' : '[Cache]';
    console.log(`${prefix} ${message}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const arg = process.argv[3];
  
  const cache = new BuildCache({ verbose: true });
  cache.initialize();
  
  switch (command) {
    case 'stats':
      cache.printStats();
      const size = cache.getCacheSize();
      console.log(`\nCache size: ${(size / 1024 / 1024).toFixed(2)} MB`);
      break;
    case 'clear':
      cache.clear(arg);
      break;
    case 'prune':
      const maxAge = arg ? parseInt(arg, 10) : 7;
      const result = cache.pruneStaleEntries(maxAge);
      console.log(`Pruned ${result.removed} entries, freed ${(result.freedBytes / 1024 / 1024).toFixed(2)} MB`);
      break;
    case 'size':
      const cacheSize = cache.getCacheSize();
      console.log(`Cache size: ${(cacheSize / 1024 / 1024).toFixed(2)} MB (${cacheSize} bytes)`);
      break;
    case 'validate':
      const stats = cache.getStats();
      console.log(`\nValidation: ${stats.validTargets} of ${stats.totalTargets} targets valid`);
      process.exit(stats.totalTargets === stats.validTargets ? 0 : 1);
      break;
    default:
      console.log('Usage: cache.mjs [stats|clear [target]|prune [days]|size|validate]');
      break;
  }
}

