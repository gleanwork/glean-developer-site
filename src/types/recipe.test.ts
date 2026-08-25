import { describe, it, expect } from 'vitest';
import {
  parseRecipeEntry,
  RECIPE_SCAFFOLD_ACTIONS,
  isListedOnDocs,
} from './recipe';

function validEntry() {
  return {
    id: 'embed-search-chat',
    title: 'Embed search & chat',
    description:
      'Put permission-aware Glean search and chat inside an internal app with the Web SDK.',
    surfaces: ['web-sdk', 'platform-api'],
    status: 'production-pattern',
    category: 'search',
    level: 'Beginner',
    levels: { minimal: true, wow: true },
    timeEstimate: '~15 min (minimal)',
    requiredScopes: ['search:read', 'chat:write'],
    authMethod: ['web-sdk-cookie'],
    buildMethod: 'integrate',
    prerequisites: ['A Glean instance with content indexed'],
    content: {
      problem: 'People leave their app to search for answers.',
      takeItFurther: ['Add a scoped agent.'],
    },
    aiPrompt: 'Build the embed-search-chat recipe from developers.glean.com.',
  };
}

describe('parseRecipeEntry', () => {
  it('accepts a valid entry and composes the flat record', () => {
    const result = parseRecipeEntry(validEntry(), 'embed-search-chat');
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.record.id).toBe('embed-search-chat');
    expect(result.record.title).toBe('Embed search & chat');
    expect(result.record.description).toMatch(/permission-aware/);
    expect(result.record.permalink).toBe('/cookbook/embed-search-chat');
    // defaults applied
    expect(result.record.tags).toEqual([]);
    expect(result.record.featured).toBe(false);
    expect(result.record.hidden).toBe(false);
    expect(isListedOnDocs(result.record)).toBe(true);
    expect(result.record.goDependency).toBe(false);
  });

  it('accepts hidden true', () => {
    const entry = { ...validEntry(), hidden: true };
    const result = parseRecipeEntry(entry, 'embed-search-chat');
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.record.hidden).toBe(true);
    expect(isListedOnDocs(result.record)).toBe(false);
  });

  it('accepts an optional sidebarLabel', () => {
    const entry = { ...validEntry(), sidebarLabel: 'Embed' };
    const result = parseRecipeEntry(entry, 'embed-search-chat');
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.record.sidebarLabel).toBe('Embed');
  });

  it('accepts a cookbook-owned WebP preview', () => {
    const entry = {
      ...validEntry(),
      preview: {
        path: 'recipes/embed-search-chat/assets/preview.webp',
        alt: 'Search and chat embedded in an internal app',
        caption: 'Permission-aware search and chat in one view.',
      },
    };
    expect(parseRecipeEntry(entry, 'embed-search-chat').success).toBe(true);
  });

  it('rejects preview assets outside the cookbook recipe asset shape', () => {
    const entry = {
      ...validEntry(),
      preview: {
        path: '../preview.png',
        alt: 'Preview',
        caption: 'Preview caption.',
      },
    };
    expect(parseRecipeEntry(entry, 'embed-search-chat').success).toBe(false);
  });

  it('accepts a path-level customer execution contract', () => {
    const entry = {
      ...validEntry(),
      execution: {
        type: 'local-web',
        questions: [
          {
            id: 'email',
            prompt: 'What is your work email?',
          },
        ],
        auth: [
          {
            kind: 'oauth-with-token-fallback',
            scopes: ['CHAT'],
            setupCommand: 'npm run login',
            configFile: '.env',
            backendVariable: 'GLEAN_SERVER_URL',
            credentialVariable: 'GLEAN_API_TOKEN',
          },
        ],
        verification: {
          kind: 'automated',
          command: 'npm run verify',
          expectedDuration: '1–3 minutes',
          startsOwnServer: true,
        },
        run: {
          command: 'npm start',
          url: 'http://localhost:3000',
          userBrowser: true,
        },
      },
    };
    const result = parseRecipeEntry(entry, 'embed-search-chat');
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.record.execution?.auth[0].kind).toBe(
      'oauth-with-token-fallback',
    );
  });

  it('requires an executable command for automated verification', () => {
    const entry = {
      ...validEntry(),
      execution: {
        type: 'cli',
        auth: [{ kind: 'none' }],
        verification: {
          kind: 'automated',
          expectedDuration: 'about 1 minute',
        },
      },
    };
    expect(parseRecipeEntry(entry, 'embed-search-chat').success).toBe(false);
  });

  it('accepts explicit manual verification without a command', () => {
    const entry = {
      ...validEntry(),
      execution: {
        type: 'cli',
        auth: [{ kind: 'none' }],
        verification: {
          kind: 'manual',
          expectedDuration: 'about 1 minute',
        },
      },
    };
    expect(parseRecipeEntry(entry, 'embed-search-chat').success).toBe(true);
  });

  it('rejects run handoffs with no command or URL', () => {
    for (const run of [{}, { userBrowser: true }]) {
      const entry = {
        ...validEntry(),
        execution: {
          type: 'local-web',
          auth: [{ kind: 'none' }],
          verification: {
            kind: 'manual',
            expectedDuration: 'about 1 minute',
          },
          run,
        },
      };
      expect(parseRecipeEntry(entry, 'embed-search-chat').success).toBe(false);
    }
  });

  it('accepts an explicit existing-app browser handoff', () => {
    const entry = {
      ...validEntry(),
      execution: {
        type: 'existing-app',
        auth: [{ kind: 'browser-cookie' }],
        verification: {
          kind: 'user-browser',
          expectedDuration: 'about 1 minute',
        },
        run: {
          kind: 'existing-app',
          userBrowser: true,
        },
      },
    };
    expect(parseRecipeEntry(entry, 'embed-search-chat').success).toBe(true);
  });

  it('requires an execution type when an execution contract is present', () => {
    const entry = {
      ...validEntry(),
      execution: {
        auth: [{ kind: 'none' }],
        verification: {
          kind: 'manual',
          expectedDuration: 'about 1 minute',
        },
      },
    };
    expect(parseRecipeEntry(entry, 'embed-search-chat').success).toBe(false);
  });

  it('rejects unknown top-level keys', () => {
    const entry = { ...validEntry(), surprise: true };
    const result = parseRecipeEntry(entry, 'embed-search-chat');
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.join('\n')).toMatch(/surprise/);
  });

  it('rejects unknown enum values (surfaces, scaffoldActions)', () => {
    const entry = { ...validEntry(), surfaces: ['web-sdkk'] };
    expect(parseRecipeEntry(entry, 'embed-search-chat').success).toBe(false);

    const entry2 = {
      ...validEntry(),
      scaffoldActions: ['scaffold-everything'],
    };
    expect(parseRecipeEntry(entry2, 'embed-search-chat').success).toBe(false);
  });

  it('rejects missing required fields with a path in the error', () => {
    const entry: Record<string, unknown> = validEntry();
    delete entry.aiPrompt;
    const result = parseRecipeEntry(entry, 'embed-search-chat');
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.some((e) => e.includes('aiPrompt'))).toBe(true);
  });

  it('rejects a non-kebab-case id', () => {
    const entry = { ...validEntry(), id: 'Embed_Search' };
    expect(parseRecipeEntry(entry).success).toBe(false);
  });

  it('rejects an id that does not match the file name', () => {
    const result = parseRecipeEntry(validEntry(), 'other-file');
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors[0]).toMatch(/must match the file name/);
  });

  it('rejects a malformed lastVerified date', () => {
    const entry = { ...validEntry(), lastVerified: 'yesterday' };
    expect(parseRecipeEntry(entry, 'embed-search-chat').success).toBe(false);
  });
});

describe('recipeMetaSchema', () => {
  it('exposes the four launch scaffold actions', () => {
    expect(RECIPE_SCAFFOLD_ACTIONS).toHaveLength(4);
    const entry = {
      ...validEntry(),
      scaffoldActions: [...RECIPE_SCAFFOLD_ACTIONS],
    };
    expect(parseRecipeEntry(entry, 'embed-search-chat').success).toBe(true);
  });

  it('requires at least one surface and prerequisite', () => {
    for (const key of ['surfaces', 'prerequisites'] as const) {
      const entry = { ...validEntry(), [key]: [] };
      expect(parseRecipeEntry(entry, 'embed-search-chat').success).toBe(false);
    }
  });
});
