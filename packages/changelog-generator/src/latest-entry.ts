import * as fs from 'node:fs';
import * as path from 'node:path';

export function getLatestChangelogEntryDate(repoRoot: string): string | null {
  const entriesDir = path.join(repoRoot, 'changelog', 'entries');
  if (!fs.existsSync(entriesDir)) return null;

  const files = fs
    .readdirSync(entriesDir)
    .filter((f: string) => f.endsWith('.md'))
    .sort();

  if (files.length === 0) return null;

  let latestDate: string | null = null;
  let latestFile: string | null = null;

  for (const fileName of files) {
    const match = fileName.match(/^(\d{4}-\d{2}-\d{2})-.+\.md$/);
    if (!match) continue;
    const date = match[1];
    if (
      latestDate === null ||
      date > latestDate ||
      (date === latestDate && fileName > (latestFile || ''))
    ) {
      latestDate = date;
      latestFile = fileName;
    }
  }

  return latestDate;
}


