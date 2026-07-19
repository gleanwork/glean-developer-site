import type React from 'react';
import { useMemo, useState } from 'react';
import { RECIPE_SURFACE_LABELS, type RecipeRecord } from '../../types/recipe';
import FlagshipCard from './FlagshipCard';
import RecipeCard from './RecipeCard';
import styles from './RecipeIndex.module.css';

interface RecipeIndexProps {
  recipes: Array<RecipeRecord>;
  /** Surface slugs present in the compiled data (from recipes.json). */
  surfaces: Array<string>;
}

function label(slug: string): string {
  return (
    RECIPE_SURFACE_LABELS[slug as keyof typeof RECIPE_SURFACE_LABELS] ?? slug
  );
}

function matches(recipe: RecipeRecord, filter: string): boolean {
  if (filter === 'all') return true;
  return (recipe.surfaces as Array<string>).includes(filter);
}

/**
 * Cookbook index per design handoff 4a: header, flagship hero, single-select
 * filter chips with a live count, and the 2-col recipe grid.
 */
export default function RecipeIndex({
  recipes,
  surfaces,
}: RecipeIndexProps): React.ReactElement {
  const [activeFilter, setActiveFilter] = useState('all');

  const flagship = recipes.find((r) => r.tags.includes('flagship'));
  const gridRecipes = recipes.filter((r) => r !== flagship);

  const chips = useMemo(() => ['all', ...surfaces], [surfaces]);

  const visibleRecipes = useMemo(
    () => gridRecipes.filter((r) => matches(r, activeFilter)),
    [gridRecipes, activeFilter],
  );

  const flagshipVisible = flagship ? matches(flagship, activeFilter) : false;
  const count = visibleRecipes.length + (flagshipVisible ? 1 : 0);

  return (
    <div className={styles.wrap}>
      <div className={styles.eyebrow}>Cookbooks</div>
      <h1 className={styles.title}>Recipes for building on Glean</h1>
      <p className={styles.subtitle}>
        Runnable patterns that go from problem to a working demo to scaffolded
        starter code — with the architecture, auth, and permissions laid out for
        each.
      </p>

      {recipes.length === 0 ? (
        <div className={styles.empty}>
          <p>Recipes are coming soon.</p>
        </div>
      ) : (
        <>
          {flagship && flagshipVisible ? (
            <FlagshipCard recipe={flagship} />
          ) : null}

          <div className={styles.filterBar}>
            <div className={styles.chipRow}>
              {chips.map((chip) => (
                <button
                  aria-pressed={activeFilter === chip}
                  className={`${styles.chip} ${
                    activeFilter === chip ? styles.chipActive : ''
                  }`}
                  key={chip}
                  onClick={() => setActiveFilter(chip)}
                  type="button"
                >
                  {chip === 'all' ? 'All' : label(chip)}
                </button>
              ))}
            </div>
            <span className={styles.count}>
              {count} recipe{count === 1 ? '' : 's'}
            </span>
          </div>

          <div className={styles.grid}>
            {visibleRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>

          {count === 0 ? (
            <div className={styles.empty}>
              <p>No recipes match the selected filter.</p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
