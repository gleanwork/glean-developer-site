import type { RecipeRecord } from '../../types/recipe';

export const RECIPE_PREVIEW_PARAM = 'ff_recipe';

/** Preview recipes are enabled only by an exact, repeatable recipe-id query value. */
export function isRecipeAvailable(
  recipe: Pick<RecipeRecord, 'id' | 'visibility'>,
  search: string,
): boolean {
  if (recipe.visibility !== 'preview') return true;
  return new URLSearchParams(search)
    .getAll(RECIPE_PREVIEW_PARAM)
    .includes(recipe.id);
}

/** Keep the preview grant when navigating from its gated cookbook card. */
export function recipeHref(
  recipe: Pick<RecipeRecord, 'id' | 'permalink' | 'visibility'>,
): string {
  if (recipe.visibility !== 'preview') return recipe.permalink;
  const params = new URLSearchParams({ [RECIPE_PREVIEW_PARAM]: recipe.id });
  return `${recipe.permalink}?${params.toString()}`;
}
