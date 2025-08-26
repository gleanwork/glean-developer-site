#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Feed } from 'feed';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHANGELOG_DATA_FILE = path.join(
  __dirname,
  '..',
  'src',
  'data',
  'changelog.json',
);
const RSS_OUTPUT_DIR = path.join(__dirname, '..', 'static');
const RSS_OUTPUT_FILE = path.join(RSS_OUTPUT_DIR, 'changelog.xml');

function needsRegeneration() {
  if (!fs.existsSync(RSS_OUTPUT_FILE)) {
    return true;
  }

  if (!fs.existsSync(CHANGELOG_DATA_FILE)) {
    return true;
  }

  const changelogStats = fs.statSync(CHANGELOG_DATA_FILE);
  const rssStats = fs.statSync(RSS_OUTPUT_FILE);

  return changelogStats.mtime > rssStats.mtime;
}

function generateRSSFeed() {
  if (!fs.existsSync(CHANGELOG_DATA_FILE)) {
    console.error('Changelog data file does not exist:', CHANGELOG_DATA_FILE);
    process.exit(1);
  }

  if (!needsRegeneration()) {
    console.log(
      'No changes detected in changelog data, skipping RSS generation',
    );
    return;
  }

  const changelogData = JSON.parse(
    fs.readFileSync(CHANGELOG_DATA_FILE, 'utf-8'),
  );
  const { entries } = changelogData;

  const siteUrl = 'https://glean-developer-site.vercel.app';
  const changelogUrl = `${siteUrl}/changelog`;

  const feed = new Feed({
    title: 'Glean Developer Changelog',
    description: 'Updates and changes to the Glean Developer Platform',
    id: siteUrl,
    link: siteUrl,
    language: 'en',
    image: `${siteUrl}/img/glean-developer-logo-light.svg`,
    favicon: `${siteUrl}/img/favicon.png`,
    copyright: `Copyright © ${new Date().getFullYear()} Glean`,
    generator: 'Glean Developer Site',
    feedLinks: {
      rss2: `${siteUrl}/changelog.xml`,
    },
    author: {
      name: 'Glean',
      link: 'https://glean.com',
    },
    updated: new Date(changelogData.generatedAt),
  });

  entries.forEach((entry) => {
    const entryUrl = `${changelogUrl}#${entry.slug}`;
    const pubDate = new Date(entry.date);

    feed.addItem({
      title: entry.title,
      id: entry.id,
      link: entryUrl,
      description: entry.summary,
      content: entry.fullContent,
      author: [
        {
          name: 'Glean',
          link: 'https://glean.com',
        },
      ],
      date: pubDate,
      category: entry.categories.map((cat) => ({ name: cat })),
    });
  });

  fs.mkdirSync(RSS_OUTPUT_DIR, { recursive: true });

  const rssXml = feed.rss2();
  fs.writeFileSync(RSS_OUTPUT_FILE, rssXml);

  console.log(
    `Generated RSS feed with ${entries.length} entries at ${RSS_OUTPUT_FILE}`,
  );
}

generateRSSFeed();
