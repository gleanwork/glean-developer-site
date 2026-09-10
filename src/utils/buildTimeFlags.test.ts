import { afterEach, describe, expect, it, vi } from 'vitest';

const originalExample = process.env.FF_EXAMPLE_FLAG;

afterEach(() => {
  if (originalExample === undefined) {
    delete process.env.FF_EXAMPLE_FLAG;
  } else {
    process.env.FF_EXAMPLE_FLAG = originalExample;
  }
  vi.resetModules();
});

describe('getBuildTimeFlags', () => {
  it('maps FF_ variables to kebab-case feature flag names', async () => {
    process.env.FF_EXAMPLE_FLAG = 'true';
    vi.resetModules();

    const { getBuildTimeFlags } = await import('./buildTimeFlags');

    expect(getBuildTimeFlags()).toMatchObject({
      'example-flag': { enabled: true },
    });
  });
});
