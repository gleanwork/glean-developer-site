const STROKED_SHAPE =
  /<(path|circle|rect|ellipse|line|polyline|polygon)\b(?=[^>]*stroke=)(?![^>]*fill=)([^>]*?)(\/?)>/g;
const UNSTYLED_PATH = /<path(?![^>]*stroke=)(?![^>]*fill=)([^>]*?)(\/?)>/g;

/**
 * Recolors a Glean icon SVG to `currentColor` so it matches its surroundings,
 * and removes the fixed size so it scales to its container.
 *
 * Replacing the root `fill` would otherwise fill every stroke-only shape
 * solid, so those get `fill="none"` to keep their outline design. The new
 * attribute goes before a self-closing `/`, where the browser still reads it.
 */
export function recolorSvg(svg: string): string {
  return svg
    .replace(/fill="[^"]*"/g, 'fill="currentColor"')
    .replace(/stroke="[^"]*"/g, 'stroke="currentColor"')
    .replace(/<svg([^>]*)\s+width="[^"]*"/, '<svg$1')
    .replace(/<svg([^>]*)\s+height="[^"]*"/, '<svg$1')
    .replace(/<svg/, '<svg style="width: 100%; height: 100%"')
    .replace(STROKED_SHAPE, '<$1$2 fill="none"$3>')
    .replace(UNSTYLED_PATH, '<path$1 fill="currentColor"$2>');
}
