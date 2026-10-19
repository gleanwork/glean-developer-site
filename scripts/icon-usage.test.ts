import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import * as FeatherIcons from 'react-feather';
import { describe, expect, it } from 'vitest';
import { GLEAN_ICON_MAP } from '../packages/docusaurus-theme-glean/src/theme/Icons/glean-icon-manifest';
import { BRAND_ICON_SRC } from '../src/components/Cookbook/brandIcons';
import registry from '../data/cookbook-registry.json';
import sidebars from '../sidebars';

type SidebarNode = {
  type?: string;
  label?: string;
  items?: SidebarNode[];
  customProps?: { icon?: unknown; iconSet?: unknown };
};

function collectSidebarCategories(items: SidebarNode[]): SidebarNode[] {
  return items.flatMap((item) =>
    item.type === 'category'
      ? [item, ...collectSidebarCategories(item.items ?? [])]
      : [],
  );
}

const sidebarCategories = Object.values(sidebars).flatMap((items) =>
  collectSidebarCategories(items as SidebarNode[]),
);

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

describe('Glean icon manifest', () => {
  // GleanIcon inlines whatever the icon URL returns, so a file that is not
  // deployed renders the 404 page inside the sidebar. A file can exist locally
  // and still be missing from git: a global ignore such as `Icon?` matches the
  // `icons` directory on a case-insensitive file system.
  it('points every entry at an SVG that git tracks', () => {
    const tracked = new Set(
      execFileSync('git', ['ls-files', '--', 'static/img/glean'], {
        encoding: 'utf8',
      })
        .split('\n')
        .filter(Boolean),
    );
    const untracked = Object.entries(GLEAN_ICON_MAP)
      .map(([name, entry]) => [name, `static${entry.path}${entry.file}`])
      .filter(([, file]) => !tracked.has(file))
      .map(([name, file]) => `${name}: ${file}`);

    expect(untracked).toEqual([]);
  });
});

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

describe('Cookbook recipe icons', () => {
  // Recipe cards and architecture nodes resolve `icon` as a brand mark, then
  // a Glean icon. Anything else renders an empty tile.
  const resolves = (icon: string) =>
    icon in BRAND_ICON_SRC || icon in GLEAN_ICON_MAP;

  it('gives every recipe card an icon that resolves', () => {
    const invalid = registry
      .filter((recipe) => !recipe.icon || !resolves(recipe.icon))
      .map((recipe) => `${recipe.id}: ${recipe.icon ?? '(missing)'}`);

    expect(invalid).toEqual([]);
  });

  it('only uses architecture node icons that resolve', () => {
    const invalid = registry.flatMap((recipe) =>
      (recipe.architecture ?? [])
        .filter((node) => node.icon && !resolves(node.icon))
        .map((node) => `${recipe.id} "${node.label}": ${node.icon}`),
    );

    expect(invalid).toEqual([]);
  });
});

describe('sidebar icons', () => {
  it('only uses icons that exist in the selected icon set', () => {
    const invalid = sidebarCategories
      .filter(({ customProps }) => customProps?.icon)
      .filter(({ customProps }) => {
        const icon = String(customProps?.icon);
        return (customProps?.iconSet ?? 'feather') === 'glean'
          ? !(icon in GLEAN_ICON_MAP)
          : !(icon in FeatherIcons);
      })
      .map(
        ({ label, customProps }) =>
          `${label}: ${customProps?.iconSet}/${customProps?.icon}`,
      );

    expect(invalid).toEqual([]);
  });

  it('uses the Glean app icon for each product function', () => {
    // Glyph the Glean app shows for the same function, from its navigation
    // and feature UI.
    const canonical: Record<string, string> = {
      Agents: 'agent', // main nav and admin nav: Agents
      Announcements: 'megaphone', // Insights: Announcements
      Answers: 'answer', // Insights: Answers
      Chat: 'message-with-sparkles', // admin nav: Assistant
      Departments: 'building', // Insights: Departments
      Documents: 'file-text', // document glyph across the app
      'IdP Groups': 'users', // groups of people
      Insights: 'insights', // user menu and Insights: Overview
      People: 'users', // main nav: People
      Search: 'search', // main nav: Search
      Skills: 'skill', // admin nav and user menu: Skills
      Triggers: 'zap', // chat: Triggers in this chat
      Usage: 'dollar-sign', // admin nav: Usage
      Users: 'user', // admin nav: User roles
      // OAuth clients is hidden until its API ships. Add it back as
      // 'share-2' (admin nav: Third-party access) with its sidebar family.
    };
    const usages = new Set<string>();
    const mismatches: string[] = [];

    for (const { label, customProps } of sidebarCategories) {
      if (!label || !(label in canonical) || !customProps?.icon) continue;
      usages.add(label);
      if (
        customProps.iconSet !== 'glean' ||
        customProps.icon !== canonical[label]
      ) {
        mismatches.push(
          `${label} uses ${customProps.iconSet}/${customProps.icon}, expected glean/${canonical[label]}`,
        );
      }
    }

    expect(mismatches).toEqual([]);
    expect([...usages].sort()).toEqual(Object.keys(canonical).sort());
  });
});
