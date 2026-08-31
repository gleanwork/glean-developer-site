import type {
  PropSidebarItem,
  PropSidebarItemCategory,
} from '@docusaurus/plugin-content-docs';

const PLATFORM_API_REFERENCE_LABEL = 'Platform API Reference';

export type PlatformApiIconSet = 'feather' | 'glean';

export type PlatformApiFamilyCategory = PropSidebarItemCategory & {
  description: string;
  customProps: {
    icon: string;
    iconSet: PlatformApiIconSet;
  };
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

function validateApiFamily(
  family: PropSidebarItemCategory,
): asserts family is PlatformApiFamilyCategory {
  if (!family.description?.trim()) {
    throw new Error(
      `Platform API family "${family.label}" is missing a description.`,
    );
  }

  const icon = family.customProps?.icon;
  if (typeof icon !== 'string' || !icon.trim()) {
    throw new Error(
      `Platform API family "${family.label}" is missing an icon.`,
    );
  }

  const iconSet = family.customProps?.iconSet;
  if (iconSet !== 'feather' && iconSet !== 'glean') {
    throw new Error(
      `Platform API family "${family.label}" has an invalid icon set.`,
    );
  }
}

export default function getPlatformApiReferenceItems(
  currentCategory: PropSidebarItemCategory,
): PlatformApiFamilyCategory[] {
  const referenceCategory = findCategory(
    currentCategory.items,
    PLATFORM_API_REFERENCE_LABEL,
  );

  if (!referenceCategory) {
    throw new Error(
      `Could not find the "${PLATFORM_API_REFERENCE_LABEL}" sidebar category.`,
    );
  }

  const apiFamilies = referenceCategory.items.filter(
    (item): item is PropSidebarItemCategory => item.type === 'category',
  );
  return apiFamilies.map((family) => {
    validateApiFamily(family);
    return family;
  });
}
