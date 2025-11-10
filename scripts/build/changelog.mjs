#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { BuildCache } from './cache.mjs';
import { hashDirectory, hashFile } from './hash.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..', '..');

export async function buildChangelogIfNeeded(cache) {
  const targetName = 'changelog';
  
  const inputs = {
    entries: hashDirectory(path.join(ROOT_DIR, 'changelog', 'entries'), {
      include: ['.md']
    }),
    dataGenerator: hashFile(path.join(ROOT_DIR, 'scripts', 'generate-changelog-data.mjs')),
    rssGenerator: hashFile(path.join(ROOT_DIR, 'scripts', 'generate-rss-feed.mjs'))
  };

  const outputs = [
    'src/data/changelog.json',
    'static/changelog.xml'
  ];

  if (cache.shouldRebuild(targetName, inputs)) {
    cache.log('Building changelog and RSS feed...', 'info');
    
    try {
      execSync('node scripts/generate-changelog-data.mjs', {
        cwd: ROOT_DIR,
        stdio: cache.verbose ? 'inherit' : 'pipe'
      });
      
      execSync('node scripts/generate-rss-feed.mjs', {
        cwd: ROOT_DIR,
        stdio: cache.verbose ? 'inherit' : 'pipe'
      });
      
      cache.markBuilt(targetName, inputs, outputs);
      cache.log('Changelog generation complete', 'info');
      return true;
    } catch (error) {
      cache.log(`Changelog generation failed: ${error.message}`, 'error');
      return false;
    }
  } else {
    cache.log('Changelog is up to date (cache hit)', 'info');
    return true;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cache = new BuildCache({ verbose: true });
  cache.initialize();
  
  buildChangelogIfNeeded(cache).then(success => {
    process.exit(success ? 0 : 1);
  });
}

