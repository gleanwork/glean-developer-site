import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { normalizeHistoryEntries } from '../commands/normalize-history.js';

function repoRoot(): string {
  return path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    '..',
    '..',
  );
}

describe('normalizeHistoryEntries', () => {
  it('dry-runs every historical changelog entry without parse failures', () => {
    const result = normalizeHistoryEntries(repoRoot(), { dryRun: true });

    expect(result.total).toBeGreaterThan(0);
    expect(result.rewritten).toBe(0);
    expect(result.failures).toEqual([]);
  });

  it('keeps historical entries free of known broken formatting patterns', async () => {
    const fs = await import('node:fs/promises');
    const entriesDir = path.join(repoRoot(), 'changelog', 'entries');
    const files = (await fs.readdir(entriesDir)).filter((file) =>
      file.endsWith('.md'),
    );

    for (const file of files) {
      const content = await fs.readFile(path.join(entriesDir, file), 'utf8');
      const body = content.replace(/^---\n[\s\S]*?\n---\n/, '');
      const summary = body.split('{/* truncate */}')[0].trim();

      expect(summary, file).not.toMatch(/\.\.\.$/);
      expect(summary, file).not.toMatch(
        /\b(and|or|to|on|in|for|from|with|across|including|include|includes|of|the|a|an)\.$/i,
      );
      expect(body, file).not.toMatch(
        /[^\n][ \t]+-[ \t]+(Added|Changed|Fixed|Removed|Deprecated|Breaking|Migrated|Updated|Introduced|Improved|Enhanced|Refactored|Support|Documentation|Enhancement|Internal|Affected component)\b/i,
      );
      expect(content, file).not.toMatch(
        /(Added|Removed|New) endpoint:[^\n]+(Added|Removed|New) endpoint:/i,
      );
      expect(content, file).not.toMatch(
        /This change more|Breaking Changes:\s+-/i,
      );
    }
  });
});
