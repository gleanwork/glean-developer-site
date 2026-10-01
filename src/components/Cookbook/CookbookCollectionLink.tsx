import type React from 'react';
import Link from '@docusaurus/Link';
import recipesData from '@site/src/data/recipes.json';
import type { RecipesData } from '../../types/recipe';
import styles from './CookbookCollectionLink.module.css';

interface CookbookCollectionLinkProps {
  /** Collection id from the cookbook's config/recipe-collections.json. */
  collection: string;
}

/**
 * Links a feature guide to the Cookbook collection that teaches the same
 * feature by building something. Lists the collection's public recipes in
 * path order. Throws on an unknown id so a typo fails the static build.
 */
export default function CookbookCollectionLink({
  collection: collectionId,
}: CookbookCollectionLinkProps): React.ReactElement | null {
  const data = recipesData as RecipesData;
  const collection = data.collections.find((c) => c.id === collectionId);
  if (!collection) {
    throw new Error(
      `CookbookCollectionLink: no cookbook collection with id "${collectionId}".`,
    );
  }
  const recipes = collection.recipes
    .map((id) => data.recipes.find((recipe) => recipe.id === id))
    .filter(
      (recipe): recipe is RecipesData['recipes'][number] =>
        recipe !== undefined && recipe.visibility !== 'preview',
    );
  if (recipes.length === 0) return null;

  return (
    <aside
      aria-label={`${collection.label} recipes`}
      className={styles.callout}
    >
      <div className={styles.header}>
        <span className={styles.kicker}>Learn by building</span>
        <Link className={styles.all} to={`/cookbook#${collection.id}`}>
          {collection.label} collection →
        </Link>
      </div>
      <ol className={styles.list}>
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            <Link to={`/cookbook/${recipe.id}`}>{recipe.title}</Link>
            <span className={styles.meta}>
              {recipe.level} · {recipe.timeEstimate.replace(/\s*\(.*\)$/, '')}
            </span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
