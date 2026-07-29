import type React from 'react';
import { useEffect, useState } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import { BRAND_ICON_SRC } from './brandIcons';
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

/**
 * Fetches and inlines a static SVG (`dangerouslySetInnerHTML`), same
 * technique as `GleanIcon` — the only way an SVG's `fill="currentColor"`
 * can pick up the surrounding tile's color; a plain `<img src>` renders the
 * file in an isolated context that never inherits page CSS.
 */
function AdaptiveBrandIcon({
  src,
  width,
  height,
}: {
  src: string;
  width: number;
  height: number;
}): React.ReactElement {
  const url = useBaseUrl(src);
  const [svgContent, setSvgContent] = useState('');

  useEffect(() => {
    fetch(url)
      .then((response) => response.text())
      .then((text) =>
        setSvgContent(
          text.replace(/<svg/, '<svg style="width: 100%; height: 100%"'),
        ),
      )
      .catch((error) => {
        console.error(`Failed to load brand icon: ${src}`, error);
      });
  }, [url, src]);

  if (!svgContent) return <div style={{ width, height }} />;

  return (
    <div
      style={{
        width,
        height,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

interface CategoryTileProps {
  category: string;
  /** Explicit per-recipe icon override — a brand key (BRAND_ICON_SRC), a
   * glean-icon-manifest name, or unset to fall back to the category glyph. */
  iconOverride?: string;
  /** Tile square size in px (44 on index cards, 52 on the detail banner). */
  size?: number;
  iconSize?: number;
}

export function CategoryTile({
  category,
  iconOverride,
  size = 44,
  iconSize = 21,
}: CategoryTileProps): React.ReactElement {
  const brandIcon = iconOverride ? BRAND_ICON_SRC[iconOverride] : undefined;
  const brandUrl = useBaseUrl(
    brandIcon?.adaptive === false ? brandIcon.src : '',
  );

  let content: React.ReactNode;
  if (brandIcon?.adaptive === false) {
    content = (
      <img
        src={brandUrl}
        alt=""
        width={iconSize}
        height={iconSize}
        style={{ objectFit: 'contain' }}
      />
    );
  } else if (brandIcon) {
    content = (
      <AdaptiveBrandIcon
        src={brandIcon.src}
        width={iconSize}
        height={iconSize}
      />
    );
  } else {
    content = getIcon(
      iconOverride ?? CATEGORY_ICONS[category] ?? 'glean-app',
      'glean',
      {
        width: iconSize,
        height: iconSize,
        color: 'currentColor',
      },
    );
  }

  return (
    <span
      className={categoryTileClass(category)}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.27),
      }}
    >
      {content}
    </span>
  );
}
