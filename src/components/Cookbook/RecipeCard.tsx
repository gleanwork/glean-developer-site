import type React from 'react';
import Link from '@docusaurus/Link';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import { RECIPE_SURFACE_LABELS, type RecipeRecord } from '../../types/recipe';
import { CategoryTile } from './categories';
import { renderInlineCode } from './inlineCode';
import { recipeHref } from './recipePreview';
import styles from './RecipeCard.module.css';

interface RecipeCardProps {
  recipe: RecipeRecord;
}

/**
 * Recipe card per design handoff direction 4a: pastel category tile,
 * 18px title, 13.5px summary, footer row with time · level and up to two
 * surface chips.
 */
export default function RecipeCard({
  recipe,
}: RecipeCardProps): React.ReactElement {
  return (
    <Link className={styles.card} to={recipeHref(recipe)}>
      <div className={styles.tileRow}>
        <CategoryTile category={recipe.category} iconOverride={recipe.icon} />
      </div>
      <span className={styles.title}>{recipe.title}</span>
      <p className={styles.summary}>{renderInlineCode(recipe.description)}</p>
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
