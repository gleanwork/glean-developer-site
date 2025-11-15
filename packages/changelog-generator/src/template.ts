import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatCategories } from './shared/categories.js';

function getTemplatePath(repoRoot: string): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const pkgTemplatePath = path.join(
    __dirname,
    '..',
    'templates',
    'changelog-entry.md',
  );
  if (fs.existsSync(pkgTemplatePath)) {
    return pkgTemplatePath;
  }

  const repoTemplatePath = path.join(
    repoRoot,
    'scripts',
    'templates',
    'changelog-entry.md',
  );
  return repoTemplatePath;
}

export function renderChangelogEntry(opts: {
  repoRoot: string;
  title: string;
  categories: Array<string>;
  summary: string;
  detailedContent: string;
}): string {
  const templatePath = getTemplatePath(opts.repoRoot);
  const template = fs.readFileSync(templatePath, 'utf-8');

  const variables: Record<string, string> = {
    TITLE: opts.title,
    CATEGORIES: formatCategories(opts.categories),
    SUMMARY: opts.summary.trim(),
    DETAILED_CONTENT: opts.detailedContent.trim(),
  };

  let result = template;

  const placeholderRegexes: Record<string, RegExp> = {};
  for (const key of Object.keys(variables)) {
    placeholderRegexes[key] = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
  }
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(placeholderRegexes[key], value);
  }
  return result;
}
