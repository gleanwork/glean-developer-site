#!/usr/bin/env node

/**
 * Generate deprecations RSS feed from deprecations.json
 *
 * This script reads the deprecations data and generates an RSS 2.0 feed
 * for subscribers to track API deprecation announcements.
 *
 * Usage: node scripts/generate-deprecations-rss.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Feed } from 'feed';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DEPRECATIONS_DATA_FILE = path.join(
  ROOT_DIR,
  'src',
  'data',
  'deprecations.json',
);
const RSS_OUTPUT_DIR = path.join(ROOT_DIR, 'static');
const RSS_OUTPUT_FILE = path.join(RSS_OUTPUT_DIR, 'deprecations.xml');

const SITE_URL = 'https://developers.glean.com';
const DEPRECATIONS_URL = `${SITE_URL}/deprecations`;

/**
 * Check if RSS regeneration is needed based on file modification times
 */
function needsRegeneration(dataFile, outputFile) {
  if (!fs.existsSync(outputFile)) {
    return true;
  }

  if (!fs.existsSync(dataFile)) {
    return true;
  }

  const dataStats = fs.statSync(dataFile);
  const outputStats = fs.statSync(outputFile);

  return dataStats.mtime > outputStats.mtime;
}

/**
 * Get location label from endpoint path
 */
function getLocationFromPath(endpointPath) {
  if (endpointPath.startsWith('/indexing/')) {
    return 'Indexing API';
  }
  return 'Client API';
}

/**
 * Generate RSS feed from deprecations data
 */
function generateRss() {
  if (!fs.existsSync(DEPRECATIONS_DATA_FILE)) {
    console.error(
      'Deprecations data file does not exist:',
      DEPRECATIONS_DATA_FILE,
    );
    console.log(
      'Run "pnpm generate:deprecations" first to generate the data file.',
    );
    process.exit(1);
  }

  if (!needsRegeneration(DEPRECATIONS_DATA_FILE, RSS_OUTPUT_FILE)) {
    console.log(
      'No changes detected in deprecations data, skipping RSS generation',
    );
    return;
  }

  const deprecationsData = JSON.parse(
    fs.readFileSync(DEPRECATIONS_DATA_FILE, 'utf-8'),
  );
  const { endpoints, generatedAt } = deprecationsData;

  const feed = new Feed({
    title: 'Glean API Deprecations',
    description: "Deprecated endpoints, fields, and parameters in Glean's APIs",
    id: SITE_URL,
    link: DEPRECATIONS_URL,
    language: 'en',
    image: `${SITE_URL}/img/glean-developer-logo-light.svg`,
    favicon: `${SITE_URL}/img/favicon.png`,
    copyright: `Copyright © ${new Date().getFullYear()} Glean`,
    generator: 'Glean Developer Site',
    feedLinks: {
      rss2: `${SITE_URL}/deprecations.xml`,
    },
    author: {
      name: 'Glean',
      link: 'https://glean.com',
    },
    updated: new Date(generatedAt),
  });

  // Flatten all deprecations from all endpoints and sort by introduced date
  const allDeprecations = [];

  for (const endpoint of endpoints) {
    const location = getLocationFromPath(endpoint.path);

    for (const deprecation of endpoint.deprecations) {
      allDeprecations.push({
        ...deprecation,
        endpoint: {
          method: endpoint.method,
          path: endpoint.path,
        },
        location,
      });
    }
  }

  // Sort by introduced date (most recent first)
  allDeprecations.sort(
    (a, b) => new Date(b.introduced) - new Date(a.introduced),
  );

  // Add each deprecation as an RSS item
  for (const dep of allDeprecations) {
    const title = `Deprecation: ${dep.name} ${dep.type} on ${dep.endpoint.method} ${dep.endpoint.path}`;
    const pubDate = new Date(dep.introduced);

    const descriptionHtml = `<p>${dep.message}</p>
<p>Removal date: ${dep.removal}</p>`;

    feed.addItem({
      title,
      id: dep.id,
      link: DEPRECATIONS_URL,
      description: descriptionHtml,
      author: [
        {
          name: 'Glean',
          link: 'https://glean.com',
        },
      ],
      date: pubDate,
      category: [{ name: dep.location }],
    });
  }

  // Ensure output directory exists
  fs.mkdirSync(RSS_OUTPUT_DIR, { recursive: true });

  // Write RSS feed
  const rssXml = feed.rss2();
  fs.writeFileSync(RSS_OUTPUT_FILE, rssXml);

  console.log(
    `Generated deprecations RSS feed with ${allDeprecations.length} entries at ${RSS_OUTPUT_FILE}`,
  );
}

// Run if called directly
generateRss();
