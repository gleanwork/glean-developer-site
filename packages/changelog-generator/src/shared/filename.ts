import * as fs from 'node:fs';
import * as path from 'node:path';
import * as slugifyModule from 'slugify';

const slugifyFn = (slugifyModule as any).default || slugifyModule;

export function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createSlug(title: string): string {
  return slugifyFn(title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
}

export function generateFilename(title: string, entriesDir: string): string {
  const date = getCurrentDate();
  const slug = createSlug(title);
  let filename = `${date}-${slug}.md`;
  let counter = 1;

  while (fs.existsSync(path.join(entriesDir, filename))) {
    filename = `${date}-${slug}-${counter}.md`;
    counter++;
  }

  return filename;
}
