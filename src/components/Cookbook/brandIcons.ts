/**
 * Recipe icons that must render as the real third-party brand mark, not a
 * monochrome Glean glyph. `getIcon(..., 'glean', ...)` force-recolors every
 * SVG it fetches to `currentColor` (see `GleanIcon` in
 * `packages/docusaurus-theme-glean/src/theme/Icons/index.tsx`) — fine for
 * flat single-color marks, but it corrupts gradient/mask-based logos like
 * Lovable's. Icons listed here are rendered via a plain `<img>` instead,
 * preserving the source file exactly (same approach as `McpHostIcon`'s
 * `imgSrc` fallback for hosts without a packaged icon).
 */
export const BRAND_ICON_SRC: Record<string, string> = {
  lovable: '/img/cookbook/lovable.svg',
};
