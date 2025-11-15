#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';
import { findUp } from 'find-up';
import { Command } from 'commander';
import { createCommand } from './commands/entry-new.js';
import { buildCommand } from './commands/compile-json.js';
import { rssCommand } from './commands/compile-rss.js';
import { syncAllCommand } from './commands/sync-all.js';
import { previewCommand } from './commands/preview.js';
import { publishCommand } from './commands/publish.js';

async function findRepoRoot(startDir: string): Promise<string> {
  const pkgJsonFile = await findUp('package.json', { cwd: startDir });
  if (pkgJsonFile) {
    const pkgDir = path.dirname(pkgJsonFile);
    const changelogDir = path.join(pkgDir, 'changelog');
    if (fs.existsSync(changelogDir)) {
      return pkgDir;
    }
  }

  const templateFile = await findUp(
    (dir: string) => {
      const oldPath = path.join(
        dir,
        'scripts',
        'templates',
        'changelog-entry.md',
      );
      if (fs.existsSync(oldPath)) return oldPath;

      const newPath = path.join(
        dir,
        'packages',
        'changelog-generator',
        'templates',
        'changelog-entry.md',
      );
      if (fs.existsSync(newPath)) return newPath;

      return undefined;
    },
    { cwd: startDir },
  );

  if (!templateFile) return startDir;

  if (templateFile.includes('packages/changelog-generator')) {
    return path.resolve(path.dirname(templateFile), '..', '..', '..');
  }

  return path.resolve(path.dirname(templateFile), '..', '..');
}

async function main() {
  const repoRoot = await findRepoRoot(process.cwd());

  try {
    const rootEnvPath = path.join(repoRoot, '.env');
    const pkgEnvPath = path.join(
      repoRoot,
      'packages',
      'changelog-generator',
      '.env',
    );
    if (fs.existsSync(rootEnvPath)) dotenv.config({ path: rootEnvPath });
    if (fs.existsSync(pkgEnvPath)) dotenv.config({ path: pkgEnvPath });
  } catch {}

  const program = new Command();

  program
    .name('changelog-generator')
    .description('Generate and manage changelog entries')
    .version('0.0.0');

  program
    .command('entry-new')
    .description('Interactively create a new changelog entry')
    .action(async () => {
      await createCommand(repoRoot);
    });

  program
    .command('compile-json')
    .description('Build changelog data from entries')
    .action(() => {
      buildCommand(repoRoot);
    });

  program
    .command('compile-rss')
    .description('Generate RSS feed from changelog data')
    .action(() => {
      rssCommand(repoRoot);
    });

  program
    .command('sync-all')
    .description('Generate entries from GitHub releases')
    .option('--dry-run', 'Preview without creating PR')
    .action(async (options) => {
      await syncAllCommand(repoRoot, { dryRun: options.dryRun });
    });

  program
    .command('preview')
    .description('Analyze releases and output JSON')
    .action(async () => {
      await previewCommand(repoRoot);
    });

  program
    .command('publish')
    .description('Apply analyzed changelog from JSON')
    .option('--input <path>', 'Path to JSON input')
    .action(async (options) => {
      await publishCommand(repoRoot, { input: options.input });
    });

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error('[main]', err?.stack || err?.message || String(err));
  process.exit(1);
});
