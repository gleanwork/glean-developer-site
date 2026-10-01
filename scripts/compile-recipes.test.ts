import { describe, expect, it } from 'vitest';
import {
  compileRecipeCatalog,
  compileRecipeCollections,
  compileRecipeFacets,
} from './compile-recipes';
import type { RecipeRecord } from '../src/types/recipe';

function listedEntry(id: string) {
  return {
    id,
    title: id,
    description: 'A recipe.',
    surfaces: ['web-sdk'],
    capabilities: ['embed'],
    status: 'production-pattern',
    category: 'search',
    level: 'Beginner',
    levels: { minimal: true, wow: true },
    timeEstimate: '~15 min',
    requiredScopes: ['SEARCH'],
    authMethod: ['web-sdk-cookie'],
    buildMethod: 'integrate',
    prerequisites: ['A Glean instance'],
    content: {
      problem: 'People leave their app to search.',
      takeItFurther: ['Add a scoped agent.'],
    },
    aiPrompt: 'Build the recipe.',
  };
}

describe('compileRecipeCatalog', () => {
  it('omits hidden recipes from the compiled catalog', () => {
    const { records, errors } = compileRecipeCatalog(
      [
        listedEntry('embed-search-chat'),
        {
          ...listedEntry('wip'),
          hidden: true,
          codeWalkthrough: {
            intro: 'Private implementation details.',
            examples: [
              {
                title: 'Private module',
                description: 'Not published.',
                language: 'typescript',
                source: 'src/private.ts',
              },
            ],
          },
        },
      ],
      new Set(['embed-search-chat']),
    );

    expect(errors).toEqual([]);
    expect(records.map((recipe) => recipe.id)).toEqual(['embed-search-chat']);
  });

  it('fails when a hidden recipe still has an MDX page', () => {
    const { errors } = compileRecipeCatalog(
      [{ ...listedEntry('wip'), hidden: true }],
      new Set(['wip']),
    );

    expect(errors.join('\n')).toMatch(/hidden recipe must not have/);
  });

  it('requires code walkthrough sources to be materialized during sync', () => {
    const entry = {
      ...listedEntry('source-backed'),
      codeWalkthrough: {
        intro: 'Read the implementation.',
        examples: [
          {
            title: 'Build a request',
            description: 'Keep the request typed and explicit.',
            source: 'src/request.ts',
            language: 'typescript',
          },
        ],
      },
    };

    const missing = compileRecipeCatalog([entry], new Set(['source-backed']));
    expect(missing.errors.join('\n')).toMatch(/was not materialized/);

    const materialized = compileRecipeCatalog(
      [
        {
          ...entry,
          codeWalkthrough: {
            ...entry.codeWalkthrough,
            examples: [
              {
                ...entry.codeWalkthrough.examples[0],
                code: 'export const request = { pageSize: 10 };',
              },
            ],
          },
        },
      ],
      new Set(['source-backed']),
    );
    expect(materialized.errors).toEqual([]);
  });

  it('requires API flow bodies to arrive from the cookbook as JSON', () => {
    const flowEntry = (response: { source: string; body?: string }) => ({
      ...listedEntry('api-flow'),
      apiFlow: {
        intro: 'Follow the run ID.',
        calls: [
          {
            title: 'Start',
            description: 'Start a run.',
            method: 'POST',
            path: '/runs',
            request: { source: 'flow/start.request.json', body: '{}' },
            response,
            highlights: [
              { in: 'response', pointer: '/run_id', value: 'run_id' },
            ],
          },
          {
            title: 'Poll',
            description: 'Poll the run.',
            method: 'GET',
            path: '/runs/{run_id}',
            response: {
              source: 'flow/poll.response.json',
              body: '{"state": "DONE"}',
            },
            highlights: [{ in: 'path', param: 'run_id', value: 'run_id' }],
          },
        ],
      },
    });
    const pages = new Set(['api-flow']);

    for (const response of [
      { source: 'flow/start.response.json' },
      { source: 'flow/start.response.json', body: '{ nope' },
      { source: 'flow/start.response.json', body: '"run-1"' },
    ]) {
      expect(
        compileRecipeCatalog([flowEntry(response)], pages).errors.join('\n'),
      ).toMatch(/API flow body was not materialized as JSON for flow\/start/);
    }
    const materialized = compileRecipeCatalog(
      [
        flowEntry({
          source: 'flow/start.response.json',
          body: '{"run_id": "run-1"}',
        }),
      ],
      pages,
    );
    expect(materialized.errors).toEqual([]);
    expect(materialized.records[0]!.apiFlow?.calls).toHaveLength(2);
  });

  it('compiles preview recipes when their gated MDX page exists', () => {
    const { records, errors } = compileRecipeCatalog(
      [{ ...listedEntry('preview-search'), visibility: 'preview' }],
      new Set(['preview-search']),
    );

    expect(errors).toEqual([]);
    expect(records[0]).toMatchObject({
      id: 'preview-search',
      visibility: 'preview',
    });
  });

  it('fails when a listed recipe is missing its MDX page', () => {
    const { errors } = compileRecipeCatalog(
      [listedEntry('embed-search-chat')],
      new Set(),
    );

    expect(errors.join('\n')).toMatch(/has no matching docs\/cookbook/);
  });

  it('compiles capabilities in synced taxonomy order without duplicates', () => {
    const { records, errors } = compileRecipeCatalog(
      [
        { ...listedEntry('publish-skill'), capabilities: ['skills', 'tools'] },
        { ...listedEntry('search'), capabilities: ['search', 'skills'] },
      ],
      new Set(['publish-skill', 'search']),
    );

    expect(errors).toEqual([]);
    expect(compileRecipeFacets(records).capabilities).toEqual([
      'search',
      'tools',
      'skills',
    ]);
  });
});

describe('compileRecipeCollections', () => {
  const records = ['chat-1', 'search-1', 'search-2'].map(
    (id) => ({ id }) as RecipeRecord,
  );
  const collection = (id: string, recipes: string[]) => ({
    id,
    label: id,
    description: `${id} recipes`,
    recipes,
  });

  it('keeps collection and path order, limited to recipes published here', () => {
    const { collections, errors } = compileRecipeCollections(
      {
        collections: [
          collection('search', ['search-2', 'hidden-search', 'search-1']),
          collection('chat', ['chat-1']),
          collection('hidden-only', ['hidden-search']),
        ],
      },
      records,
    );

    expect(errors).toEqual([]);
    expect(collections.map(({ id, recipes }) => [id, recipes])).toEqual([
      ['search', ['search-2', 'search-1']],
      ['chat', ['chat-1']],
    ]);
  });

  it('rejects a published recipe in no collection or in two', () => {
    const { errors } = compileRecipeCollections(
      {
        collections: [
          collection('search', ['search-1', 'search-2']),
          collection('more-search', ['search-2']),
        ],
      },
      records,
    );

    expect(errors).toEqual([
      'search-2: in both the search and more-search collections',
      'chat-1: not in any collection',
    ]);
  });

  it('rejects a malformed collections file', () => {
    const { collections, errors } = compileRecipeCollections(
      { collections: [{ id: 'search', recipes: [] }] },
      records,
    );

    expect(collections).toEqual([]);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.every((error) => error.startsWith('collections: '))).toBe(
      true,
    );
  });
});
