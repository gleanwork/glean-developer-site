import { describe, expect, it } from 'vitest';
import { isVisibleInExplorer } from './isVisibleInExplorer';

describe('isVisibleInExplorer', () => {
  it('hides the experimental header regardless of casing', () => {
    expect(
      isVisibleInExplorer({
        in: 'header',
        name: 'X-Glean-Include-Experimental',
      }),
    ).toBe(false);
    expect(
      isVisibleInExplorer({
        in: 'header',
        name: 'x-glean-include-experimental',
      }),
    ).toBe(false);
  });

  it('keeps unrelated headers and non-header parameters', () => {
    expect(isVisibleInExplorer({ in: 'header', name: 'Authorization' })).toBe(
      true,
    );
    expect(
      isVisibleInExplorer({
        in: 'query',
        name: 'X-Glean-Include-Experimental',
      }),
    ).toBe(true);
    expect(isVisibleInExplorer({ in: 'path', name: 'id' })).toBe(true);
  });

  it('filters mixed lists while leaving only-hidden lists empty', () => {
    const mixed = [
      { in: 'query', name: 'q' },
      { in: 'header', name: 'X-Glean-Include-Experimental' },
      { in: 'header', name: 'Accept' },
    ].filter(isVisibleInExplorer);
    expect(mixed.map((p) => p.name)).toEqual(['q', 'Accept']);

    const onlyHidden = [
      { in: 'header', name: 'x-glean-include-experimental' },
    ].filter(isVisibleInExplorer);
    expect(onlyHidden).toEqual([]);
  });
});
