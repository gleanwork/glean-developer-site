/**
 * Bundler loader for @docusaurus/theme-common's `useWindowSize` hook. It
 * replaces the hardcoded desktop breakpoint with the site's value. Every
 * component that switches between the desktop and mobile layout in JS reads
 * this constant (docs sidebar, navbar mobile sidebar, desktop TOC).
 *
 * This is CommonJS so the bundler can load it without a TypeScript step.
 * See ./index.ts for the matching CSS change.
 */
const HARDCODED_BREAKPOINT = 'const DesktopBreakpoint = 996;';

function rewriteUseWindowSize(source, desktopBreakpoint) {
  if (!Number.isInteger(desktopBreakpoint)) {
    throw new Error(
      `[desktop-breakpoint] desktopBreakpoint must be an integer, got ${desktopBreakpoint}`,
    );
  }
  if (!source.includes(HARDCODED_BREAKPOINT)) {
    throw new Error(
      `[desktop-breakpoint] Expected "${HARDCODED_BREAKPOINT}" in ` +
        "@docusaurus/theme-common's useWindowSize hook. Docusaurus changed " +
        'how it defines the breakpoint; update plugins/desktop-breakpoint.',
    );
  }
  return source.replace(
    HARDCODED_BREAKPOINT,
    `const DesktopBreakpoint = ${desktopBreakpoint};`,
  );
}

module.exports = function useWindowSizeLoader(source) {
  return rewriteUseWindowSize(source, this.getOptions().desktopBreakpoint);
};
module.exports.rewriteUseWindowSize = rewriteUseWindowSize;
