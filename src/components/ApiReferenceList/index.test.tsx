import type {
  PropSidebarItem,
  PropSidebarItemCategory,
} from '@docusaurus/plugin-content-docs';
import { describe, expect, it } from 'vitest';
import getApiReferenceItems from './getApiReferenceItems';

function category(
  label: string,
  items: PropSidebarItem[] = [],
): PropSidebarItemCategory {
  return {
    type: 'category',
    label,
    collapsed: true,
    collapsible: true,
    items,
  };
}

function link(
  label: string,
  href: string,
  className?: string,
): PropSidebarItem {
  return {
    type: 'link',
    label,
    href,
    className,
  };
}

function endpoint(label: string, href: string): PropSidebarItem {
  return link(label, href, 'api-method get');
}

function apiCategory(
  referenceCategoryLabel: string,
  referenceItems: PropSidebarItem[],
): PropSidebarItemCategory {
  return category('API', [
    link('Quickstart', '/getting-started'),
    category(referenceCategoryLabel, referenceItems),
  ]);
}

describe('getApiReferenceItems', () => {
  it.each([
    'Platform API Reference',
    'Client API Reference',
    'Indexing API Reference',
  ])('selects and counts families from %s', (referenceCategoryLabel) => {
    const firstFamily = category('First', [endpoint('Get first', '/first')]);
    const secondFamily = category('Second', [
      endpoint('Get second', '/second'),
      endpoint('Create second', '/second/create'),
    ]);
    const currentCategory = apiCategory(referenceCategoryLabel, [
      firstFamily,
      secondFamily,
      link('OpenAPI Spec', 'https://developers.glean.com/oas/api'),
    ]);

    expect(
      getApiReferenceItems(currentCategory, referenceCategoryLabel).map(
        ({ label, endpointCount }) => ({ label, endpointCount }),
      ),
    ).toEqual([
      { label: 'First', endpointCount: 1 },
      { label: 'Second', endpointCount: 2 },
    ]);
  });

  it('preserves optional family icons and descriptions', () => {
    const family = category('Agents', [endpoint('Get agent', '/agents/get')]);
    family.description = 'Discover and run agents.';
    family.customProps = {
      icon: 'agent',
      iconSet: 'glean',
    };
    const currentCategory = apiCategory('API Reference', [family]);

    expect(getApiReferenceItems(currentCategory, 'API Reference')[0]).toEqual(
      expect.objectContaining({
        label: 'Agents',
        description: 'Discover and run agents.',
        customProps: {
          icon: 'agent',
          iconSet: 'glean',
        },
      }),
    );
  });

  it('counts endpoints recursively and ignores non-endpoint links', () => {
    const family = category('Nested', [
      link('Overview', '/nested/overview'),
      endpoint('Direct endpoint', '/nested/direct'),
      category('Operations', [
        endpoint('Nested endpoint', '/nested/operation'),
      ]),
    ]);
    const currentCategory = apiCategory('API Reference', [family]);

    expect(getApiReferenceItems(currentCategory, 'API Reference')[0]).toEqual(
      expect.objectContaining({
        label: 'Nested',
        endpointCount: 2,
      }),
    );
  });

  it('throws when the reference category is missing', () => {
    const currentCategory = category('API', [
      link('Quickstart', '/getting-started'),
    ]);

    expect(() =>
      getApiReferenceItems(currentCategory, 'Missing API Reference'),
    ).toThrow('Could not find the "Missing API Reference" sidebar category.');
  });
});
