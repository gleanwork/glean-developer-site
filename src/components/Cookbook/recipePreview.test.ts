import { describe, expect, it } from 'vitest';
import { isRecipeAvailable, recipeHref } from './recipePreview';

const previewRecipe = {
  id: 'preview-search',
  permalink: '/cookbook/preview-search',
  visibility: 'preview' as const,
};

describe('recipe preview helpers', () => {
  it('requires an exact repeatable ff_recipe value for preview recipes', () => {
    expect(isRecipeAvailable(previewRecipe, '?ff_recipe=preview-searc')).toBe(
      false,
    );
    expect(
      isRecipeAvailable(
        previewRecipe,
        '?ff_recipe=another-recipe&ff_recipe=preview-search',
      ),
    ).toBe(true);
  });

  it('keeps public recipes available and appends grants only to preview links', () => {
    const publicRecipe = { ...previewRecipe, visibility: 'public' as const };
    expect(isRecipeAvailable(publicRecipe, '')).toBe(true);
    expect(recipeHref(publicRecipe)).toBe('/cookbook/preview-search');
    expect(recipeHref(previewRecipe)).toBe(
      '/cookbook/preview-search?ff_recipe=preview-search',
    );
  });
});
