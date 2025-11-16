import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { parseChangelogEntry } from '../shared/entry-parser.js';

interface CacheData {
  directoryHash: string;
  generatedAt: string;
}

interface ChangelogData {
  entries: Array<any>;
  categories: Array<string>;
  generatedAt: string;
  totalEntries: number;
}

function getFileHash(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  return crypto.createHash('md5').update(content).digest('hex');
}

function getDirectoryHash(dirPath: string): string | null {
  if (!fs.existsSync(dirPath)) return null;

  const files = fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith('.md'))
    .sort();

  const fileHashes = files.map((file) => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    return {
      file,
      hash: crypto.createHash('md5').update(content).digest('hex'),
      mtime: stats.mtime.toISOString(),
    };
  });

  return crypto
    .createHash('md5')
    .update(JSON.stringify(fileHashes))
    .digest('hex');
}

function loadCache(cacheFile: string): CacheData | null {
  if (!fs.existsSync(cacheFile)) return null;

  try {
    return JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
  } catch (error: any) {
    console.warn('Failed to load changelog cache:', error.message);
    return null;
  }
}

function saveCache(cacheFile: string, cache: CacheData): void {
  try {
    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
  } catch (error: any) {
    console.warn('Failed to save changelog cache:', error.message);
  }
}

function hasChanges(
  changelogDir: string,
  outputFile: string,
  cacheFile: string,
): boolean {
  const cache = loadCache(cacheFile);
  if (!cache) return true;

  const currentHash = getDirectoryHash(changelogDir);
  const outputExists = fs.existsSync(outputFile);

  return !outputExists || cache.directoryHash !== currentHash;
}

/**
 * Compiles all changelog entry markdown files into a single JSON file.
 * Reads all .md files from changelog/entries/, parses their frontmatter and content,
 * processes markdown to HTML, and outputs to src/data/changelog.json.
 * Uses caching to skip regeneration if entries haven't changed.
 */
export function buildCommand(repoRoot: string): void {
  const changelogDir = path.join(repoRoot, 'changelog', 'entries');
  const outputFile = path.join(repoRoot, 'src', 'data', 'changelog.json');
  const cacheFile = path.join(repoRoot, '.changelog-cache.json');

  if (!fs.existsSync(changelogDir)) {
    console.error('Changelog entries directory does not exist:', changelogDir);
    return;
  }

  if (!hasChanges(changelogDir, outputFile, cacheFile)) {
    console.log(
      'No changes detected in changelog entries, skipping generation',
    );
    return;
  }

  const files = fs
    .readdirSync(changelogDir)
    .filter((file) => file.endsWith('.md'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log('No changelog entries found');
    return;
  }

  const entries: Array<any> = [];

  files.forEach((fileName) => {
    try {
      const filePath = path.join(changelogDir, fileName);
      const content = fs.readFileSync(filePath, 'utf-8');
      const entry = parseChangelogEntry(fileName, content);
      entries.push(entry);
    } catch (error: any) {
      console.error(`Error parsing changelog entry ${fileName}:`, error);
    }
  });

  const allCategories = [
    ...new Set(entries.flatMap((entry) => entry.categories)),
  ].sort();

  const mostRecentDate =
    entries.length > 0
      ? entries[0].date
      : new Date().toISOString().split('T')[0];

  const changelogData: ChangelogData = {
    entries,
    categories: allCategories,
    generatedAt: new Date(mostRecentDate + 'T00:00:00.000Z').toISOString(),
    totalEntries: entries.length,
  };

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(changelogData, null, 2));

  const cache: CacheData = {
    directoryHash: getDirectoryHash(changelogDir)!,
    generatedAt: new Date().toISOString(),
  };
  saveCache(cacheFile, cache);

  console.log(`Generated changelog data with ${entries.length} entries`);
}
