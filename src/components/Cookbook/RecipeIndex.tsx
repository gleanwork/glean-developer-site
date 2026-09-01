import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from '@docusaurus/router';
import {
  RECIPE_CAPABILITY_LABELS,
  RECIPE_LEVELS,
  RECIPE_SURFACE_LABELS,
  type RecipeCapability,
  type RecipeRecord,
  type RecipeSurface,
} from '../../types/recipe';
import RecipeShowcaseCarousel from './RecipeShowcaseCarousel';
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

type Level = (typeof RECIPE_LEVELS)[number];

const LEVEL_SECTIONS: Record<Level, { heading: string; description: string }> =
  {
    Beginner: {
      heading: '01 · Simple recipes',
      description:
        'Start with one clear outcome. Learn the API shape, authentication model, and verification loop without assembling a full system.',
    },
    Intermediate: {
      heading: '02 · Intermediate recipes',
      description:
        'Combine capabilities into useful employee and customer workflows while keeping citations, identity, and permissions visible.',
    },
    Advanced: {
      heading: '03 · Advanced recipes',
      description:
        'Coordinate agents, governed actions, human approval, and operational failure paths in end-to-end builds.',
    },
  };

function sortRecipes(a: RecipeRecord, b: RecipeRecord): number {
  return (
    Number(b.status === 'quickstart') - Number(a.status === 'quickstart') ||
    Number(b.featured) - Number(a.featured) ||
    a.title.localeCompare(b.title)
  );
}

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
 * Cookbook index: preserve the established flagship-and-grid composition while
 * adding capability filters, shareable URL state, and gated preview records.
 */
export default function RecipeIndex({
  recipes,
  capabilities: catalogCapabilities = [],
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

  const visibleRecipes = useMemo(
    () =>
      availableRecipes
        .filter((recipe) => matches(recipe, activeCapability, activeSurface))
        .sort(sortRecipes),
    [availableRecipes, activeCapability, activeSurface],
  );
  const recipesByLevel = useMemo(
    () =>
      Object.fromEntries(
        RECIPE_LEVELS.map((level) => [
          level,
          visibleRecipes.filter((recipe) => recipe.level === level),
        ]),
      ) as Record<Level, RecipeRecord[]>,
    [visibleRecipes],
  );
  const count = visibleRecipes.length;
  const hasActiveFilters =
    activeCapability !== 'all' || activeSurface !== 'all';

  const resetFilters = () => {
    setActiveCapability('all');
    setActiveSurface('all');
    const params = new URLSearchParams(location.search);
    params.delete('capability');
    params.delete('surface');
    history.push({
      pathname: location.pathname,
      search: params.size > 0 ? `?${params.toString()}` : '',
    });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.eyebrow}>Cookbooks</div>
      <h1 className={styles.title}>Recipes for building on Glean</h1>
      <p className={styles.subtitle}>
        Runnable patterns that go from problem to a working demo to scaffolded
        starter code — with the architecture, auth, and permissions laid out for
        each.
      </p>

      {availableRecipes.length === 0 ? (
        <div className={styles.empty}>
          <p>Recipes are coming soon.</p>
        </div>
      ) : (
        <>
          <RecipeShowcaseCarousel recipes={availableRecipes} />

          <div className={styles.filterBar}>
            <div className={styles.filterControls}>
              <div className={styles.filterGroup}>
                <label
                  className={styles.filterLabel}
                  htmlFor="recipe-capability"
                >
                  Capability
                </label>
                <select
                  className={`gdt-select ${
                    activeCapability !== 'all' ? 'gdt-select--active' : ''
                  }`}
                  id="recipe-capability"
                  onChange={(event) =>
                    updateFilter('capability', event.target.value)
                  }
                  value={activeCapability}
                >
                  <option value="all">All capabilities</option>
                  {capabilities.map((capability) => (
                    <option key={capability} value={capability}>
                      {RECIPE_CAPABILITY_LABELS[capability]}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel} htmlFor="recipe-surface">
                  Surface
                </label>
                <select
                  className={`gdt-select ${
                    activeSurface !== 'all' ? 'gdt-select--active' : ''
                  }`}
                  id="recipe-surface"
                  onChange={(event) =>
                    updateFilter('surface', event.target.value)
                  }
                  value={activeSurface}
                >
                  <option value="all">All surfaces</option>
                  {surfaces.map((surface) => (
                    <option key={surface} value={surface}>
                      {RECIPE_SURFACE_LABELS[surface]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.filterMeta}>
              <span aria-live="polite" className={styles.count}>
                {count} recipe{count === 1 ? '' : 's'}
              </span>
              {hasActiveFilters ? (
                <button
                  className={styles.clearButton}
                  onClick={resetFilters}
                  type="button"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>

          {count > 0 ? (
            <div className={styles.sections}>
              {RECIPE_LEVELS.map((level) => {
                const levelRecipes = recipesByLevel[level];
                if (levelRecipes.length === 0) return null;
                const section = LEVEL_SECTIONS[level];
                return (
                  <section className={styles.recipeSection} key={level}>
                    <div className={styles.sectionHeading}>
                      <h2>{section.heading}</h2>
                      <span className={styles.sectionRule} />
                    </div>
                    <p className={styles.sectionDescription}>
                      {section.description}
                    </p>
                    <div className={styles.grid}>
                      {levelRecipes.map((recipe) => (
                        <RecipeCard key={recipe.id} recipe={recipe} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : null}

          {count === 0 ? (
            <div className={styles.empty}>
              <p>No recipes match both selected filters.</p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
