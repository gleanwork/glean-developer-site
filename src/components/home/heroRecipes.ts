import { isRecipeAvailable } from '@site/src/components/Cookbook/recipePreview';
import {
  RECIPE_CAPABILITY_LABELS,
  type RecipeRecord,
} from '@site/src/types/recipe';

export interface HeroRecipeLink {
  href: string;
  /** Visible text; the slide already names the capability. */
  label: string;
  /** Accessible name, which carries the capability for screen readers. */
  ariaLabel: string;
}

/**
 * Link from a hero slide to its filtered Cookbook listing, or null when no
 * publicly listed recipe covers the capability. Counts only what the Cookbook
 * index shows without a preview grant, so the number matches the landing page.
 */
export function heroRecipeLink(
  recipes: Pick<RecipeRecord, 'id' | 'visibility' | 'capabilities'>[],
  capability: string,
): HeroRecipeLink | null {
  const count = recipes.filter(
    (recipe) =>
      isRecipeAvailable(recipe, '') &&
      recipe.capabilities.some((value) => value === capability),
  ).length;
  if (count === 0) return null;

  const name = RECIPE_CAPABILITY_LABELS[capability] ?? capability;
  const noun = count === 1 ? 'recipe' : 'recipes';
  const params = new URLSearchParams({ capability });
  return {
    href: `/cookbook?${params.toString()}`,
    label: `${count} ${noun} in the Cookbook`,
    ariaLabel: `${count} ${name} ${noun} in the Cookbook`,
  };
}
