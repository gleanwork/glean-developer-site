import * as fs from 'node:fs';
import * as path from 'node:path';

function formatCategories(categories: Array<string>): string {
  return categories.map((c) => `"${c}"`).join(', ');
}

export function renderChangelogEntry(opts: {
  repoRoot: string;
  title: string;
  categories: Array<string>;
  summary: string;
  detailedContent: string;
}): string {
  const templatePath = path.join(
    opts.repoRoot,
    'scripts',
    'templates',
    'changelog-entry.md',
  );
  const template = fs.readFileSync(templatePath, 'utf-8');

  const variables: Record<string, string> = {
    TITLE: opts.title,
    CATEGORIES: formatCategories(opts.categories),
    SUMMARY: opts.summary.trim(),
    DETAILED_CONTENT: opts.detailedContent.trim(),
  };

  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
  
    result = result.replace(placeholder, value);
  }
  return result;
}


