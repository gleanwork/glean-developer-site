import type React from 'react';
import Head from '@docusaurus/Head';
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
  const data = recipesData as RecipesData;
  const recipe = data.recipes.find((r) => r.id === recipeId);

  if (!recipe) {
    throw new Error(
      `RecipePage: no compiled recipe with id "${recipeId}". ` +
        'Check the recipeId prop against the recipe frontmatter, and that ' +
        'recipes:compile ran.',
    );
  }

  return (
    <>
      {/* Recipe .mdx files carry no frontmatter, so Docusaurus falls back to
          the doc id for <title> and emits no description — every recipe page
          would otherwise present itself as "permissions-aware-retrieval" in browser
          tabs, search results, and link previews. Setting both here keeps the
          registry the one source, the same way the sidebar labels do. */}
      <Head>
        <title>{`${recipe.title} | Glean Developer`}</title>
        <meta name="description" content={recipe.description} />
        <meta property="og:title" content={recipe.title} />
        <meta property="og:description" content={recipe.description} />
      </Head>
      <RecipeLayout plugin={data.plugin} recipe={recipe}>
        {children}
      </RecipeLayout>
    </>
  );
}
