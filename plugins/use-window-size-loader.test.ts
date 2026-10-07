import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { rewriteUseWindowSize } = require('./use-window-size-loader.cjs') as {
  rewriteUseWindowSize: (source: string, desktopBreakpoint: number) => string;
};

// The webpack-config plugin in docusaurus.config.ts matches this exact path.
// If a Docusaurus upgrade moves or renames the hook, the loader stops
// running without an error. This test catches that.
const installedHook = path.resolve(
  import.meta.dirname,
  '..',
  'node_modules/@docusaurus/theme-common/lib/hooks/useWindowSize.js',
);

describe('use-window-size-loader', () => {
  it('rewrites the installed Docusaurus hook', () => {
    const source = fs.readFileSync(installedHook, 'utf8');
    expect(rewriteUseWindowSize(source, 1280)).toContain(
      'const DesktopBreakpoint = 1280;',
    );
  });

  it('rejects a hook without the expected breakpoint', () => {
    expect(() =>
      rewriteUseWindowSize('const DesktopBreakpoint = 1024;', 1280),
    ).toThrow(/Docusaurus changed how it defines the breakpoint/);
  });
});
