import type {
  PropSidebarItem,
  PropSidebarItemCategory,
} from '@docusaurus/plugin-content-docs';
import { describe, expect, it } from 'vitest';
import getPlatformApiReferenceItems, {
  type PlatformApiFamilyCategory,
} from './getPlatformApiReferenceItems';

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

function family(
  label: string,
  items: PropSidebarItem[] = [],
): PlatformApiFamilyCategory {
  return {
    ...category(label, items),
    description: `${label} API description`,
    customProps: {
      icon: 'Box',
      iconSet: 'feather',
    },
  };
}

function link(label: string, href: string): PropSidebarItem {
  return {
    type: 'link',
    label,
    href,
  };
}

function platformCategory(
  referenceItems: PropSidebarItem[],
): PropSidebarItemCategory {
  return category('Platform API', [
    link('Quickstart', '/getting-started'),
    category('Platform API Reference', referenceItems),
  ]);
}

describe('getPlatformApiReferenceItems', () => {
  it('returns every API family with presentation metadata', () => {
    const agents = family('Agents', [link('Get an agent', '/agents/get')]);
    const triggers = family('Triggers', [
      link('Create a trigger', '/triggers/create'),
    ]);
    const futureApi = family('Future API', [
      link('Future endpoint', '/future/get'),
    ]);
    const currentCategory = platformCategory([
      agents,
      triggers,
      futureApi,
      link('OpenAPI Spec', 'https://developers.glean.com/oas/platform'),
    ]);

    expect(getPlatformApiReferenceItems(currentCategory)).toEqual([
      agents,
      triggers,
      futureApi,
    ]);
  });

  it('rejects an API family without a description', () => {
    const incompleteFamily = category('Future API');
    incompleteFamily.customProps = {
      icon: 'Box',
      iconSet: 'feather',
    };

    expect(() =>
      getPlatformApiReferenceItems(platformCategory([incompleteFamily])),
    ).toThrow('Platform API family "Future API" is missing a description.');
  });

  it('rejects an API family without an icon', () => {
    const incompleteFamily = category('Future API');
    incompleteFamily.description = 'Future API description';
    incompleteFamily.customProps = { iconSet: 'feather' };

    expect(() =>
      getPlatformApiReferenceItems(platformCategory([incompleteFamily])),
    ).toThrow('Platform API family "Future API" is missing an icon.');
  });

  it('rejects an API family with an invalid icon set', () => {
    const incompleteFamily = category('Future API');
    incompleteFamily.description = 'Future API description';
    incompleteFamily.customProps = {
      icon: 'Box',
      iconSet: 'unknown',
    };

    expect(() =>
      getPlatformApiReferenceItems(platformCategory([incompleteFamily])),
    ).toThrow('Platform API family "Future API" has an invalid icon set.');
  });

  it('throws when the reference category is missing', () => {
    const currentCategory = category('Platform API', [
      link('Quickstart', '/getting-started'),
    ]);

    expect(() => getPlatformApiReferenceItems(currentCategory)).toThrow(
      'Could not find the "Platform API Reference" sidebar category.',
    );
  });
});
