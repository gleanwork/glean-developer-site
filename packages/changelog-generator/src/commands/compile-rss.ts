import * as fs from 'node:fs';
import * as path from 'node:path';
import { Feed } from 'feed';

function needsRegeneration(
  changelogDataFile: string,
  rssOutputFile: string,
): boolean {
  if (!fs.existsSync(rssOutputFile)) {
    return true;
  }

  if (!fs.existsSync(changelogDataFile)) {
    return true;
  }

  const changelogStats = fs.statSync(changelogDataFile);
  const rssStats = fs.statSync(rssOutputFile);

  return changelogStats.mtime > rssStats.mtime;
}

/**
 * Generates an RSS feed from the changelog JSON data.
 * Reads src/data/changelog.json and creates an RSS 2.0 feed at static/changelog.xml.
 * Uses file modification times to skip regeneration if changelog.json hasn't changed.
 */
export function rssCommand(repoRoot: string): void {
  const changelogDataFile = path.join(
    repoRoot,
    'src',
    'data',
    'changelog.json',
  );
  const rssOutputDir = path.join(repoRoot, 'static');
  const rssOutputFile = path.join(rssOutputDir, 'changelog.xml');

  if (!fs.existsSync(changelogDataFile)) {
    console.error('Changelog data file does not exist:', changelogDataFile);
    process.exit(1);
  }

  if (!needsRegeneration(changelogDataFile, rssOutputFile)) {
    console.log(
      'No changes detected in changelog data, skipping RSS generation',
    );
    return;
  }

  const changelogData = JSON.parse(fs.readFileSync(changelogDataFile, 'utf-8'));
  const { entries } = changelogData;

  const siteUrl = 'https://developers.glean.com';
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

  entries.forEach((entry: any) => {
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
      category: entry.categories.map((cat: string) => ({ name: cat })),
    });
  });

  fs.mkdirSync(rssOutputDir, { recursive: true });

  const rssXml = feed.rss2();
  fs.writeFileSync(rssOutputFile, rssXml);

  console.log(
    `Generated RSS feed with ${entries.length} entries at ${rssOutputFile}`,
  );
}
