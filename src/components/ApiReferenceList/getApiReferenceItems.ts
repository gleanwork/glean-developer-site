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

export default function getApiReferenceItems(
  currentCategory: PropSidebarItemCategory,
  referenceCategoryLabel: string,
): ApiReferenceItem[] {
  const referenceCategory = findCategory(
    currentCategory.items,
    referenceCategoryLabel,
  );

  if (!referenceCategory) {
    throw new Error(
      `Could not find the "${referenceCategoryLabel}" sidebar category.`,
    );
  }

  return referenceCategory.items
    .filter((item): item is PropSidebarItemCategory => item.type === 'category')
    .map((item) => ({
      ...item,
      endpointCount: countEndpoints(item.items),
    }));
}
