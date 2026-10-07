import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

import {
  DESKTOP_BREAKPOINT,
  desktopBreakpointPostCss,
  isThemeCss,
  remapBreakpointMediaQuery,
} from './index';

const require = createRequire(import.meta.url);
const { rewriteUseWindowSize } = require('./useWindowSizeLoader.cjs') as {
  rewriteUseWindowSize: (source: string, desktopBreakpoint: number) => string;
};

const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const nodeModules = path.join(repoRoot, 'node_modules');
const themeClassicDir = fs.realpathSync(
  path.join(nodeModules, '@docusaurus/theme-classic'),
);
// Infima is a theme-classic dependency, so pnpm does not hoist it.
const infimaCss = createRequire(
  path.join(themeClassicDir, 'package.json'),
).resolve('infima/dist/css/default/default.css');

function listFiles(dir: string, pattern: RegExp): string[] {
  return fs
    .readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((file) => pattern.test(file))
    .map((file) => path.join(dir, file));
}

describe('remapBreakpointMediaQuery', () => {
  it('moves the Docusaurus mobile and desktop bounds', () => {
    expect(remapBreakpointMediaQuery('(max-width: 996px)', 1279)).toBe(
      '(max-width: 1279px)',
    );
    expect(remapBreakpointMediaQuery('(min-width: 997px)', 1279)).toBe(
      '(min-width: 1280px)',
    );
    expect(remapBreakpointMediaQuery('(max-width: 997px)', 1279)).toBe(
      '(max-width: 1280px)',
    );
  });

  it('only rewrites the breakpoint feature in compound queries', () => {
    expect(
      remapBreakpointMediaQuery(
        'only screen and (min-width: 768px) and (max-width:996px)',
        1279,
      ),
    ).toBe('only screen and (min-width: 768px) and (max-width: 1279px)');
  });

  it('leaves other widths alone', () => {
    for (const query of [
      '(max-width: 576px)',
      '(min-width: 1440px)',
      '(max-width: 9960px)',
      'print',
    ]) {
      expect(remapBreakpointMediaQuery(query, 1279)).toBe(query);
    }
  });
});

describe('desktopBreakpointPostCss', () => {
  const css = '@media (max-width: 996px) { .a { display: none; } }';
  const plugin = desktopBreakpointPostCss({
    breakpoint: 1279,
    appliesTo: (file) => isThemeCss(file, repoRoot),
  });

  it('rewrites theme CSS', async () => {
    for (const from of [
      infimaCss,
      path.join(repoRoot, 'src/theme/DocSidebarItem/Html/styles.module.css'),
    ]) {
      const result = await postcss([plugin]).process(css, { from });
      expect(result.css).toContain('(max-width: 1279px)');
    }
  });

  it('leaves site component CSS alone', async () => {
    const from = path.join(repoRoot, 'src/components/home/Home.module.css');
    const result = await postcss([plugin]).process(css, { from });
    expect(result.css).toBe(css);
  });
});

describe('installed Docusaurus theme', () => {
  it('keeps the hardcoded hook breakpoint that the loader rewrites', () => {
    const hook = fs.readFileSync(
      path.join(
        nodeModules,
        '@docusaurus/theme-common/lib/hooks/useWindowSize.js',
      ),
      'utf8',
    );
    expect(rewriteUseWindowSize(hook, DESKTOP_BREAKPOINT)).toContain(
      `const DesktopBreakpoint = ${DESKTOP_BREAKPOINT};`,
    );
  });

  it('rejects a hook without the expected breakpoint', () => {
    expect(() =>
      rewriteUseWindowSize('const DesktopBreakpoint = 1024;', 1279),
    ).toThrow(/Docusaurus changed how it defines the breakpoint/);
  });

  it('expresses every theme breakpoint in a form the remap handles', () => {
    const files = [
      infimaCss,
      ...listFiles(path.join(themeClassicDir, 'lib'), /\.css$/),
      ...listFiles(
        path.join(nodeModules, 'docusaurus-theme-openapi-docs/lib/theme'),
        /\.s?css$/,
      ),
    ];
    const leftovers = files.flatMap((file) =>
      fs
        .readFileSync(file, 'utf8')
        .split('\n')
        .filter((line) => line.trimStart().startsWith('@media'))
        .map((line) => remapBreakpointMediaQuery(line, DESKTOP_BREAKPOINT))
        .filter((line) => /\b99[67]px\b/.test(line))
        .map((line) => `${path.basename(file)}: ${line.trim()}`),
    );
    expect(leftovers).toEqual([]);
  });
});
