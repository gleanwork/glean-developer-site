import type {
  PropSidebarItem,
  PropSidebarItemCategory,
} from '@docusaurus/plugin-content-docs';
import { describe, expect, it } from 'vitest';
import getApiReferenceItems, {
  getApiReferenceGroups,
} from './getApiReferenceItems';

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

  it('groups families by the tag group headings that precede them', () => {
    const heading = (tagGroup: string): PropSidebarItem => ({
      type: 'html',
      value: tagGroup,
      className: 'sidebar-api-group',
      customProps: { tagGroup },
    });
    const currentCategory = apiCategory('Platform API Reference', [
      heading('Agents & AI'),
      category('Agents', [endpoint('Search agents', '/agents/search')]),
      category('Chat', [endpoint('Create chat', '/chat')]),
      heading('Administration'),
      category('Agents', [endpoint('List all agents', '/admin/agents')]),
      link('OpenAPI Spec', 'https://developers.glean.com/oas/platform'),
    ]);

    expect(
      getApiReferenceGroups(currentCategory, 'Platform API Reference').map(
        ({ label, families }) => ({
          label,
          families: families.map((family) => family.label),
        }),
      ),
    ).toEqual([
      { label: 'Agents & AI', families: ['Agents', 'Chat'] },
      { label: 'Administration', families: ['Agents'] },
    ]);
    expect(
      getApiReferenceItems(currentCategory, 'Platform API Reference'),
    ).toHaveLength(3);
  });

  it('returns one unlabelled group when the reference has no headings', () => {
    const currentCategory = apiCategory('Client API Reference', [
      category('Search', [endpoint('Search', '/search')]),
    ]);

    expect(
      getApiReferenceGroups(currentCategory, 'Client API Reference'),
    ).toEqual([
      {
        label: null,
        families: [expect.objectContaining({ label: 'Search' })],
      },
    ]);
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
