import { describe, it, expect } from 'vitest';
import { validateSummary, validateRenderedEntry } from '../validators.js';

describe('validateSummary', () => {
  describe('should reject invalid summaries', () => {
    it('rejects empty string', () => {
      const result = validateSummary('');
      expect(result.valid).toBe(false);
    });

    it('rejects "- : - **Added**."', () => {
      const result = validateSummary('- : - **Added**.');
      expect(result.valid).toBe(false);
    });

    it('rejects markdown bullet summaries', () => {
      const result = validateSummary('- Added support for a new endpoint.');
      expect(result.valid).toBe(false);
    });

    it('rejects emoji shortcodes', () => {
      const result = validateSummary(
        ':rocket: Added support for a new endpoint.',
      );
      expect(result.valid).toBe(false);
    });

    it('rejects string exceeding maxChars', () => {
      const long = 'A'.repeat(500);
      const result = validateSummary(long, { maxChars: 300 });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('exceeds');
    });
  });

  describe('should accept valid summaries', () => {
    it('accepts a well-formed sentence about chat file metadata', () => {
      const result = validateSummary(
        'Added partiallyProcessed status to chat file metadata for create and retrieve operations.',
      );
      expect(result.valid).toBe(true);
    });

    it('accepts a summary about Go API client update', () => {
      const result = validateSummary(
        'Updated Go API client to version v0.11.37 with OpenAPI Doc 0.9.0 changes.',
      );
      expect(result.valid).toBe(true);
    });

    it('accepts a summary about status enum additions', () => {
      const result = validateSummary(
        'The Go API client adds the status enum to chat citation and file metadata fields.',
      );
      expect(result.valid).toBe(true);
    });

    it('accepts a summary about breaking changes', () => {
      const result = validateSummary(
        'Breaking changes to multiple request and response fields across document, answer, shortcut APIs.',
      );
      expect(result.valid).toBe(true);
    });

    it('rejects a summary with flattened detail bullets', () => {
      const result = validateSummary(
        '1 field changed, 1 field added across insights retrieve, search retrievefeed endpoints. - changed AgentsResponse in insights retrieve - added spreadsheetType in search retrievefeed',
      );
      expect(result.valid).toBe(false);
    });
  });
});

describe('validateRenderedEntry', () => {
  it('rejects content without frontmatter', () => {
    const result = validateRenderedEntry('No frontmatter here.');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('frontmatter');
  });

  it('rejects content with missing title', () => {
    const content = `---
categories: [API Clients]
---
Some summary content about the release with enough meaningful tokens.

{/* truncate */}`;

    const result = validateRenderedEntry(content);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('title');
  });

  it('rejects content with missing categories', () => {
    const content = `---
title: Go SDK v0.11.41
---
Some summary content about the release with enough meaningful tokens.

{/* truncate */}`;

    const result = validateRenderedEntry(content);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('categories');
  });

  it('rejects content with empty summary', () => {
    const content = `---
title: Go SDK v0.11.41
categories: [API Clients]
---
{/* truncate */}
`;

    const result = validateRenderedEntry(content);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Empty summary');
  });

  it('accepts well-formed entry with valid summary', () => {
    const content = `---
title: Go SDK v0.11.41
categories: [API Clients]
---
Added partiallyProcessed status to chat file metadata for create and retrieve operations.

{/* truncate */}

## Details
More details here.`;

    const result = validateRenderedEntry(content);
    expect(result.valid).toBe(true);
  });
});
