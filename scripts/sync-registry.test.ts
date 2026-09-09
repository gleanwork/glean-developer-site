import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - plain .mjs module without type declarations
import {
  extractPluginCoordinates,
  listedRecipes,
  materializeCodeWalkthroughSources,
  parseRecipeTaxonomy,
  publicRecipes,
  renderPage,
  syncPreviewAssets,
  writeRecipePages,
} from './sync-registry.mjs';

describe('parseRecipeTaxonomy', () => {
  it('accepts data-driven capabilities and surfaces', () => {
    expect(
      parseRecipeTaxonomy(
        JSON.stringify({
          capabilities: [
            { id: 'future-capability', label: 'Future capability' },
          ],
          surfaces: [{ id: 'future-api', label: 'Future API' }],
        }),
      ),
    ).toEqual({
      capabilities: [{ id: 'future-capability', label: 'Future capability' }],
      surfaces: [{ id: 'future-api', label: 'Future API' }],
    });
  });

  it('rejects duplicate ids before writing the snapshot', () => {
    expect(() =>
      parseRecipeTaxonomy(
        JSON.stringify({
          capabilities: [
            { id: 'search', label: 'Search' },
            { id: 'search', label: 'Search again' },
          ],
          surfaces: [{ id: 'client-api', label: 'Client API' }],
        }),
      ),
    ).toThrow('capabilities contains duplicate ids');
  });
});

/**
 * The real manifest as pluginpack emits it at the root of gleanwork/
 * glean-cookbook. These coordinates end up printed verbatim on every recipe
 * page (`/plugin install <plugin>@<marketplace>`, `/<plugin>:<recipe-id>`),
 * so the extraction asserts rather than defaults — a shape change upstream
 * should fail the sync, not quietly ship a wrong command.
 */
const MANIFEST = JSON.stringify({
  $schema: 'https://anthropic.com/claude-code/marketplace.schema.json',
  name: 'glean-cookbook',
  version: '0.1.0',
  description: 'Build Glean cookbook recipes hands-free.',
  owner: { name: 'Glean' },
  plugins: [
    {
      name: 'cookbook',
      source: './build/claude/cookbook',
      description: 'Build Glean cookbook recipes hands-free.',
      version: '0.1.0',
      author: { name: 'Glean' },
      homepage: 'https://developers.glean.com/cookbook',
      repository: 'https://github.com/gleanwork/glean-cookbook',
      license: 'MIT',
    },
  ],
});

function manifestWith(mutate: (m: Record<string, unknown>) => void) {
  const parsed = JSON.parse(MANIFEST);
  mutate(parsed);
  return JSON.stringify(parsed);
}

describe('extractPluginCoordinates', () => {
  it('pulls the names the recipe pages print', () => {
    expect(extractPluginCoordinates(MANIFEST)).toEqual({
      marketplaceName: 'glean-cookbook',
      pluginName: 'cookbook',
      repo: 'gleanwork/glean-cookbook',
    });
  });

  it('derives the repo slug from the plugin repository URL, not a constant', () => {
    const moved = manifestWith((m) => {
      (m.plugins as Array<Record<string, unknown>>)[0].repository =
        'https://github.com/gleanwork/cookbooks';
    });
    expect(extractPluginCoordinates(moved).repo).toBe('gleanwork/cookbooks');
  });

  it('accepts an SSH-style repository URL', () => {
    const ssh = manifestWith((m) => {
      (m.plugins as Array<Record<string, unknown>>)[0].repository =
        'git@github.com:gleanwork/glean-cookbook.git';
    });
    expect(ssh && extractPluginCoordinates(ssh).repo).toBe(
      'gleanwork/glean-cookbook',
    );
  });

  it('refuses to guess when more than one plugin is present', () => {
    const two = manifestWith((m) => {
      const plugins = m.plugins as Array<Record<string, unknown>>;
      plugins.push({ ...plugins[0], name: 'other' });
    });
    expect(() => extractPluginCoordinates(two)).toThrow(/found 2/);
  });

  it('refuses an empty plugins array rather than emitting undefined names', () => {
    const none = manifestWith((m) => {
      m.plugins = [];
    });
    expect(() => extractPluginCoordinates(none)).toThrow(/found 0/);
  });

  it('fails when the marketplace name is missing', () => {
    const nameless = manifestWith((m) => {
      delete m.name;
    });
    expect(() => extractPluginCoordinates(nameless)).toThrow(
      /missing a marketplace name or plugin name/,
    );
  });

  it('fails when the repository URL is absent rather than inventing a slug', () => {
    const noRepo = manifestWith((m) => {
      delete (m.plugins as Array<Record<string, unknown>>)[0].repository;
    });
    expect(() => extractPluginCoordinates(noRepo)).toThrow(
      /Could not derive a GitHub slug/,
    );
  });
});

describe('renderPage', () => {
  const markdown = [
    '## Problem',
    '',
    'People need a useful recipe.',
    '',
    '## Take it further',
    '',
    '- Add another capability.',
  ].join('\n');

  const recipe = {
    id: 'customer-360',
    title: 'Customer 360: an account page',
    sidebarLabel: 'Customer 360',
  };

  it('generates native Docusaurus pagination between adjacent recipes', () => {
    const page = renderPage(
      recipe,
      markdown,
      { id: 'company-answers' },
      { id: 'embed-search-chat' },
    );

    expect(page).toContain('pagination_label: "Customer 360"');
    expect(page).toContain('pagination_prev: "cookbook/company-answers"');
    expect(page).toContain('pagination_next: "cookbook/embed-search-chat"');
  });

  it('places source-backed code walkthroughs before architecture and setup', () => {
    const page = renderPage(
      {
        ...recipe,
        codeWalkthrough: { intro: 'Read it.', examples: [] },
      },
      markdown,
    );
    const walkthrough = page.indexOf('<RecipeCodeWalkthrough />');
    const architecture = page.indexOf('<RecipeArchitecture />');
    const prerequisites = page.indexOf('<RecipePrereqs />');

    expect(walkthrough).toBeGreaterThan(0);
    expect(walkthrough).toBeLessThan(architecture);
    expect(architecture).toBeLessThan(prerequisites);
    expect(page).toContain('RecipeCodeWalkthrough,');
  });

  it('keeps the sequence bounded to recipes at either end', () => {
    const first = renderPage(recipe, markdown, null, {
      id: 'embed-search-chat',
    });
    const last = renderPage(recipe, markdown, { id: 'company-answers' }, null);

    expect(first).toContain('pagination_prev: null');
    expect(first).toContain('pagination_next: "cookbook/embed-search-chat"');
    expect(last).toContain('pagination_prev: "cookbook/company-answers"');
    expect(last).toContain('pagination_next: null');
  });

  it('marks preview recipes as unlisted', () => {
    const page = renderPage({ ...recipe, visibility: 'preview' }, markdown);
    expect(page).toContain('unlisted: true');
  });
});

describe('listedRecipes', () => {
  const recipes = [
    { id: 'company-answers' },
    { id: 'preview-search', visibility: 'preview' },
    { id: 'wip', hidden: true },
    { id: 'embed-search-chat', hidden: false },
  ];

  it('drops hidden recipes but keeps generated preview pages', () => {
    expect(
      listedRecipes(recipes).map((entry: { id: string }) => entry.id),
    ).toEqual(['company-answers', 'preview-search', 'embed-search-chat']);
  });

  it('removes preview recipes from public navigation', () => {
    expect(
      publicRecipes(recipes).map((entry: { id: string }) => entry.id),
    ).toEqual(['company-answers', 'embed-search-chat']);
  });
});

describe('writeRecipePages', () => {
  const stubContent = {
    problem: 'People need a useful recipe.',
    takeItFurther: ['Add another capability.'],
  };

  it('writes listed pages, skips hidden ones, and deletes leftover hidden MDX', () => {
    const output = fs.mkdtempSync(path.join(os.tmpdir(), 'cookbook-pages-'));
    try {
      fs.writeFileSync(path.join(output, 'index.mdx'), 'index');
      fs.writeFileSync(path.join(output, 'wip.mdx'), 'stale hidden page');
      const written = writeRecipePages(
        [
          {
            id: 'company-answers',
            title: 'Company Answers',
            content: stubContent,
          },
          {
            id: 'wip',
            title: 'WIP',
            hidden: true,
            content: stubContent,
          },
          {
            id: 'preview-search',
            title: 'Preview Search',
            visibility: 'preview',
            content: stubContent,
          },
          {
            id: 'embed-search-chat',
            title: 'Embed',
            content: stubContent,
          },
        ],
        output,
      );

      expect([...written].sort()).toEqual([
        'company-answers',
        'embed-search-chat',
        'preview-search',
      ]);
      expect(fs.existsSync(path.join(output, 'wip.mdx'))).toBe(false);
      expect(fs.existsSync(path.join(output, 'index.mdx'))).toBe(true);
      const first = fs.readFileSync(
        path.join(output, 'company-answers.mdx'),
        'utf8',
      );
      expect(first).toContain('pagination_next: "cookbook/embed-search-chat"');
      expect(first).not.toContain('cookbook/wip');
      expect(first).not.toContain('cookbook/preview-search');
      const preview = fs.readFileSync(
        path.join(output, 'preview-search.mdx'),
        'utf8',
      );
      expect(preview).toContain('unlisted: true');
      expect(preview).toContain('pagination_prev: null');
      expect(preview).toContain('pagination_next: null');
    } finally {
      fs.rmSync(output, { recursive: true, force: true });
    }
  });
});

describe('materializeCodeWalkthroughSources', () => {
  const fixtureRoot = path.resolve(__dirname, 'fixtures', 'code-walkthrough');

  it('materializes declared sources from their owning recipe directory', async () => {
    const registry = JSON.parse(
      fs.readFileSync(path.join(fixtureRoot, 'registry.json'), 'utf8'),
    );
    const requested: string[] = [];
    const materialized = await materializeCodeWalkthroughSources(
      registry,
      async (sourcePath: string) => {
        requested.push(sourcePath);
        return fs.readFileSync(path.join(fixtureRoot, sourcePath));
      },
    );

    expect(requested).toEqual(['recipes/source-backed/src/request.ts']);
    expect(materialized[0].codeWalkthrough.examples[0].code).toBe(
      fs.readFileSync(
        path.join(fixtureRoot, 'recipes', 'source-backed', 'src', 'request.ts'),
        'utf8',
      ),
    );
    expect(registry[0].codeWalkthrough.examples[0]).not.toHaveProperty('code');
    expect(materialized[1]).toBe(registry[1]);
  });

  it('does not fetch or embed sources for hidden recipes', async () => {
    const hidden = {
      id: 'hidden-recipe',
      hidden: true,
      codeWalkthrough: {
        examples: [{ source: '../private-source.ts' }],
      },
    };
    const fetchAsset = vi.fn();

    const materialized = await materializeCodeWalkthroughSources(
      [hidden],
      fetchAsset,
    );

    expect(fetchAsset).not.toHaveBeenCalled();
    expect(materialized).toEqual([hidden]);
    expect(materialized[0].codeWalkthrough.examples[0]).not.toHaveProperty(
      'code',
    );
  });

  it('validates every path before fetching any source', async () => {
    const fetchAsset = vi.fn();

    await expect(
      materializeCodeWalkthroughSources(
        [
          {
            id: 'valid-recipe',
            codeWalkthrough: {
              examples: [{ source: 'src/request.ts' }],
            },
          },
          {
            id: 'unsafe-recipe',
            codeWalkthrough: {
              examples: [{ source: '../secret.ts' }],
            },
          },
        ],
        fetchAsset,
      ),
    ).rejects.toThrow(/normalized relative path inside the recipe directory/);
    expect(fetchAsset).not.toHaveBeenCalled();
  });

  it('rejects oversized, binary, and empty source files', async () => {
    const entry = {
      id: 'source-backed',
      codeWalkthrough: {
        examples: [{ source: 'src/request.ts' }],
      },
    };

    await expect(
      materializeCodeWalkthroughSources([entry], async () =>
        Buffer.alloc(30_001, 'a'),
      ),
    ).rejects.toThrow(/exceeds 30000 bytes/);
    await expect(
      materializeCodeWalkthroughSources([entry], async () =>
        Buffer.from([0xc3, 0x28]),
      ),
    ).rejects.toThrow(/valid UTF-8/);
    await expect(
      materializeCodeWalkthroughSources([entry], async () => Buffer.from('')),
    ).rejects.toThrow(/non-empty text/);
  });

  it('overwrites embedded code with the fetched source', async () => {
    const [entry] = await materializeCodeWalkthroughSources(
      [
        {
          id: 'source-backed',
          codeWalkthrough: {
            examples: [
              {
                source: 'src/request.ts',
                code: 'untrusted registry content',
              },
            ],
          },
        },
      ],
      async () => Buffer.from('export const trusted = true;\n'),
    );

    expect(entry.codeWalkthrough.examples[0].code).toBe(
      'export const trusted = true;\n',
    );
  });
});

describe('syncPreviewAssets', () => {
  it('copies only declared cookbook previews into the generated static tree', async () => {
    const output = fs.mkdtempSync(path.join(os.tmpdir(), 'cookbook-previews-'));
    const requested: string[] = [];
    try {
      const count = await syncPreviewAssets(
        [
          {
            id: 'company-answers',
            preview: {
              path: 'recipes/company-answers/assets/preview.webp',
            },
          },
          { id: 'server-only' },
        ],
        async (sourcePath: string) => {
          requested.push(sourcePath);
          return Buffer.from('RIFFxxxxWEBPpayload');
        },
        output,
      );

      expect(count).toBe(1);
      expect(requested).toEqual([
        'recipes/company-answers/assets/preview.webp',
      ]);
      expect(
        fs.readFileSync(
          path.join(output, 'company-answers', 'preview.webp'),
          'utf8',
        ),
      ).toBe('RIFFxxxxWEBPpayload');
      expect(fs.existsSync(path.join(output, 'server-only'))).toBe(false);
    } finally {
      fs.rmSync(output, { recursive: true, force: true });
    }
  });

  it('does not copy previews for hidden recipes when given the listed set', async () => {
    const output = fs.mkdtempSync(path.join(os.tmpdir(), 'cookbook-previews-'));
    const requested: string[] = [];
    try {
      const count = await syncPreviewAssets(
        listedRecipes([
          {
            id: 'company-answers',
            preview: {
              path: 'recipes/company-answers/assets/preview.webp',
            },
          },
          {
            id: 'wip',
            hidden: true,
            preview: {
              path: 'recipes/wip/assets/preview.webp',
            },
          },
        ]),
        async (sourcePath: string) => {
          requested.push(sourcePath);
          return Buffer.from('RIFFxxxxWEBPpayload');
        },
        output,
      );

      expect(count).toBe(1);
      expect(requested).toEqual([
        'recipes/company-answers/assets/preview.webp',
      ]);
      expect(fs.existsSync(path.join(output, 'wip'))).toBe(false);
    } finally {
      fs.rmSync(output, { recursive: true, force: true });
    }
  });

  it('rejects a preview outside its recipe asset directory', async () => {
    const output = fs.mkdtempSync(path.join(os.tmpdir(), 'cookbook-previews-'));
    try {
      await expect(
        syncPreviewAssets(
          [
            {
              id: 'company-answers',
              preview: { path: 'recipes/other/assets/preview.webp' },
            },
          ],
          async () => Buffer.from('RIFFxxxxWEBPpayload'),
          output,
        ),
      ).rejects.toThrow(/preview\.path/);
    } finally {
      fs.rmSync(output, { recursive: true, force: true });
    }
  });
});
