import { describe, it, expect } from 'vitest';
import {
  parseRecipeFrontmatter,
  recipeMetaSchema,
  RECIPE_SCAFFOLD_ACTIONS,
} from './recipe';

function validFrontmatter() {
  return {
    title: 'Embed search & chat',
    description:
      'Put permission-aware Glean search and chat inside an internal app with the Web SDK.',
    recipe: {
      id: 'embed-search-chat',
      surfaces: ['web-sdk', 'platform-api'],
      status: 'production-pattern',
      category: 'search',
      level: 'Beginner',
      levels: { minimal: true, wow: true },
      time_estimate: '~15 min (minimal)',
      required_scopes: ['search:read', 'chat:write'],
      prerequisites: ['A Glean instance with content indexed'],
      ai_prompt:
        'Build the embed-search-chat recipe from developers.glean.com.',
    },
  };
}

describe('parseRecipeFrontmatter', () => {
  it('accepts a valid frontmatter and composes the flat record', () => {
    const result = parseRecipeFrontmatter(
      validFrontmatter(),
      'embed-search-chat',
    );
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.record.id).toBe('embed-search-chat');
    expect(result.record.title).toBe('Embed search & chat');
    expect(result.record.summary).toMatch(/permission-aware/);
    expect(result.record.permalink).toBe('/cookbook/embed-search-chat');
    // defaults applied
    expect(result.record.tags).toEqual([]);
    expect(result.record.featured).toBe(false);
    expect(result.record.go_dependency).toBe(false);
  });

  it('allows extra Docusaurus keys at the top level only', () => {
    const fm = { ...validFrontmatter(), sidebar_label: 'Embed', slug: '/x' };
    expect(parseRecipeFrontmatter(fm, 'embed-search-chat').success).toBe(true);
  });

  it('rejects unknown keys inside the recipe block', () => {
    const fm = validFrontmatter();
    (fm.recipe as Record<string, unknown>).surprise = true;
    const result = parseRecipeFrontmatter(fm, 'embed-search-chat');
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.join('\n')).toMatch(/recipe/);
  });

  it('rejects unknown enum values (surfaces, scaffold_actions)', () => {
    const fm = validFrontmatter();
    (fm.recipe as Record<string, unknown>).surfaces = ['web-sdkk'];
    const result = parseRecipeFrontmatter(fm, 'embed-search-chat');
    expect(result.success).toBe(false);

    const fm2 = validFrontmatter();
    (fm2.recipe as Record<string, unknown>).scaffold_actions = [
      'scaffold-everything',
    ];
    expect(parseRecipeFrontmatter(fm2, 'embed-search-chat').success).toBe(
      false,
    );
  });

  it('rejects missing required fields with a path in the error', () => {
    const fm = validFrontmatter();
    delete (fm.recipe as Record<string, unknown>).ai_prompt;
    const result = parseRecipeFrontmatter(fm, 'embed-search-chat');
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.some((e) => e.includes('recipe.ai_prompt'))).toBe(
      true,
    );
  });

  it('rejects a non-kebab-case id', () => {
    const fm = validFrontmatter();
    fm.recipe.id = 'Embed_Search';
    expect(parseRecipeFrontmatter(fm).success).toBe(false);
  });

  it('rejects an id that does not match the file name', () => {
    const result = parseRecipeFrontmatter(validFrontmatter(), 'other-file');
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors[0]).toMatch(/must match the file name/);
  });

  it('rejects a malformed last_verified date', () => {
    const fm = validFrontmatter();
    (fm.recipe as Record<string, unknown>).last_verified = 'yesterday';
    expect(parseRecipeFrontmatter(fm, 'embed-search-chat').success).toBe(false);
  });
});

describe('recipeMetaSchema', () => {
  it('exposes the four launch scaffold actions', () => {
    expect(RECIPE_SCAFFOLD_ACTIONS).toHaveLength(4);
    const fm = validFrontmatter();
    (fm.recipe as Record<string, unknown>).scaffold_actions = [
      ...RECIPE_SCAFFOLD_ACTIONS,
    ];
    expect(parseRecipeFrontmatter(fm, 'embed-search-chat').success).toBe(true);
  });

  it('requires at least one surface and prerequisite', () => {
    for (const key of ['surfaces', 'prerequisites'] as const) {
      const fm = validFrontmatter();
      (fm.recipe as Record<string, unknown>)[key] = [];
      expect(parseRecipeFrontmatter(fm, 'embed-search-chat').success).toBe(
        false,
      );
    }
  });
});
