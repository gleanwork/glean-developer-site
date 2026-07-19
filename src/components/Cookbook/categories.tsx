import type React from 'react';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import styles from './categories.module.css';

/**
 * Category → pastel tile treatment, per the design handoff
 * (design-references/Cookbook.dc.html, direction 4a/4b).
 *
 * Glyphs come from the Glean icon set (theme Icons, iconSet 'glean') per
 * the handoff's asset note: use Glean-custom glyphs, not generic feather
 * substitutes, for category/product surfaces.
 */
export const CATEGORY_ICONS: Record<string, string> = {
  search: 'deep-research',
  index: 'sources',
  mcp: 'mcp',
  workflow: 'workflow',
  agent: 'agent',
  portal: 'glean-app',
};

export function categoryTileClass(category: string): string {
  return `${styles.tile} ${styles[`tile_${category}`] ?? styles.tile_portal}`;
}

interface CategoryTileProps {
  category: string;
  /** Tile square size in px (44 on index cards, 52 on the detail banner). */
  size?: number;
  iconSize?: number;
}

export function CategoryTile({
  category,
  size = 44,
  iconSize = 21,
}: CategoryTileProps): React.ReactElement {
  return (
    <span
      className={categoryTileClass(category)}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.27),
      }}
    >
      {getIcon(CATEGORY_ICONS[category] ?? 'glean-app', 'glean', {
        width: iconSize,
        height: iconSize,
        color: 'currentColor',
      })}
    </span>
  );
}
