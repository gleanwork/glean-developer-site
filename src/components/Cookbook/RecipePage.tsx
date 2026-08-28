import type React from 'react';
import { useEffect, useState } from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import recipesData from '@site/src/data/recipes.json';
import type { RecipesData } from '../../types/recipe';
import RecipeLayout from './RecipeLayout';
import { isRecipeAvailable } from './recipePreview';

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
  const location = useLocation();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  if (!recipe) {
    throw new Error(
      `RecipePage: no compiled recipe with id "${recipeId}". ` +
        'Check the recipeId prop against the recipe frontmatter, and that ' +
        'recipes:compile ran.',
    );
  }

  const isPreview = recipe.visibility === 'preview';
  const isAvailable =
    !isPreview || (hydrated && isRecipeAvailable(recipe, location.search));

  if (!isAvailable) {
    return (
      <>
        <Head>
          <title>Page not found | Glean Developer</title>
          <meta name="robots" content="noindex,nofollow" />
        </Head>
        <div className="container margin-vert--lg">
          <h1>Page not found</h1>
          <p>The page you requested could not be found.</p>
          <Link to="/cookbook">Browse the cookbook</Link>
        </div>
      </>
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
        {isPreview ? <meta name="robots" content="noindex,nofollow" /> : null}
      </Head>
      <RecipeLayout plugin={data.plugin} recipe={recipe}>
        {children}
      </RecipeLayout>
    </>
  );
}
