import { afterEach, describe, expect, it, vi } from 'vitest';

const originalCookbooks = process.env.FF_COOKBOOKS;

afterEach(() => {
  if (originalCookbooks === undefined) {
    delete process.env.FF_COOKBOOKS;
  } else {
    process.env.FF_COOKBOOKS = originalCookbooks;
  }
  vi.resetModules();
});

describe('getBuildTimeFlags', () => {
  it('maps the documented FF_COOKBOOKS variable to the cookbook flag', async () => {
    process.env.FF_COOKBOOKS = 'true';
    vi.resetModules();

    const { getBuildTimeFlags } = await import('./buildTimeFlags');

    expect(getBuildTimeFlags()).toMatchObject({
      cookbook: { enabled: true },
    });
    expect(getBuildTimeFlags()).not.toHaveProperty('cookbooks');
  });
});
