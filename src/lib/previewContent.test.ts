import { describe, expect, it } from 'vitest';
import { isContentVisible, previewGrantFromSearch } from './previewContent';

describe('isContentVisible', () => {
  it('always shows public items', () => {
    expect(isContentVisible({ visibility: 'public' }, false)).toBe(true);
    expect(isContentVisible({ visibility: 'public' }, true)).toBe(true);
  });

  it('shows preview items only when previews are enabled', () => {
    expect(isContentVisible({ visibility: 'preview' }, false)).toBe(false);
    expect(isContentVisible({ visibility: 'preview' }, true)).toBe(true);
  });
});

describe('previewGrantFromSearch', () => {
  it('reads an explicit grant or revocation', () => {
    expect(previewGrantFromSearch('?ff_preview-content=true')).toBe(true);
    expect(previewGrantFromSearch('?ff_preview-content=1')).toBe(true);
    expect(previewGrantFromSearch('?ff_preview-content=false')).toBe(false);
    expect(previewGrantFromSearch('?ff_preview-content=')).toBe(false);
  });

  it('ignores absent and per-item parameters', () => {
    expect(previewGrantFromSearch('')).toBeUndefined();
    expect(previewGrantFromSearch('?ff_recipe=x&ff_video=y')).toBeUndefined();
  });
});
