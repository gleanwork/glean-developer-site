import type React from 'react';
import recipesData from '@site/src/data/recipes.json';
import type { RecipesData } from '../../types/recipe';
import RecipeLayout from './RecipeLayout';

interface RecipePageProps {
  recipeId: string;
  children: React.ReactNode;
}

/**
 * Entry point used by recipe MDX pages:
 *
 *   <RecipePage recipeId="embed-search-chat"> ...body... </RecipePage>
 *
 * Looks up the page's compiled record from recipes.json and wraps the body
 * in RecipeLayout. Throws on an unknown id so a typo fails the static build
 * instead of shipping a page with an empty rail.
 */
export default function RecipePage({
  recipeId,
  children,
}: RecipePageProps): React.ReactElement {
  const recipe = (recipesData as RecipesData).recipes.find(
    (r) => r.id === recipeId,
  );

  if (!recipe) {
    throw new Error(
      `RecipePage: no compiled recipe with id "${recipeId}". ` +
        'Check the recipeId prop against the recipe frontmatter, and that ' +
        'recipes:compile ran.',
    );
  }

  return <RecipeLayout recipe={recipe}>{children}</RecipeLayout>;
}
