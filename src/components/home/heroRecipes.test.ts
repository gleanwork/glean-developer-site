import { describe, expect, it } from 'vitest';
import recipesData from '@site/src/data/recipes.json';
import cookbookTaxonomy from '@site/data/cookbook-taxonomy.json';
import type { RecipeRecord } from '@site/src/types/recipe';
import { HERO_SLIDES } from './snippets';
import { heroRecipeLink } from './heroRecipes';

type RecipeFixture = Pick<RecipeRecord, 'id' | 'visibility' | 'capabilities'>;

const recipe = (
  id: string,
  capabilities: string[],
  visibility: RecipeFixture['visibility'] = 'public',
): RecipeFixture => ({
  id,
  capabilities: capabilities as RecipeFixture['capabilities'],
  visibility,
});

describe('heroRecipeLink', () => {
  it('counts public recipes for the capability and links to the filter', () => {
    const link = heroRecipeLink(
      [
        recipe('a', ['chat']),
        recipe('b', ['chat', 'search']),
        recipe('c', ['search']),
      ],
      'chat',
    );

    expect(link).toEqual({
      href: '/cookbook?capability=chat',
      label: '2 recipes in the Cookbook',
      ariaLabel: '2 Chat recipes in the Cookbook',
    });
  });

  it('excludes preview recipes, matching the ungated Cookbook index', () => {
    const link = heroRecipeLink(
      [recipe('a', ['chat']), recipe('b', ['chat'], 'preview')],
      'chat',
    );

    expect(link?.label).toBe('1 recipe in the Cookbook');
  });

  it('returns null when no public recipe covers the capability', () => {
    expect(
      heroRecipeLink([recipe('a', ['indexing'], 'preview')], 'indexing'),
    ).toBeNull();
  });
});

describe('hero slides', () => {
  const capabilityIds = cookbookTaxonomy.capabilities.map(({ id }) => id);

  it.each(HERO_SLIDES)(
    '$surface uses a capability from the cookbook taxonomy',
    (slide) => {
      expect(capabilityIds).toContain(slide.recipeCapability);
    },
  );

  it('links at least one slide to recipes with the synced data', () => {
    const linked = HERO_SLIDES.filter((slide) =>
      heroRecipeLink(
        recipesData.recipes as RecipeFixture[],
        slide.recipeCapability,
      ),
    );

    expect(linked.length).toBeGreaterThan(0);
  });
});
