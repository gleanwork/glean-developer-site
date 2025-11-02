import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { renderChangelogEntry } from '../src/template';

describe('template rendering', () => {
  it('renders frontmatter and sections', () => {
    const repoRoot = path.resolve(__dirname, '../../..');
    const out = renderChangelogEntry({
      repoRoot,
      title: 'Test Title',
      categories: ['API'],
      summary: 'Summary line',
      detailedContent: 'Details here',
    });
    expect(out).toContain('title: "Test Title"');
    expect(out).toContain('categories: ["API"]');
    expect(out).toContain('Summary line');
    expect(out).toContain('Details here');
  });
});


