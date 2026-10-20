import { describe, expect, it } from 'vitest';

import { normalizeParamValue } from './normalizeParamValue';

describe('normalizeParamValue', () => {
  it('converts a numeric default to a string', () => {
    expect(
      normalizeParamValue({ in: 'query', name: 'page_size', value: 50 }),
    ).toEqual({ in: 'query', name: 'page_size', value: '50' });
  });

  it('converts a boolean default to a string', () => {
    expect(
      normalizeParamValue({
        in: 'header',
        name: 'X-Glean-Include-Experimental',
        value: true,
      }),
    ).toEqual({
      in: 'header',
      name: 'X-Glean-Include-Experimental',
      value: 'true',
    });
  });

  it('keeps zero and false', () => {
    expect(normalizeParamValue({ value: 0 })).toEqual({ value: '0' });
    expect(normalizeParamValue({ value: false })).toEqual({ value: 'false' });
  });

  it('leaves strings, arrays, and missing values alone', () => {
    expect(normalizeParamValue({ value: 'true' })).toBeUndefined();
    expect(normalizeParamValue({ value: ['a'] })).toBeUndefined();
    expect(normalizeParamValue({})).toBeUndefined();
  });
});
