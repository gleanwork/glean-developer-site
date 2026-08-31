import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import {
  RECIPE_CAPABILITY_LABELS,
  RECIPE_LEVELS,
  RECIPE_STATUS_LABELS,
  RECIPE_SURFACE_LABELS,
  type RecipeRecord,
} from '../../types/recipe';
import { recipeHref } from './recipePreview';
import styles from './RecipeShowcaseCarousel.module.css';

interface RecipeShowcaseCarouselProps {
  recipes: RecipeRecord[];
}

const ROTATION_INTERVAL_MS = 6000;

/**
 * Select one editorially featured recipe per learning level. When preview
 * gating exposes a featured quickstart, it replaces the longer Beginner
 * showcase without changing the public carousel.
 */
export function selectShowcaseRecipes(recipes: RecipeRecord[]): RecipeRecord[] {
  return RECIPE_LEVELS.flatMap((level) => {
    const candidates = recipes
      .filter((recipe) => recipe.featured && recipe.level === level)
      .sort(
        (a, b) =>
          Number(b.status === 'quickstart') -
            Number(a.status === 'quickstart') || a.title.localeCompare(b.title),
      );
    return candidates.slice(0, 1);
  });
}

function previewRows(recipe: RecipeRecord) {
  if (recipe.architecture && recipe.architecture.length > 0) {
    return recipe.architecture.slice(0, 3).map(({ label, caption }) => ({
      label,
      caption,
    }));
  }

  return [
    {
      label: RECIPE_STATUS_LABELS[recipe.status],
      caption: `${recipe.level} · ${recipe.timeEstimate.replace(/\s*\(.*\)$/, '')}`,
    },
    {
      label: 'Capabilities',
      caption: recipe.capabilities
        .map((capability) => RECIPE_CAPABILITY_LABELS[capability])
        .join(' · '),
    },
    {
      label: 'Implementation',
      caption: recipe.surfaces
        .map((surface) => RECIPE_SURFACE_LABELS[surface])
        .join(' · '),
    },
  ];
}

export default function RecipeShowcaseCarousel({
  recipes,
}: RecipeShowcaseCarouselProps): React.ReactElement | null {
  const slides = useMemo(() => selectShowcaseRecipes(recipes), [recipes]);
  const [active, setActive] = useState(0);
  const [autoRotationEnabled, setAutoRotationEnabled] = useState(true);
  const interactionPaused = useRef(false);

  useEffect(() => {
    setActive((current) => Math.min(current, Math.max(slides.length - 1, 0)));
  }, [slides.length]);

  useEffect(() => {
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setAutoRotationEnabled(false);
    }
  }, []);

  useEffect(() => {
    if (slides.length < 2 || !autoRotationEnabled) return undefined;

    const timer = window.setInterval(() => {
      if (!interactionPaused.current) {
        setActive((current) => (current + 1) % slides.length);
      }
    }, ROTATION_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [autoRotationEnabled, slides.length]);

  const goTo = useCallback(
    (index: number) => {
      if (slides.length === 0) return;
      setActive((index + slides.length) % slides.length);
    },
    [slides.length],
  );

  if (slides.length === 0) return null;

  const recipe = slides[active];
  const rows = previewRows(recipe);
  const capabilitySummary = recipe.capabilities
    .slice(0, 3)
    .map((capability) => RECIPE_CAPABILITY_LABELS[capability])
    .join(' · ');
  const surfaceSummary = recipe.surfaces
    .slice(0, 2)
    .map((surface) => RECIPE_SURFACE_LABELS[surface])
    .join(' · ');

  return (
    <section
      aria-label="Featured recipes"
      aria-roledescription="carousel"
      className={styles.carousel}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          interactionPaused.current = false;
        }
      }}
      onFocusCapture={() => {
        interactionPaused.current = true;
      }}
      onMouseEnter={() => {
        interactionPaused.current = true;
      }}
      onMouseLeave={() => {
        interactionPaused.current = false;
      }}
    >
      <div
        aria-label={`${active + 1} of ${slides.length}`}
        aria-roledescription="slide"
        className={styles.slide}
        key={recipe.id}
        role="group"
      >
        <div className={styles.copy}>
          <div className={styles.pill}>
            <span className={styles.pillDot} />
            Featured · {recipe.level}
          </div>
          <h2 className={styles.title}>{recipe.title}</h2>
          <p className={styles.description}>{recipe.description}</p>
          <div className={styles.meta}>
            <span>{recipe.timeEstimate.replace(/\s*\(.*\)$/, '')}</span>
            <span>{capabilitySummary}</span>
            <span>{surfaceSummary}</span>
          </div>
          <Link className={styles.cta} to={recipeHref(recipe)}>
            Open recipe
            {getIcon('ArrowRight', 'feather', {
              width: 17,
              height: 17,
              color: 'currentColor',
            })}
          </Link>
        </div>

        <div className={styles.preview}>
          <div className={styles.previewLabel}>What you’ll build</div>
          {rows.map((row, index) => (
            <div className={styles.previewRow} key={`${row.label}-${index}`}>
              <span className={styles.previewNumber}>{index + 1}</span>
              <div>
                <div className={styles.previewTitle}>{row.label}</div>
                <div className={styles.previewCaption}>{row.caption}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 ? (
        <div className={styles.controls}>
          <span className={styles.controlsNote}>
            Featured across every experience level
          </span>
          <div className={styles.controlButtons}>
            <button
              aria-label={
                autoRotationEnabled
                  ? 'Pause featured recipe rotation'
                  : 'Resume featured recipe rotation'
              }
              className={styles.rotationButton}
              onClick={() => setAutoRotationEnabled((enabled) => !enabled)}
              type="button"
            >
              {autoRotationEnabled ? 'Pause' : 'Resume'}
            </button>
            <button
              aria-label="Previous recipe"
              className={styles.arrow}
              onClick={() => goTo(active - 1)}
              type="button"
            >
              {getIcon('ChevronLeft', 'feather', {
                width: 16,
                height: 16,
                color: 'currentColor',
              })}
            </button>
            {slides.map((slide, index) => (
              <button
                aria-label={`Show ${slide.level} recipe: ${slide.title}`}
                aria-pressed={index === active}
                className={`${styles.dot} ${
                  index === active ? styles.dotActive : ''
                }`}
                key={slide.id}
                onClick={() => goTo(index)}
                type="button"
              />
            ))}
            <button
              aria-label="Next recipe"
              className={styles.arrow}
              onClick={() => goTo(active + 1)}
              type="button"
            >
              {getIcon('ChevronRight', 'feather', {
                width: 16,
                height: 16,
                color: 'currentColor',
              })}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
