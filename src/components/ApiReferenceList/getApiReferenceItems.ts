import type {
  PropSidebarItem,
  PropSidebarItemCategory,
} from '@docusaurus/plugin-content-docs';

export type ApiReferenceItem = PropSidebarItemCategory & {
  endpointCount: number;
};

function findCategory(
  items: PropSidebarItem[],
  label: string,
): PropSidebarItemCategory | undefined {
  for (const item of items) {
    if (item.type === 'category') {
      if (item.label === label) {
        return item;
      }

      const nestedCategory = findCategory(item.items, label);
      if (nestedCategory) {
        return nestedCategory;
      }
    }
  }

  return undefined;
}

function countEndpoints(items: PropSidebarItem[]): number {
  return items.reduce((count, item) => {
    if (item.type === 'category') {
      return count + countEndpoints(item.items);
    }

    if (
      item.type === 'link' &&
      item.className?.split(/\s+/).includes('api-method')
    ) {
      return count + 1;
    }

    return count;
  }, 0);
}

export type ApiReferenceGroup = {
  /** The tag group name, or null for families before the first heading. */
  label: string | null;
  families: ApiReferenceItem[];
};

function getTagGroupHeading(item: PropSidebarItem): string | null {
  if (item.type !== 'html') {
    return null;
  }
  const tagGroup = item.customProps?.tagGroup;
  return typeof tagGroup === 'string' ? tagGroup : null;
}

function findReferenceCategory(
  currentCategory: PropSidebarItemCategory,
  referenceCategoryLabel: string,
): PropSidebarItemCategory {
  const referenceCategory = findCategory(
    currentCategory.items,
    referenceCategoryLabel,
  );

  if (!referenceCategory) {
    throw new Error(
      `Could not find the "${referenceCategoryLabel}" sidebar category.`,
    );
  }

  return referenceCategory;
}

/**
 * Group the reference's families by the tag group headings (html sidebar
 * items with `customProps.tagGroup`) that precede them. A reference without
 * headings returns one group with a null label.
 */
export function getApiReferenceGroups(
  currentCategory: PropSidebarItemCategory,
  referenceCategoryLabel: string,
): ApiReferenceGroup[] {
  const referenceCategory = findReferenceCategory(
    currentCategory,
    referenceCategoryLabel,
  );
  const groups: ApiReferenceGroup[] = [{ label: null, families: [] }];

  for (const item of referenceCategory.items) {
    const heading = getTagGroupHeading(item);
    if (heading !== null) {
      groups.push({ label: heading, families: [] });
    } else if (item.type === 'category') {
      groups[groups.length - 1].families.push({
        ...item,
        endpointCount: countEndpoints(item.items),
      });
    }
  }

  return groups.filter((group) => group.families.length > 0);
}

export default function getApiReferenceItems(
  currentCategory: PropSidebarItemCategory,
  referenceCategoryLabel: string,
): ApiReferenceItem[] {
  return getApiReferenceGroups(currentCategory, referenceCategoryLabel).flatMap(
    (group) => group.families,
  );
}
