import type React from 'react';
import Link from '@docusaurus/Link';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import type { RecipeRecord } from '../../types/recipe';
import styles from './FlagshipCard.module.css';
import catStyles from './categories.module.css';

interface FlagshipCardProps {
  recipe: RecipeRecord;
}

/**
 * Flagship hero card per design handoff 4a: full-width, blue 1.5px border,
 * light gradient, "Combines N recipes" mini-list on the right built from the
 * recipe's `combines` frontmatter.
 */
export default function FlagshipCard({
  recipe,
}: FlagshipCardProps): React.ReactElement {
  const combines = recipe.combines ?? [];

  return (
    <Link className={styles.card} to={recipe.permalink}>
      <div>
        <div className={styles.pill}>End-to-end build</div>
        <h2 className={styles.title}>{recipe.title}</h2>
        <p className={styles.body}>{recipe.summary}</p>
        <span className={styles.cta}>
          Open the build guide
          {getIcon('ArrowRight', 'feather', {
            width: 17,
            height: 17,
            color: 'currentColor',
          })}
        </span>
      </div>
      {combines.length > 0 ? (
        <div className={styles.combines}>
          <div className={styles.combinesLabel}>
            Combines {combines.length === 3 ? 'three' : combines.length} recipes
          </div>
          {combines.map((item, i) => (
            <div className={styles.combineRow} key={item.title}>
              <span
                className={`${styles.combineNum} ${catStyles[`tile_${item.category}`]}`}
              >
                {i + 1}
              </span>
              <div>
                <div className={styles.combineTitle}>{item.title}</div>
                <div className={styles.combineSurface}>{item.surface}</div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
