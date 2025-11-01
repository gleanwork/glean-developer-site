import { describe, it, expect } from 'vitest';
import { summarizeRelease } from '../src/summarizer.js';

const SAMPLE = `
# v1.2.3

### Added
- New endpoint for listing widgets with pagination.
- Support for OAuth device flow.

### Fixed
- Handle 429 retry logic in the client.

For details see https://github.com/org/repo/releases/tag/v1.2.3
`;

describe('summarizer', () => {
  it('returns a concise heuristic summary string', async () => {
    const res = await summarizeRelease(SAMPLE, {
      mode: 'heuristic',
      maxBullets: 3,
      maxChars: 300,
    });
    expect(typeof res).toBe('string');
    expect(res.length).toBeGreaterThan(0);
  });
});


