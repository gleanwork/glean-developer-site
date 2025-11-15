import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  generateFilename,
  createSlug,
  getCurrentDate,
} from '../src/shared/filename.js';
import {
  formatCategories,
  PRIMARY_CATEGORIES,
  SECONDARY_CATEGORIES,
} from '../src/shared/categories.js';
import {
  processChangelogContent,
  markdownToHtml,
} from '../src/shared/markdown.js';
import { parseChangelogEntry } from '../src/shared/entry-parser.js';

describe('Filename utilities', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'changelog-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('createSlug creates valid slugs', () => {
    expect(createSlug('My Test Entry')).toBe('my-test-entry');
    expect(createSlug('API v2.0.1')).toBe('api-v201');
    expect(createSlug('Test: with special chars!')).toBe(
      'test-with-special-chars',
    );
  });

  it('getCurrentDate returns YYYY-MM-DD format', () => {
    const date = getCurrentDate();
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('generateFilename creates unique filenames', () => {
    const title = 'Test Entry';
    const filename1 = generateFilename(title, tempDir);
    expect(filename1).toMatch(/^\d{4}-\d{2}-\d{2}-test-entry\.md$/);

    fs.writeFileSync(path.join(tempDir, filename1), '');

    const filename2 = generateFilename(title, tempDir);
    expect(filename2).toMatch(/^\d{4}-\d{2}-\d{2}-test-entry-1\.md$/);

    fs.writeFileSync(path.join(tempDir, filename2), '');

    const filename3 = generateFilename(title, tempDir);
    expect(filename3).toMatch(/^\d{4}-\d{2}-\d{2}-test-entry-2\.md$/);
  });
});

describe('Category utilities', () => {
  it('formatCategories formats correctly', () => {
    expect(formatCategories(['API'])).toBe('"API"');
    expect(formatCategories(['API', 'Feature'])).toBe('"API", "Feature"');
    expect(formatCategories(['SDK', 'Breaking', 'Enhancement'])).toBe(
      '"SDK", "Breaking", "Enhancement"',
    );
  });

  it('PRIMARY_CATEGORIES contains expected values', () => {
    expect(PRIMARY_CATEGORIES).toContain('API');
    expect(PRIMARY_CATEGORIES).toContain('SDK');
    expect(PRIMARY_CATEGORIES).toContain('MCP');
  });

  it('SECONDARY_CATEGORIES contains expected values', () => {
    expect(SECONDARY_CATEGORIES).toContain('Feature');
    expect(SECONDARY_CATEGORIES).toContain('Breaking');
    expect(SECONDARY_CATEGORIES).toContain('Bug Fix');
  });
});

describe('Markdown utilities', () => {
  it('markdownToHtml converts markdown', () => {
    const html = markdownToHtml('**bold** text');
    expect(html).toContain('<strong>');
    expect(html).toContain('bold');
  });

  it('processChangelogContent handles truncate marker', () => {
    const content = 'Summary text\n\n{/* truncate */}\n\nDetailed content here';
    const result = processChangelogContent(content);

    expect(result.hasTruncation).toBe(true);
    expect(result.summary).toContain('Summary text');
    expect(result.fullContent).toContain('Detailed content');
    expect(result.fullContent).not.toContain('truncate');
  });

  it('processChangelogContent handles multiple paragraphs', () => {
    const content = 'First paragraph\n\nSecond paragraph\n\nThird paragraph';
    const result = processChangelogContent(content);

    expect(result.hasTruncation).toBe(true);
    expect(result.summary).toContain('First paragraph');
    expect(result.fullContent).toContain('Second paragraph');
  });

  it('processChangelogContent handles long content', () => {
    const content = 'a'.repeat(250);
    const result = processChangelogContent(content);

    expect(result.hasTruncation).toBe(true);
    expect(result.summary.length).toBeLessThan(result.fullContent.length);
    expect(result.summary).toContain('...');
  });

  it('processChangelogContent handles short content', () => {
    const content = 'Short content';
    const result = processChangelogContent(content);

    expect(result.hasTruncation).toBe(false);
    expect(result.summary).toBe(result.fullContent);
  });
});

describe('Entry parser', () => {
  it('parseChangelogEntry parses valid entry', () => {
    const fileName = '2025-11-15-test-entry.md';
    const content = `---
title: "Test Entry"
categories: ["API", "Feature"]
---

This is the summary.

{/* truncate */}

This is the detailed content.`;

    const entry = parseChangelogEntry(fileName, content);

    expect(entry.id).toBe('2025-11-15-test-entry');
    expect(entry.slug).toBe('test-entry');
    expect(entry.title).toBe('Test Entry');
    expect(entry.date).toBe('2025-11-15');
    expect(entry.categories).toEqual(['API', 'Feature']);
    expect(entry.hasTruncation).toBe(true);
    expect(entry.fileName).toBe(fileName);
  });

  it('parseChangelogEntry throws on invalid filename', () => {
    expect(() => {
      parseChangelogEntry(
        'invalid-filename.md',
        '---\ntitle: "Test"\n---\nContent',
      );
    }).toThrow('Invalid changelog filename format');
  });

  it('parseChangelogEntry throws on invalid date', () => {
    expect(() => {
      parseChangelogEntry(
        '2025-13-45-test.md',
        '---\ntitle: "Test"\n---\nContent',
      );
    }).toThrow('Invalid date in filename');
  });
});
