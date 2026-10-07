import path from 'node:path';

import type { LoadContext, Plugin } from '@docusaurus/types';
import type { Plugin as PostCssPlugin } from 'postcss';

/**
 * Widest viewport, in CSS px, that gets the mobile layout: hamburger navbar,
 * no docs sidebar or desktop TOC, and the API explorer stacked under the
 * endpoint docs. Wider viewports get the desktop layout.
 *
 * Docusaurus hardcodes 996px (https://github.com/facebook/docusaurus/issues/9603).
 * That shows three cramped columns (sidebar, docs, API explorer) on viewports
 * from 997px to ~1280px, for example a 1080px-wide portrait monitor.
 */
export const DESKTOP_BREAKPOINT = 1279;

/** Docusaurus and Infima default: mobile at ≤ 996px, desktop at ≥ 997px. */
const DOCUSAURUS_DESKTOP_BREAKPOINT = 996;

const BREAKPOINT_MEDIA_FEATURE = /\b(min|max)-width:\s*(996|997)px/g;

const USE_WINDOW_SIZE_HOOK =
  /[\\/]@docusaurus[\\/]theme-common[\\/]lib[\\/]hooks[\\/]useWindowSize\.js$/;

/**
 * Moves the Docusaurus breakpoint in one `@media` query to `breakpoint`.
 * 996px becomes `breakpoint` and 997px becomes `breakpoint + 1`. This keeps
 * the original min/max offset.
 */
export function remapBreakpointMediaQuery(
  params: string,
  breakpoint: number,
): string {
  return params.replace(
    BREAKPOINT_MEDIA_FEATURE,
    (_match, bound: string, px: string) =>
      `${bound}-width: ${breakpoint + Number(px) - DOCUSAURUS_DESKTOP_BREAKPOINT}px`,
  );
}

/**
 * PostCSS plugin that remaps the Docusaurus breakpoint in the files that
 * `appliesTo` accepts.
 */
export function desktopBreakpointPostCss({
  breakpoint,
  appliesTo,
}: {
  breakpoint: number;
  appliesTo: (file: string) => boolean;
}): PostCssPlugin {
  return {
    postcssPlugin: 'desktop-breakpoint',
    OnceExit(root, { result }) {
      const file = result.opts.from;
      if (!file || !appliesTo(file)) {
        return;
      }
      root.walkAtRules('media', (atRule) => {
        atRule.params = remapBreakpointMediaQuery(atRule.params, breakpoint);
      });
    },
  };
}

/**
 * Theme CSS follows the Docusaurus breakpoint: dependencies (Infima,
 * theme-classic, the OpenAPI theme) and swizzled components in src/theme.
 * Site components keep their own 996px queries. Those queries collapse
 * content grids, not the layout.
 */
export function isThemeCss(file: string, siteDir: string): boolean {
  return (
    /[\\/]node_modules[\\/]/.test(file) ||
    file.startsWith(path.join(siteDir, 'src', 'theme') + path.sep)
  );
}

export default function desktopBreakpointPlugin(context: LoadContext): Plugin {
  return {
    name: 'desktop-breakpoint',
    configureWebpack() {
      return {
        module: {
          rules: [
            {
              test: USE_WINDOW_SIZE_HOOK,
              enforce: 'pre',
              use: [
                {
                  loader: path.join(__dirname, 'useWindowSizeLoader.cjs'),
                  options: { desktopBreakpoint: DESKTOP_BREAKPOINT },
                },
              ],
            },
          ],
        },
      };
    },
    configurePostCss(options) {
      options.plugins.push(
        desktopBreakpointPostCss({
          breakpoint: DESKTOP_BREAKPOINT,
          appliesTo: (file) => isThemeCss(file, context.siteDir),
        }),
      );
      return options;
    },
  };
}
