/**
 * Recipe icons that render from a static SVG file rather than the Glean
 * icon manifest (`GLEAN_ICON_MAP`, auto-generated — a third-party brand mark
 * has no entry there). Two rendering modes:
 *
 * - `adaptive: true` (default): the SVG is fetched and inlined
 *   (`dangerouslySetInnerHTML`) with `fill="currentColor"`, so it recolors
 *   to match the tile's color exactly like any other Glean glyph. Use this
 *   for flat, single-color marks (the source file should already declare
 *   `fill="currentColor"` on its paths). Checked directly against the real
 *   render size (21-26px): a flat single-hue mark has no internal
 *   luminance variation to fall back on, so it only reads cleanly against
 *   a genuinely high-contrast background — a low-contrast pastel category
 *   tile (e.g. the "agent" category's dark-gold-on-pale-yellow) turns it to
 *   mud regardless of which single hue it's recolored to. Set `tileBg` /
 *   `tileFg` to override the tile's own background/foreground with a
 *   higher-contrast pair instead of inheriting the category's pastel
 *   scheme — matching how the mark's own source (a2a-protocol.org) renders
 *   it at this exact size: white on solid brand blue, not blended into a
 *   pastel tile.
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
   * category's pastel scheme — see `adaptive` above for why. */
  tileBg?: string;
  tileFg?: string;
}

export const BRAND_ICON_SRC: Record<string, BrandIconEntry> = {
  lovable: { src: '/img/cookbook/lovable.svg', adaptive: false },
  a2a: {
    src: '/img/cookbook/a2a.svg',
    adaptive: true,
    tileBg: '#2874d7',
    tileFg: '#ffffff',
  },
};
