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

export class ChangelogCache {
  constructor(options = {}) {
    this.verbose = options.verbose || 
                   process.env.VERBOSE === 'true' || 
                   process.argv.includes('--verbose');
    this.cache = new BuildCache('.build-cache', { verbose: this.verbose });
    this.cache.initialize();
    
    this.changelogDir = path.join(ROOT_DIR, 'changelog', 'entries');
    this.outputJsonPath = path.join(ROOT_DIR, 'src', 'data', 'changelog.json');
    this.outputRssPath = path.join(ROOT_DIR, 'static', 'changelog.xml');
  }

  log(message, level = 'info') {
    // Pass through to cache's log method
    this.cache.log(message, level);
  }

  calculateChangelogHash() {
    const entries = this.getChangelogEntries();
    const content = entries.map(entry => {
      const filePath = path.join(this.changelogDir, entry);
      return fs.readFileSync(filePath, 'utf8');
    }).join('\n');
    
    // Include generator version in hash
    const hashContent = content + '|v1.0.0';
    return this.cache.calculateHash(hashContent);
  }

  getChangelogEntries() {
    if (!fs.existsSync(this.changelogDir)) {
      return [];
    }
    
    return fs.readdirSync(this.changelogDir)
      .filter(file => file.endsWith('.md'))
      .sort()
      .reverse(); // Most recent first
  }

  generateChangelogData() {
    const entries = this.getChangelogEntries();
    const changelogData = [];
    
    for (const entry of entries) {
      const filePath = path.join(this.changelogDir, entry);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Parse the markdown file
      const lines = content.split('\n');
      const title = lines[0]?.replace(/^#\s+/, '') || '';
      
      // Extract date from filename (YYYY-MM-DD-*.md)
      const dateMatch = entry.match(/^(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : '';
      
      // Extract metadata from frontmatter if present
      let metadata = {};
      if (content.startsWith('---')) {
        const endIndex = content.indexOf('---', 3);
        if (endIndex > 0) {
          const frontmatter = content.substring(3, endIndex);
          // Simple frontmatter parsing
          frontmatter.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
              metadata[key.trim()] = valueParts.join(':').trim();
            }
          });
        }
      }
      
      // Remove frontmatter from content
      const bodyStart = content.indexOf('---', 3);
      const body = bodyStart > 0 
        ? content.substring(bodyStart + 3).trim() 
        : content.substring(lines[0].length).trim();
      
      changelogData.push({
        id: entry.replace('.md', ''),
        date,
        title: metadata.title || title,
        description: metadata.description || '',
        body,
        tags: metadata.tags ? metadata.tags.split(',').map(t => t.trim()) : [],
        breaking: metadata.breaking === 'true',
        deprecated: metadata.deprecated === 'true'
      });
    }
    
    return changelogData;
  }

  generateRssFeed(changelogData) {
    const rssItems = changelogData.slice(0, 20).map(entry => {
      const link = `https://developers.glean.com/changelog#${entry.id}`;
      const pubDate = new Date(entry.date).toUTCString();
      
      return `
    <item>
      <title>${this.escapeXml(entry.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${this.escapeXml(entry.description || entry.body.substring(0, 200) + '...')}</description>
      <pubDate>${pubDate}</pubDate>
      ${entry.tags.map(tag => `<category>${this.escapeXml(tag)}</category>`).join('\n      ')}
    </item>`;
    }).join('\n');
    
    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Glean Developer Changelog</title>
    <link>https://developers.glean.com/changelog</link>
    <description>Latest updates and changes to the Glean Developer Platform</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://developers.glean.com/changelog.xml" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`;
    
    return rssFeed;
  }

  escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  async generate() {
    return await PerfLogger.async('Generate changelog and RSS feed', async () => {
      const hash = this.calculateChangelogHash();
      
      // Check if changelog is cached
      if (this.cache.isValid('changelog', 'data', hash)) {
        // Restore cached files
        const jsonRestored = this.cache.restoreFile('changelog', 'data', this.outputJsonPath);
        const rssRestored = this.cache.restoreFile('changelog', 'rss', this.outputRssPath);
        
        if (jsonRestored && rssRestored) {
          this.log('✓ Using cached changelog data and RSS feed', 'verbose');
          return true;
        }
      }
      
      this.log('⟳ Regenerating changelog data and RSS feed', 'verbose');
      
      // Generate changelog data
      const changelogData = this.generateChangelogData();
      
      // Write changelog.json
      fs.mkdirSync(path.dirname(this.outputJsonPath), { recursive: true });
      fs.writeFileSync(this.outputJsonPath, JSON.stringify(changelogData, null, 2));
      this.log(`Generated ${this.outputJsonPath}`, 'verbose');
      
      // Generate and write RSS feed
      const rssFeed = this.generateRssFeed(changelogData);
      fs.mkdirSync(path.dirname(this.outputRssPath), { recursive: true });
      fs.writeFileSync(this.outputRssPath, rssFeed);
      this.log(`Generated ${this.outputRssPath}`, 'verbose');
      
      // Cache the generated files
      this.cache.storeFile('changelog', 'data', this.outputJsonPath, hash);
      this.cache.storeFile('changelog', 'rss', this.outputRssPath, hash);
      
      if (!this.verbose) {
        logger.info(`Changelog: ${logger.num(changelogData.length)} entries processed`);
      }
      
      return true;
    });
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

  async generateUsingScripts() {
    // Alternative method using existing scripts
    const changelogSuccess = this.runCommand(
      'node scripts/generate-changelog-data.mjs',
      'Generating changelog data'
    );
    
    if (!changelogSuccess) {
      return false;
    }
    
    const rssSuccess = this.runCommand(
      'node scripts/generate-rss-feed.mjs',
      'Generating RSS feed'
    );
    
    return rssSuccess;
  }

  validateCache() {
    const issues = [];
    
    // Check if output files exist
    if (!fs.existsSync(this.outputJsonPath)) {
      issues.push('changelog.json is missing');
    }
    
    if (!fs.existsSync(this.outputRssPath)) {
      issues.push('changelog.xml is missing');
    }
    
    // Check if cache is valid
    const hash = this.calculateChangelogHash();
    if (!this.cache.isValid('changelog', 'data', hash)) {
      issues.push('Changelog cache is outdated');
    }
    
    if (issues.length > 0) {
      logger.warn('Changelog cache validation issues:');
      issues.forEach(issue => logger.warn(`  - ${issue}`));
      return false;
    }
    
    logger.success('✓ Changelog cache validation passed');
    return true;
  }

  clearCache() {
    this.cache.clear('changelog');
    logger.success('Cleared changelog cache');
  }

  getCacheStats() {
    const hash = this.calculateChangelogHash();
    const stats = {
      dataCache: this.cache.isValid('changelog', 'data', hash),
      rssCache: this.cache.isValid('changelog', 'rss', hash),
      entries: this.getChangelogEntries().length,
      outputExists: {
        json: fs.existsSync(this.outputJsonPath),
        rss: fs.existsSync(this.outputRssPath)
      }
    };
    
    return stats;
  }

  printCacheStats() {
    const stats = this.getCacheStats();
    
    logger.newLine();
    logger.info('Changelog Cache Status:');
    logger.info(`  Entries: ${logger.num(stats.entries)}`);
    logger.info(`  Data cache: ${stats.dataCache ? logger.green('✓ Valid') : logger.yellow('✗ Invalid')}`);
    logger.info(`  RSS cache: ${stats.rssCache ? logger.green('✓ Valid') : logger.yellow('✗ Invalid')}`);
    logger.info('  Output files:');
    logger.info(`    changelog.json: ${stats.outputExists.json ? logger.green('✓ Exists') : logger.red('✗ Missing')}`);
    logger.info(`    changelog.xml: ${stats.outputExists.rss ? logger.green('✓ Exists') : logger.red('✗ Missing')}`);
  }

  watchForChanges(callback) {
    logger.info(`Watching for changelog changes in ${this.changelogDir}`);
    
    fs.watch(this.changelogDir, { recursive: true }, (eventType, filename) => {
      if (filename && filename.endsWith('.md')) {
        logger.info(`Changelog file ${eventType}: ${filename}`);
        this.generate().then(success => {
          if (callback) {
            callback(success);
          }
        });
      }
    });
  }
}

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const cache = new ChangelogCache();
  
  switch (command) {
    case 'generate':
      await cache.generate();
      break;
    case 'validate':
      cache.validateCache();
      break;
    case 'stats':
      cache.printCacheStats();
      break;
    case 'clear':
      cache.clearCache();
      break;
    case 'watch':
      cache.watchForChanges((success) => {
        if (success) {
          logger.success('Changelog regenerated successfully');
        } else {
          logger.error('Changelog regeneration failed');
        }
      });
      break;
    default:
      logger.info('Usage: changelog-cache.mjs [generate|validate|stats|clear|watch]');
  }
}