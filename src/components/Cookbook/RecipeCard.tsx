import type React from 'react';
import Link from '@docusaurus/Link';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import { RECIPE_SURFACE_LABELS, type RecipeRecord } from '../../types/recipe';
import { formatDuration, videoForRecipe } from '../Videos/videoData';
import { CategoryTile } from './categories';
import { renderInlineMarkup } from './inlineMarkup';
import styles from './RecipeCard.module.css';

interface RecipeCardProps {
  recipe: RecipeRecord;
  /** Where the recipe sits in its collection's path, e.g. 2 of 3. */
  position?: { index: number; total: number };
}

/**
 * Recipe card per design handoff direction 4a: pastel category tile,
 * 18px title, 13.5px summary, footer row with time · level and up to two
 * surface chips.
 */
export default function RecipeCard({
  recipe,
  position,
}: RecipeCardProps): React.ReactElement {
  const video = videoForRecipe(recipe.id);
  const hasVideo = video?.visibility === 'public';
  return (
    <Link className={styles.card} to={recipe.permalink}>
      <div className={styles.tileRow}>
        <CategoryTile category={recipe.category} iconOverride={recipe.icon} />
        {position ? (
          <span className={styles.position}>
            {position.index} of {position.total}
          </span>
        ) : null}
      </div>
      <span className={styles.title}>{recipe.title}</span>
      <p className={styles.summary}>{renderInlineMarkup(recipe.description)}</p>
      <div className={styles.footer}>
        <span className={styles.metaItem}>
          {getIcon('Clock', 'feather', {
            width: 14,
            height: 14,
            color: 'currentColor',
          })}
          {recipe.timeEstimate.replace(/\s*\(.*\)$/, '')}
        </span>
        <span className={styles.dot}>·</span>
        <span>{recipe.level}</span>
        {hasVideo && video ? (
          <>
            <span className={styles.dot}>·</span>
            <span
              className={styles.metaItem}
              title={`Includes a ${formatDuration(video.durationSeconds)} walkthrough video`}
            >
              {getIcon('PlayCircle', 'feather', {
                width: 14,
                height: 14,
                color: 'currentColor',
              })}
              <span className={styles.srOnly}>Video, </span>
              {formatDuration(video.durationSeconds)}
            </span>
          </>
        ) : null}
        <span className={styles.chips}>
          {recipe.surfaces.slice(0, 2).map((surface) => (
            <span className={styles.chip} key={surface}>
              {RECIPE_SURFACE_LABELS[surface]}
            </span>
          ))}
        </span>
      </div>
    </Link>
  );
}
