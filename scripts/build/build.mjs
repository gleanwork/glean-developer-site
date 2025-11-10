#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { BuildCache } from './cache.mjs';
import { buildChangelogIfNeeded } from './changelog.mjs';
import { buildTransformationsIfNeeded, buildAllAPIsIfNeeded } from './openapi.mjs';
import { hashDirectory, hashFile, hashPackageVersion } from './hash.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..', '..');

async function buildWithCache() {
  const startTime = Date.now();
  const verbose = process.env.VERBOSE === 'true' || process.argv.includes('--verbose');
  
  const cache = new BuildCache({ verbose });
  cache.initialize();
  
  try {
    console.log('Generating changelog...');
    const changelogSuccess = await buildChangelogIfNeeded(cache);
    if (!changelogSuccess) {
      console.error('✗ Changelog generation failed');
      process.exit(1);
    }
    
    console.log('Transforming OpenAPI specs...');
    await buildTransformationsIfNeeded(cache);
    
    console.log('Generating API documentation...');
    await buildAllAPIsIfNeeded(cache);
    
    console.log('Checking build cache...');
    
    const buildInputs = {
      openapi: hashDirectory(path.join(ROOT_DIR, 'openapi'), {
        include: ['.yaml']
      }),
      docs: hashDirectory(path.join(ROOT_DIR, 'docs'), {
        exclude: ['node_modules', '.docusaurus']
      }),
      changelog: hashDirectory(path.join(ROOT_DIR, 'changelog', 'entries'), {
        include: ['.md']
      }),
      src: hashDirectory(path.join(ROOT_DIR, 'src'), {
        exclude: ['node_modules', '.docusaurus', 'data/changelog.json']
      }),
      config: hashFile(path.join(ROOT_DIR, 'docusaurus.config.ts')),
      sidebars: hashFile(path.join(ROOT_DIR, 'sidebars.ts')),
      packageJson: hashFile(path.join(ROOT_DIR, 'package.json')),
      docusaurusVersion: hashPackageVersion('@docusaurus/core')
    };
    
    const buildTarget = 'docusaurus:build';
    const buildDir = path.join(ROOT_DIR, 'build');
    
    if (!cache.shouldRebuild(buildTarget, buildInputs)) {
      console.log('Restoring from cache...');
      
      if (cache.restoreBuildOutput(buildTarget, buildDir)) {
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log(`✓ Build completed in ${duration}s (from cache)`);
        
        if (verbose) {
          cache.printStats();
        }
        
        process.exit(0);
      } else {
        console.log('Cache restore failed, rebuilding...');
      }
    } else {
      console.log('Cache invalid, rebuilding...');
    }
    
    console.log('Building site...');
    try {
      execSync('docusaurus build', {
        cwd: ROOT_DIR,
        stdio: 'inherit'
      });
    } catch (error) {
      console.error('✗ Build failed');
      process.exit(1);
    }
    
    console.log('Caching build output...');
    cache.storeBuildOutput(buildTarget, buildDir, buildInputs);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`✓ Build completed in ${duration}s`);
    
    if (verbose) {
      cache.printStats();
    }
    
  } catch (error) {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.error(`\n✗ Build failed after ${duration}s`);
    console.error(`Error: ${error.message}`);
    
    if (verbose && error.stack) {
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

buildWithCache();

