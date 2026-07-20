import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Card from '@theme/Card';
import { GLEAN_BRAND_COLORS } from '@gleanwork/docusaurus-theme-glean/brandColors';
import recipesData from '@site/src/data/recipes.json';
import type { RecipesData } from '../../types/recipe';
import { SURFACE_ICONS } from '../Cookbook/RecipeCard';
import styles from './CookbookSection.module.css';
import homeStyles from './index.module.css';

/**
 * "Build something with Glean" band on the landing page. Renders the
 * `featured` recipes from the compiled schema; renders nothing when no
 * recipe is featured, so the band cannot ship half-empty.
 */
export default function CookbookSection(): React.ReactElement | null {
  const featured = (recipesData as RecipesData).recipes
    .filter((recipe) => recipe.featured)
    .slice(0, 3);

  if (featured.length === 0) {
    return null;
  }

  return (
    <section
      className={clsx('container', homeStyles.wideContainer, 'margin-vert--l')}
    >
      <div className={styles.band}>
        <div className={styles.header}>
          <div>
            <span className={styles.kicker}>Cookbooks</span>
            <h2 className={styles.heading}>Build something with Glean</h2>
            <p className={styles.subheading}>
              Copy-paste recipes that take you from a pattern to a running demo
              to scaffolded starter code — each with exact scopes, runnable
              code, and a prompt your AI assistant can build from.
            </p>
          </div>
          <Link
            className={clsx('button', 'button--primary', styles.cta)}
            to="/cookbook"
          >
            Browse all recipes →
          </Link>
        </div>
        <div className="row">
          {featured.map((recipe) => (
            <div className="col col--4 margin-vert--sm" key={recipe.id}>
              <div className={homeStyles.featureCard}>
                <Card
                  title={recipe.title}
                  icon={SURFACE_ICONS[recipe.surfaces[0]] ?? 'Code'}
                  iconSet="feather"
                  href={recipe.permalink}
                  color={GLEAN_BRAND_COLORS.PRIMARY_BLUE}
                >
                  {recipe.summary}
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
