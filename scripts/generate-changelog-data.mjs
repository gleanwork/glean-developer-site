#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHANGELOG_DIR = path.join(__dirname, '..', 'changelog', 'entries');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'changelog.json');
const CACHE_FILE = path.join(__dirname, '..', '.changelog-cache.json');

marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: false,
  mangle: false,
});

function getFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  return crypto.createHash('md5').update(content).digest('hex');
}

function getDirectoryHash(dirPath) {
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

function loadCache() {
  if (!fs.existsSync(CACHE_FILE)) return null;

  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  } catch (error) {
    console.warn('Failed to load changelog cache:', error.message);
    return null;
  }
}

function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.warn('Failed to save changelog cache:', error.message);
  }
}

function hasChanges() {
  const cache = loadCache();
  if (!cache) return true;

  const currentHash = getDirectoryHash(CHANGELOG_DIR);
  const outputExists = fs.existsSync(OUTPUT_FILE);

  return !outputExists || cache.directoryHash !== currentHash;
}

function markdownToHtml(markdown) {
  return marked(markdown);
}

function processChangelogContent(content) {
  const truncateMarkers = [
    '{/* truncate */}',
    '<!-- truncate -->',
    '<!-- more -->',
  ];

  for (const marker of truncateMarkers) {
    if (content.includes(marker)) {
      const parts = content.split(marker);
      return {
        summary: markdownToHtml(parts[0].trim()),
        fullContent: markdownToHtml(content.replace(marker, '').trim()),
        hasTruncation: true,
      };
    }
  }

  const paragraphs = content.split('\n\n');
  if (paragraphs.length > 1) {
    return {
      summary: markdownToHtml(paragraphs[0].trim()),
      fullContent: markdownToHtml(content),
      hasTruncation: true,
    };
  } else if (content.length > 200) {
    const truncatedContent = content.substring(0, 200).trim();
    const lastSpaceIndex = truncatedContent.lastIndexOf(' ');
    const cleanTruncation =
      lastSpaceIndex > 0
        ? truncatedContent.substring(0, lastSpaceIndex)
        : truncatedContent;

    return {
      summary: markdownToHtml(cleanTruncation + '...'),
      fullContent: markdownToHtml(content),
      hasTruncation: true,
    };
  }

  return {
    summary: markdownToHtml(content),
    fullContent: markdownToHtml(content),
    hasTruncation: false,
  };
}

function parseChangelogEntry(fileName, rawContent) {
  const { data, content } = matter(rawContent);

  const dateMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
  if (!dateMatch) {
    throw new Error(`Invalid changelog filename format: ${fileName}`);
  }

  const [, dateStr, slug] = dateMatch;
  const date = new Date(dateStr);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date in filename: ${dateStr}`);
  }

  const processedContent = processChangelogContent(content);

  const categories = data.categories || [];

  return {
    id: `${dateStr}-${slug}`,
    slug,
    title: data.title,
    date: dateStr,
    categories,
    summary: processedContent.summary,
    fullContent: processedContent.fullContent,
    hasTruncation: processedContent.hasTruncation,
    fileName,
  };
}

function generateChangelogData() {
  if (!fs.existsSync(CHANGELOG_DIR)) {
    console.error('Changelog entries directory does not exist:', CHANGELOG_DIR);
    return;
  }

  if (!hasChanges()) {
    console.log(
      'No changes detected in changelog entries, skipping generation',
    );
    return;
  }

  const files = fs
    .readdirSync(CHANGELOG_DIR)
    .filter((file) => file.endsWith('.md'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log('No changelog entries found');
    return;
  }

  const entries = [];

  files.forEach((fileName) => {
    try {
      const filePath = path.join(CHANGELOG_DIR, fileName);
      const content = fs.readFileSync(filePath, 'utf-8');
      const entry = parseChangelogEntry(fileName, content);
      entries.push(entry);
    } catch (error) {
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

  const changelogData = {
    entries,
    categories: allCategories,
    generatedAt: new Date(mostRecentDate + 'T00:00:00.000Z').toISOString(),
    totalEntries: entries.length,
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(changelogData, null, 2));

  const cache = {
    directoryHash: getDirectoryHash(CHANGELOG_DIR),
    generatedAt: new Date().toISOString(),
  };
  saveCache(cache);

  console.log(`Generated changelog data with ${entries.length} entries`);
}

generateChangelogData();
