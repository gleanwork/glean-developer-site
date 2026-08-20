/**
 * Recipe icons that render from a static SVG file rather than the Glean
 * icon manifest (`GLEAN_ICON_MAP`, auto-generated — a third-party brand mark
 * has no entry there). Two rendering modes:
 *
 * - `adaptive: true` (default): the SVG is fetched and inlined
 *   (`dangerouslySetInnerHTML`) with `fill="currentColor"`, so it recolors
 *   to match the tile's color exactly like any other Glean glyph. Use this
 *   only for a flat, single-color mark that's *simple* enough to survive
 *   21-26px anti-aliasing (the tile's real render size) — checked directly
 *   by testing the same source artwork at 90px vs 400px: fine geometry
 *   (e.g. a letterform's counter/hole) can be genuinely present in the file
 *   and still disappear under anti-aliasing at tile size, on any background,
 *   in any color. That's a hard resolution floor, not a contrast problem —
 *   `tileBg`/`tileFg` (below) fixes contrast, not detail. Before adding an
 *   entry here, render the actual candidate file at ~24px and crop-zoom the
 *   *screenshot* (not a live-rendered preview at a different size) to
 *   confirm it survives — don't assume detail that reads fine at preview
 *   size will read fine at tile size.
 * - `adaptive: false`: rendered via a plain `<img>` instead, preserving the
 *   source file's own colors exactly. `getIcon(..., 'glean', ...)` force-
 *   recolors every SVG it fetches to `currentColor` — fine for flat marks,
 *   but it would corrupt a gradient/mask-based logo like Lovable's, so
 *   those must stay on this path (same approach as `McpHostIcon`'s
 *   `imgSrc` fallback for hosts without a packaged icon). Gradients also
 *   carry their own internal contrast, so they don't need a `tileBg`
 *   override to read at small size.
 */
export interface BrandIconEntry {
  src: string;
  adaptive?: boolean;
  /** Overrides the tile's background/foreground instead of inheriting the
   * category's pastel scheme — fixes low contrast, not insufficient detail
   * (see `adaptive` above). */
  tileBg?: string;
  tileFg?: string;
}

export const BRAND_ICON_SRC: Record<string, BrandIconEntry> = {
  lovable: { src: '/img/cookbook/lovable.svg', adaptive: false },
  cursor: { src: '/img/cookbook/cursor.svg', adaptive: false },
  github: { src: '/img/cookbook/github.svg', adaptive: false },
  n8n: { src: '/img/cookbook/n8n.svg', adaptive: false },
  gmail: { src: '/img/cookbook/gmail.svg', adaptive: false },
  gong: { src: '/img/cookbook/gong.svg', adaptive: false },
  'google-calendar': {
    src: '/img/cookbook/google-calendar.svg',
    adaptive: false,
  },
  'glean-trigger': { src: '/img/cookbook/glean-trigger.svg', adaptive: false },
};
