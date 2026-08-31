import { describe, expect, it } from 'vitest';
import { compileRecipeCatalog } from './compile-recipes';

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
});
