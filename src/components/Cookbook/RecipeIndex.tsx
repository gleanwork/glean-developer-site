import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from '@docusaurus/router';
import useBrokenLinks from '@docusaurus/useBrokenLinks';
import {
  RECIPE_CAPABILITY_LABELS,
  RECIPE_LEVELS,
  RECIPE_SURFACE_LABELS,
  type RecipeCapability,
  type RecipeCollection,
  type RecipeRecord,
  type RecipeSurface,
} from '../../types/recipe';
import RecipeShowcaseCarousel from './RecipeShowcaseCarousel';
import RecipeCard from './RecipeCard';
import { isRecipeAvailable } from './recipePreview';
import { usePreviewContent } from '../../lib/usePreviewContent';
import styles from './RecipeIndex.module.css';
import Link from '@docusaurus/Link';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import { galleryVideos } from '../Videos/videoData';

const hasPublicVideos = galleryVideos(false).length > 0;

interface RecipeIndexProps {
  recipes: RecipeRecord[];
  /** Collections in display order, each listing recipe ids in path order. */
  collections: readonly RecipeCollection[];
  /** Capability slugs present in the compiled data (from recipes.json). */
  capabilities: readonly RecipeCapability[];
  /** Surface slugs present in the compiled data (from recipes.json). */
  surfaces: readonly RecipeSurface[];
}

type Filter = string | 'all';

type Level = (typeof RECIPE_LEVELS)[number];

/** "Beginner → Advanced" for a collection's path, or one level if it has one. */
function levelRange(recipes: readonly RecipeRecord[]): string {
  const levels = RECIPE_LEVELS.filter((level: Level) =>
    recipes.some((recipe) => recipe.level === level),
  );
  return levels.length > 1
    ? `${levels[0]} → ${levels[levels.length - 1]}`
    : (levels[0] ?? '');
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
  collections,
  capabilities: catalogCapabilities = [],
  surfaces: catalogSurfaces,
}: RecipeIndexProps): React.ReactElement {
  const history = useHistory();
  const location = useLocation();
  const brokenLinks = useBrokenLinks();

  const previewsEnabled = usePreviewContent();
  const availableRecipes = useMemo(
    () =>
      recipes.filter((recipe) => isRecipeAvailable(recipe, previewsEnabled)),
    [recipes, previewsEnabled],
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
      availableRecipes.filter((recipe) =>
        matches(recipe, activeCapability, activeSurface),
      ),
    [availableRecipes, activeCapability, activeSurface],
  );
  // Each collection keeps its authored order. Positions count every available
  // recipe in the path, so a filtered view still says "3 of 3", not "1 of 1".
  const collectionSections = useMemo(() => {
    const available = new Map(
      availableRecipes.map((recipe) => [recipe.id, recipe]),
    );
    const visible = new Set(visibleRecipes.map((recipe) => recipe.id));
    return collections
      .map((collection) => {
        const path = collection.recipes
          .map((id) => available.get(id))
          .filter((recipe): recipe is RecipeRecord => Boolean(recipe));
        return {
          collection,
          path,
          shown: path
            .map((recipe, index) => ({ recipe, index: index + 1 }))
            .filter(({ recipe }) => visible.has(recipe.id)),
        };
      })
      .filter(({ shown }) => shown.length > 0);
  }, [collections, availableRecipes, visibleRecipes]);
  // Section ids are link targets (`/cookbook#agents`) from recipe pages and
  // guides. Register them so the build's broken-anchor check can see them.
  for (const { collection } of collectionSections) {
    brokenLinks.collectAnchor(collection.id);
  }
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
      {hasPublicVideos ? (
        <Link className={styles.videoLink} to="/videos">
          {getIcon('PlayCircle', 'feather', {
            width: 15,
            height: 15,
            color: 'currentColor',
          })}
          Prefer to watch? Short video walkthroughs
          {getIcon('ArrowRight', 'feather', {
            width: 14,
            height: 14,
            color: 'currentColor',
          })}
        </Link>
      ) : null}

      {availableRecipes.length === 0 ? (
        <div className={styles.empty}>
          <p>Recipes are coming soon.</p>
        </div>
      ) : (
        <>
          <RecipeShowcaseCarousel
            collections={collections}
            recipes={availableRecipes}
          />

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
              {collectionSections.map(({ collection, path, shown }) => (
                <section
                  aria-labelledby={`collection-${collection.id}`}
                  className={styles.recipeSection}
                  id={collection.id}
                  key={collection.id}
                >
                  <div className={styles.sectionHeading}>
                    <h2 id={`collection-${collection.id}`}>
                      {collection.label}
                    </h2>
                    <span className={styles.sectionRule} />
                    <span className={styles.sectionMeta}>
                      {path.length} recipe{path.length === 1 ? '' : 's'} ·{' '}
                      {levelRange(path)}
                    </span>
                  </div>
                  <p className={styles.sectionDescription}>
                    {collection.description}
                  </p>
                  <div className={styles.grid}>
                    {shown.map(({ recipe, index }) => (
                      <RecipeCard
                        key={recipe.id}
                        position={{ index, total: path.length }}
                        recipe={recipe}
                      />
                    ))}
                  </div>
                </section>
              ))}
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
