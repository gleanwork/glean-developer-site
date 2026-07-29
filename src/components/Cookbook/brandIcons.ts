/**
 * Recipe icons that render from a static SVG file rather than the Glean
 * icon manifest (`GLEAN_ICON_MAP`, auto-generated — a third-party brand mark
 * has no entry there). Two rendering modes:
 *
 * - `adaptive: true` (default): the SVG is fetched and inlined
 *   (`dangerouslySetInnerHTML`) with `fill="currentColor"`, so it recolors
 *   to match the tile's category color exactly like any other Glean glyph.
 *   Use this for flat, single-color marks (the source file should already
 *   declare `fill="currentColor"` on its paths).
 * - `adaptive: false`: rendered via a plain `<img>` instead, preserving the
 *   source file's own colors exactly. `getIcon(..., 'glean', ...)` force-
 *   recolors every SVG it fetches to `currentColor` — fine for flat marks,
 *   but it would corrupt a gradient/mask-based logo like Lovable's, so
 *   those must stay on this path (same approach as `McpHostIcon`'s
 *   `imgSrc` fallback for hosts without a packaged icon).
 */
export interface BrandIconEntry {
  src: string;
  adaptive?: boolean;
}

export const BRAND_ICON_SRC: Record<string, BrandIconEntry> = {
  lovable: { src: '/img/cookbook/lovable.svg', adaptive: false },
  a2a: { src: '/img/cookbook/a2a.svg', adaptive: true },
};
