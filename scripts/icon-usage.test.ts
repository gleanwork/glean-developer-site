import fs from 'node:fs';
import path from 'node:path';
import * as FeatherIcons from 'react-feather';
import { describe, expect, it } from 'vitest';
import { GLEAN_ICON_MAP } from '../packages/docusaurus-theme-glean/src/theme/Icons/glean-icon-manifest';

function collectMdxFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory()
      ? collectMdxFiles(entryPath)
      : entry.name.endsWith('.mdx')
        ? [entryPath]
        : [];
  });
}

describe('MDX card icons', () => {
  it('only uses icons that exist in the selected icon set', () => {
    const invalid: string[] = [];

    for (const file of collectMdxFiles(path.join(process.cwd(), 'docs'))) {
      const source = fs.readFileSync(file, 'utf8');
      for (const match of source.matchAll(/<Card\b[\s\S]*?>/g)) {
        const tag = match[0];
        const icon = tag.match(/\bicon="([^"]+)"/)?.[1];
        if (!icon) continue;

        const iconSet = tag.match(/\biconSet="([^"]+)"/)?.[1] ?? 'feather';
        const exists =
          iconSet === 'glean'
            ? icon in GLEAN_ICON_MAP
            : iconSet === 'feather' && icon in FeatherIcons;
        if (!exists) {
          const line = source.slice(0, match.index).split('\n').length;
          invalid.push(
            `${path.relative(process.cwd(), file)}:${line} ${iconSet}/${icon}`,
          );
        }
      }
    }

    expect(invalid).toEqual([]);
  });

  it('uses canonical Glean icons for API-family cards', () => {
    const canonical: Record<string, string> = {
      'Platform API': 'platform',
      'Client API': 'layout-outlined',
      'Indexing API': 'sources',
    };
    const usages = new Map<string, number>();
    const mismatches: string[] = [];

    for (const file of collectMdxFiles(path.join(process.cwd(), 'docs'))) {
      const source = fs.readFileSync(file, 'utf8');
      for (const match of source.matchAll(/<Card\b[\s\S]*?>/g)) {
        const tag = match[0];
        const title = tag.match(/\btitle="([^"]+)"/)?.[1];
        if (!title || !(title in canonical)) continue;

        const icon = tag.match(/\bicon="([^"]+)"/)?.[1];
        const iconSet = tag.match(/\biconSet="([^"]+)"/)?.[1] ?? 'feather';
        usages.set(title, (usages.get(title) ?? 0) + 1);
        if (iconSet !== 'glean' || icon !== canonical[title]) {
          const line = source.slice(0, match.index).split('\n').length;
          mismatches.push(
            `${path.relative(process.cwd(), file)}:${line} ${title} uses ${iconSet}/${icon}`,
          );
        }
      }
    }

    expect(mismatches).toEqual([]);
    expect([...usages.keys()].sort()).toEqual(Object.keys(canonical).sort());
  });
});
