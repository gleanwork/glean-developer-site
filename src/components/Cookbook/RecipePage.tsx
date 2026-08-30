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

const NOT_FOUND_TITLE = 'Page not found';
const NOT_FOUND_DESCRIPTION = 'The page you requested could not be found.';

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
  const isPreview = recipe?.visibility === 'preview';
  const isAvailable = Boolean(
    recipe &&
    (!isPreview || (hydrated && isRecipeAvailable(recipe, location.search))),
  );

  useEffect(() => setHydrated(true), []);

  // The parent Docusaurus doc metadata remains mounted while this component
  // swaps its server-safe not-found head for the unlocked preview head. Apply
  // the final title after that hydration transition so the parent cannot leave
  // a flagged route titled with its generated doc id.
  useEffect(() => {
    if (hydrated && recipe) {
      document.title = isAvailable
        ? `${recipe.title} | Glean Developer`
        : 'Page not found | Glean Developer';
    }
  }, [hydrated, isAvailable, recipe]);

  if (!recipe) {
    throw new Error(
      `RecipePage: no compiled recipe with id "${recipeId}". ` +
        'Check the recipeId prop against the recipe frontmatter, and that ' +
        'recipes:compile ran.',
    );
  }

  if (!isAvailable) {
    return (
      <>
        <Head>
          <title>{`${NOT_FOUND_TITLE} | Glean Developer`}</title>
          <meta name="description" content={NOT_FOUND_DESCRIPTION} />
          <meta property="og:title" content={NOT_FOUND_TITLE} />
          <meta property="og:description" content={NOT_FOUND_DESCRIPTION} />
          <meta name="robots" content="noindex,nofollow" />
        </Head>
        <div className="container margin-vert--lg">
          <h1>{NOT_FOUND_TITLE}</h1>
          <p>{NOT_FOUND_DESCRIPTION}</p>
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
