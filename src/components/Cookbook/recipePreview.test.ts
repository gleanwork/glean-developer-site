import { describe, expect, it } from 'vitest';
import { isRecipeAvailable } from './recipePreview';

describe('isRecipeAvailable', () => {
  it('shows preview recipes only when previews are enabled', () => {
    expect(isRecipeAvailable({ visibility: 'preview' }, false)).toBe(false);
    expect(isRecipeAvailable({ visibility: 'preview' }, true)).toBe(true);
  });

  it('always shows public recipes', () => {
    expect(isRecipeAvailable({ visibility: 'public' }, false)).toBe(true);
  });
});
