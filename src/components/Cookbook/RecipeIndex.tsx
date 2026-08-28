import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from '@docusaurus/router';
import {
  RECIPE_CAPABILITY_LABELS,
  RECIPE_SURFACE_LABELS,
  type RecipeCapability,
  type RecipeRecord,
  type RecipeSurface,
} from '../../types/recipe';
import FlagshipCard from './FlagshipCard';
import RecipeCard from './RecipeCard';
import { isRecipeAvailable } from './recipePreview';
import styles from './RecipeIndex.module.css';

interface RecipeIndexProps {
  recipes: RecipeRecord[];
  /** Capability slugs present in the compiled data (from recipes.json). */
  capabilities: readonly RecipeCapability[];
  /** Surface slugs present in the compiled data (from recipes.json). */
  surfaces: readonly RecipeSurface[];
}

type Filter = string | 'all';

function validFilter(
  value: string | null,
  available: readonly string[],
): Filter {
  return value && available.includes(value) ? value : 'all';
}

function matches(
  recipe: RecipeRecord,
  capability: Filter,
  surface: Filter,
): boolean {
  return (
    (capability === 'all' ||
      recipe.capabilities.some((value) => value === capability)) &&
    (surface === 'all' || recipe.surfaces.some((value) => value === surface))
  );
}

/**
 * Cookbook front door: foundational quickstarts first, then featured and
 * production recipes with capability-first, shareable filtering.
 */
export default function RecipeIndex({
  recipes,
  capabilities: catalogCapabilities,
  surfaces: catalogSurfaces,
}: RecipeIndexProps): React.ReactElement {
  const history = useHistory();
  const location = useLocation();

  const availableRecipes = useMemo(
    () =>
      recipes.filter((recipe) => isRecipeAvailable(recipe, location.search)),
    [recipes, location.search],
  );
  const capabilities = useMemo(
    () =>
      catalogCapabilities.filter((capability) =>
        availableRecipes.some((recipe) =>
          recipe.capabilities.includes(capability),
        ),
      ),
    [availableRecipes, catalogCapabilities],
  );
  const surfaces = useMemo(
    () =>
      catalogSurfaces.filter((surface) =>
        availableRecipes.some((recipe) => recipe.surfaces.includes(surface)),
      ),
    [availableRecipes, catalogSurfaces],
  );

  const filtersFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return {
      capability: validFilter(params.get('capability'), capabilities),
      surface: validFilter(params.get('surface'), surfaces),
    };
  };
  const initialFilters = filtersFromUrl();
  const [activeCapability, setActiveCapability] = useState<Filter>(
    initialFilters.capability,
  );
  const [activeSurface, setActiveSurface] = useState<Filter>(
    initialFilters.surface,
  );

  useEffect(() => {
    const next = filtersFromUrl();
    setActiveCapability(next.capability);
    setActiveSurface(next.surface);
  }, [location.search, capabilities, surfaces]);

  const updateFilter = (dimension: 'capability' | 'surface', value: Filter) => {
    if (dimension === 'capability') setActiveCapability(value);
    else setActiveSurface(value);

    const params = new URLSearchParams(location.search);
    if (value === 'all') params.delete(dimension);
    else params.set(dimension, value);
    history.push({
      pathname: location.pathname,
      search: params.size > 0 ? `?${params.toString()}` : '',
    });
  };

  const flagship = availableRecipes.find((recipe) =>
    recipe.tags.includes('flagship'),
  );
  const quickstarts = availableRecipes.filter(
    (recipe) => recipe.status === 'quickstart',
  );
  const browseRecipes = availableRecipes.filter(
    (recipe) => recipe !== flagship && recipe.status !== 'quickstart',
  );

  const visibleQuickstarts = useMemo(
    () =>
      quickstarts.filter((recipe) =>
        matches(recipe, activeCapability, activeSurface),
      ),
    [quickstarts, activeCapability, activeSurface],
  );
  const flagshipVisible = Boolean(
    flagship && matches(flagship, activeCapability, activeSurface),
  );
  const visibleBrowseRecipes = useMemo(
    () =>
      browseRecipes.filter((recipe) =>
        matches(recipe, activeCapability, activeSurface),
      ),
    [browseRecipes, activeCapability, activeSurface],
  );
  const count =
    visibleQuickstarts.length +
    visibleBrowseRecipes.length +
    (flagshipVisible ? 1 : 0);

  return (
    <div className={styles.wrap}>
      <div className={styles.eyebrow}>Cookbook</div>
      <h1 className={styles.title}>Build on Glean</h1>
      <p className={styles.subtitle}>
        Start with a core API, use a production pattern, or scaffold a complete
        application. Every recipe includes runnable code, authentication,
        permissions, and verification.
      </p>

      {availableRecipes.length === 0 ? (
        <div className={styles.empty}>
          <p>Recipes are coming soon.</p>
        </div>
      ) : (
        <>
          <div className={styles.filterBar}>
            <div className={styles.filterGroups}>
              <div
                aria-label="Filter by capability"
                className={styles.filterGroup}
                role="group"
              >
                <span className={styles.filterLabel}>Capability</span>
                <div className={styles.chipRow}>
                  {(['all', ...capabilities] as Filter[]).map((capability) => (
                    <button
                      aria-label={
                        capability === 'all'
                          ? 'All capabilities'
                          : RECIPE_CAPABILITY_LABELS[
                              capability as RecipeCapability
                            ]
                      }
                      aria-pressed={activeCapability === capability}
                      className={`${styles.chip} ${
                        activeCapability === capability ? styles.chipActive : ''
                      }`}
                      key={capability}
                      onClick={() => updateFilter('capability', capability)}
                      type="button"
                    >
                      {capability === 'all'
                        ? 'All'
                        : RECIPE_CAPABILITY_LABELS[
                            capability as RecipeCapability
                          ]}
                    </button>
                  ))}
                </div>
              </div>

              <div
                aria-label="Filter by implementation surface"
                className={styles.filterGroup}
                role="group"
              >
                <span className={styles.filterLabel}>Surface</span>
                <div className={styles.chipRow}>
                  {(['all', ...surfaces] as Filter[]).map((surface) => (
                    <button
                      aria-label={
                        surface === 'all'
                          ? 'All surfaces'
                          : RECIPE_SURFACE_LABELS[surface as RecipeSurface]
                      }
                      aria-pressed={activeSurface === surface}
                      className={`${styles.chip} ${
                        activeSurface === surface ? styles.chipActive : ''
                      }`}
                      key={surface}
                      onClick={() => updateFilter('surface', surface)}
                      type="button"
                    >
                      {surface === 'all'
                        ? 'All'
                        : RECIPE_SURFACE_LABELS[surface as RecipeSurface]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <span aria-live="polite" className={styles.count}>
              {count} recipe{count === 1 ? '' : 's'}
            </span>
          </div>

          {visibleQuickstarts.length > 0 ? (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Start with the core APIs</h2>
                  <p>Make a successful call before building a larger app.</p>
                </div>
              </div>
              <div className={styles.grid}>
                {visibleQuickstarts.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </section>
          ) : null}

          {flagship && flagshipVisible ? (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Featured end-to-end build</h2>
                  <p>Combine Glean capabilities in a complete application.</p>
                </div>
              </div>
              <FlagshipCard recipe={flagship} />
            </section>
          ) : null}

          {visibleBrowseRecipes.length > 0 ? (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Browse recipes</h2>
                  <p>Production patterns and complete applications.</p>
                </div>
              </div>
              <div className={styles.grid}>
                {visibleBrowseRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </section>
          ) : null}

          {count === 0 ? (
            <div className={styles.empty}>
              <p>No recipes match both selected filters.</p>
              <button
                className={styles.resetButton}
                onClick={() => {
                  setActiveCapability('all');
                  setActiveSurface('all');
                  const params = new URLSearchParams(location.search);
                  params.delete('capability');
                  params.delete('surface');
                  history.push({
                    pathname: location.pathname,
                    search: params.size > 0 ? `?${params.toString()}` : '',
                  });
                }}
                type="button"
              >
                Reset filters
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
