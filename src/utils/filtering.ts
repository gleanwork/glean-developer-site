import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

export function filterByFeatureFlags(
  originalSidebar: SidebarsConfig,
  flags: Record<string, boolean>,
): SidebarsConfig {
  const clone = JSON.parse(JSON.stringify(originalSidebar));
  function include(item: any): boolean {
    if (item && item.customProps && typeof item.customProps.flag === 'string') {
      const flag = item.customProps.flag as string;
      return !!flags[flag];
    }
    return true;
  }
  function visit(items: any[]): any[] {
    return items.filter(include).map((it) => {
      if (it.items && Array.isArray(it.items)) {
        return { ...it, items: visit(it.items) };
      }
      return it;
    });
  }
  for (const key of Object.keys(clone)) {
    clone[key] = visit(clone[key] as any[]);
  }
  return clone;
}

export function getNavbarItems(
  items: any[],
  flags: Record<string, boolean>,
): any[] {
  return items
    .filter((it) => {
      if (it && typeof it.flag === 'string') return !!flags[it.flag];
      return true;
    })
    .map((it) => {
      if (it.items) return { ...it, items: getNavbarItems(it.items, flags) };
      return it;
    });
}

export function filterVersionsByFlags(
  allVersions: string[],
  flags: Record<string, boolean>,
): string[] {
  return allVersions.filter((v) => flags[`version-${v}`] !== false);
}

export function getFlaggedContentPaths(
  flags: Record<string, boolean>,
): string[] {
  const paths: string[] = [];
  for (const [key, val] of Object.entries(flags)) {
    if (!val && key.startsWith('doc-')) paths.push(key.slice(4));
  }
  return paths;
}
