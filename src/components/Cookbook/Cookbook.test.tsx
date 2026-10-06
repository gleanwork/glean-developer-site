import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeatureFlagsContext } from '@site/src/theme/Root';
import { tenantProfileStore } from '@site/src/lib/tenantProfile';
import recipesData from '@site/src/data/recipes.json';
import RecipeIndex from './RecipeIndex';
import RecipeLayout, {
  humanizeStepCommands,
  RecipeArchitecture,
  RecipeCodeWalkthrough,
  RecipeDemoQueries,
  RecipePrereqs,
  RecipeSection,
  RecipeSteps,
  TakeItFurther,
} from './RecipeLayout';
import RecipeShowcaseCarousel, {
  selectShowcaseRecipes,
} from './RecipeShowcaseCarousel';
import type { RecipeRecord } from '../../types/recipe';
import type { AuthKind } from './authContexts';
import catStyles from './categories.module.css';
import layoutStyles from './RecipeLayout.module.css';

vi.mock('@theme/CodeBlock', () => ({
  default: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title?: string;
  }) => (
    <div>
      {title ? <span>{title}</span> : null}
      <button aria-label="Copy code to clipboard" type="button">
        Copy
      </button>
      <pre>
        <code>{children}</code>
      </pre>
    </div>
  ),
}));

const routerState = vi.hoisted(() => ({
  location: { pathname: '/cookbook', search: '' },
  push: vi.fn((next: { pathname: string; search: string }) => {
    routerState.location = next;
  }),
}));

vi.mock('@docusaurus/router', () => ({
  useHistory: () => ({ push: routerState.push }),
  useLocation: () => routerState.location,
}));

beforeEach(() => {
  routerState.location = { pathname: '/cookbook', search: '' };
  routerState.push.mockClear();
});

function renderWithTenantFlag(ui: React.ReactElement, enabled = true) {
  return render(
    <FeatureFlagsContext.Provider
      value={
        {
          isEnabled: (flag: string) =>
            enabled && flag === 'tenant-api-personalization',
          flagConfigs: {},
        } as React.ContextType<typeof FeatureFlagsContext>
      }
    >
      {ui}
    </FeatureFlagsContext.Provider>,
  );
}

function readCss(fileName: string): string {
  return fs.readFileSync(path.resolve(__dirname, fileName), 'utf8');
}

function makeRecipe(overrides: Partial<RecipeRecord>): RecipeRecord {
  return {
    id: 'embed-search-chat',
    title: 'Embed search & chat',
    description: 'Put Glean search and chat inside an internal app.',
    permalink: '/cookbook/embed-search-chat',
    surfaces: ['web-sdk'],
    capabilities: ['search', 'embed'],
    status: 'production-pattern',
    visibility: 'public',
    category: 'search',
    level: 'Beginner',
    levels: { minimal: true, wow: true },
    timeEstimate: '~15 min (minimal)',
    requiredScopes: ['SEARCH'],
    // Both are required on RecipeRecord. The `...overrides` spread below
    // defeats TypeScript's missing-property check on this literal, so leaving
    // them out compiled fine while silently exercising `undefined`.
    authMethod: ['web-sdk-cookie'],
    buildMethod: 'integrate',
    prerequisites: ['A Glean instance'],
    demoQueries: [],
    codeAssets: [],
    scaffoldActions: [],
    aiPrompt: 'Build the recipe.',
    goDependency: false,
    hidden: false,
    tags: [],
    ...overrides,
  };
}

function dualPathAsset(
  slug: string,
  scopes: string[],
  kind: AuthKind = 'oauth-with-token-fallback',
): NonNullable<RecipeRecord['codeAssets']>[number] {
  return {
    repoPath: `recipes/customer-360/${slug}`,
    language: 'typescript',
    description: `The ${slug} path`,
    execution: {
      type: 'local-web',
      questions: [],
      auth: [
        {
          kind,
          scopes,
          setupCommand: 'cd customer-360 && npm run login',
        },
      ],
      verification: {
        kind: 'automated',
        command: 'cd customer-360 && npm run verify',
        expectedDuration: '1–3 minutes',
        startsOwnServer: true,
      },
    },
  };
}

const flagship = makeRecipe({
  id: 'build-engineering-portal',
  title: 'Build an engineering portal',
  permalink: '/cookbook/build-engineering-portal',
  surfaces: ['connector-sdk', 'web-sdk'],
  category: 'portal',
  level: 'Advanced',
  tags: ['flagship'],
  combines: [
    {
      title: 'Index a developer catalog',
      surface: 'Connector SDK',
      category: 'index',
    },
    {
      title: 'Embed search into the portal',
      surface: 'Web SDK',
      category: 'search',
    },
    {
      title: 'Ground chat in the catalog',
      surface: 'Platform API',
      category: 'mcp',
    },
  ],
});

const searchQuickstart = makeRecipe({
  id: 'search-with-discovered-filters',
  title: 'Search Glean with discovered filters',
  permalink: '/cookbook/search-with-discovered-filters',
  surfaces: ['platform-api'],
  capabilities: ['search'],
  status: 'quickstart',
});

const recipes = [
  makeRecipe({}),
  makeRecipe({
    id: 'index-custom-source',
    title: 'Index a custom data source',
    permalink: '/cookbook/index-custom-source',
    surfaces: ['connector-sdk', 'indexing-api'],
    capabilities: ['indexing'],
    category: 'index',
    level: 'Intermediate',
  }),
  searchQuickstart,
  flagship,
];

// Path order deliberately differs from title order, so the tests prove the
// index and carousel follow the authored collection, not a sort.
const collections = [
  {
    id: 'search',
    label: 'Search',
    description: 'Search recipes, from one query to an embedded experience.',
    recipes: ['search-with-discovered-filters', 'embed-search-chat'],
  },
  {
    id: 'indexing',
    label: 'Indexing',
    description: 'Bring your own content into Glean.',
    recipes: ['index-custom-source'],
  },
  {
    id: 'complete-apps',
    label: 'Complete apps',
    description: 'End-to-end builds that combine features.',
    recipes: ['build-engineering-portal'],
  },
];

describe('RecipeIndex', () => {
  const props = {
    recipes,
    collections,
    capabilities: ['search', 'indexing', 'embed', 'chat'] as const,
    surfaces: [
      'platform-api',
      'web-sdk',
      'connector-sdk',
      'indexing-api',
    ] as const,
  };

  function section(name: string): HTMLElement {
    return screen.getByRole('region', { name });
  }

  it('renders a starter carousel followed by one section per collection, in order', () => {
    render(<RecipeIndex {...props} />);

    expect(
      screen.getByText('Recipes for building on Glean'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Starter recipes' }),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent)
        .filter((name) =>
          ['Search', 'Indexing', 'Complete apps'].includes(name ?? ''),
        ),
    ).toEqual(['Search', 'Indexing', 'Complete apps']);
    expect(
      within(section('Search')).getByText(
        'Search recipes, from one query to an embedded experience.',
      ),
    ).toBeInTheDocument();
    expect(
      within(section('Search')).getByText('2 recipes · Beginner'),
    ).toBeInTheDocument();
    expect(screen.getByText('4 recipes')).toBeInTheDocument();
  });

  it('lists each collection in path order with each recipe\u2019s position', () => {
    render(<RecipeIndex {...props} />);

    const cards = within(section('Search')).getAllByRole('link');
    expect(cards.map((card) => card.getAttribute('href'))).toEqual([
      '/cookbook/search-with-discovered-filters',
      '/cookbook/embed-search-chat',
    ]);
    expect(within(cards[0]).getByText('1 of 2')).toBeInTheDocument();
    expect(within(cards[1]).getByText('2 of 2')).toBeInTheDocument();
    expect(
      within(section('Complete apps')).getByText('1 of 1'),
    ).toBeInTheDocument();
  });

  it('keeps a recipe\u2019s path position when filters hide the rest of its collection', async () => {
    const user = userEvent.setup();
    render(<RecipeIndex {...props} />);

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Surface' }),
      'web-sdk',
    );
    expect(screen.getByText('2 recipes')).toBeInTheDocument();
    expect(within(section('Search')).getByText('2 of 2')).toBeInTheDocument();
    expect(
      within(section('Search')).queryByText(
        'Search Glean with discovered filters',
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Indexing' }),
    ).not.toBeInTheDocument();
  });

  it('filters by capability and implementation surface with intersection semantics', async () => {
    const user = userEvent.setup();
    render(<RecipeIndex {...props} />);

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Capability' }),
      'search',
    );
    expect(screen.getByText('Embed search & chat')).toBeInTheDocument();
    expect(
      screen.queryByText('Index a custom data source'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('3 recipes')).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Surface' }),
      'platform-api',
    );
    expect(
      within(section('Search')).queryByText('Embed search & chat'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('1 recipe')).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Capability' }),
      'all',
    );
    expect(screen.getByText('1 recipe')).toBeInTheDocument();
  });

  it('initializes valid URL filters and recovers from unknown values', () => {
    routerState.location = {
      pathname: '/cookbook',
      search: '?capability=search&surface=platform-api',
    };
    const { rerender } = render(<RecipeIndex {...props} />);
    expect(screen.getByText('1 recipe')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Capability' })).toHaveValue(
      'search',
    );

    routerState.location = {
      pathname: '/cookbook',
      search: '?capability=unknown&surface=unknown',
    };
    rerender(<RecipeIndex {...props} />);
    expect(screen.getByText('4 recipes')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Capability' })).toHaveValue(
      'all',
    );
  });

  it('restores filters when browser navigation changes the URL', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<RecipeIndex {...props} />);

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Capability' }),
      'search',
    );
    expect(routerState.push).toHaveBeenLastCalledWith({
      pathname: '/cookbook',
      search: '?capability=search',
    });

    routerState.location = { pathname: '/cookbook', search: '' };
    rerender(<RecipeIndex {...props} />);
    expect(screen.getByText('4 recipes')).toBeInTheDocument();
  });

  it('reveals preview recipes with the preview-content flag and links to their permalinks', async () => {
    const gatedRecipes = recipes.map((recipe) =>
      recipe.id === searchQuickstart.id
        ? { ...recipe, visibility: 'preview' as const }
        : recipe,
    );
    const { rerender } = render(
      <RecipeIndex {...props} recipes={gatedRecipes} />,
    );

    expect(
      screen.queryByText('Search Glean with discovered filters'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Platform API' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('3 recipes')).toBeInTheDocument();

    routerState.location = {
      pathname: '/cookbook',
      search: '?ff_preview-content=true',
    };
    rerender(<RecipeIndex {...props} recipes={gatedRecipes} />);
    expect(await screen.findByText('4 recipes')).toBeInTheDocument();

    const previewLinks = screen
      .getAllByRole('link')
      .filter((link) =>
        link.getAttribute('href')?.includes('search-with-discovered-filters'),
      );
    expect(previewLinks).not.toHaveLength(0);
    for (const link of previewLinks) {
      expect(link).toHaveAttribute(
        'href',
        '/cookbook/search-with-discovered-filters',
      );
    }
    expect(
      screen.getByRole('option', { name: 'Platform API' }),
    ).toBeInTheDocument();
    expect(screen.getByText('4 recipes')).toBeInTheDocument();
  });

  it('uses scalable dropdown controls instead of a growing chip matrix', () => {
    render(<RecipeIndex {...props} />);

    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(2);
    expect(
      selects.every((select) => select.classList.contains('gdt-select')),
    ).toBe(true);
    expect(
      screen.getByRole('combobox', { name: 'Capability' }),
    ).toHaveDisplayValue('All capabilities');
    expect(
      screen.getByRole('combobox', { name: 'Surface' }),
    ).toHaveDisplayValue('All surfaces');
    expect(
      screen.queryByRole('button', { name: 'Search' }),
    ).not.toBeInTheDocument();

    const css = readCss('RecipeIndex.module.css');
    expect(css).not.toMatch(/\.filterSelect\s*\{/);
    expect(css).not.toMatch(/\.filterGroup::after\s*\{/);
    expect(css).toMatch(
      /\.filterBar\s*\{[^}]*background:\s*var\(--gdt-bg-light\)[^}]*border-radius:/s,
    );
    expect(css).toMatch(
      /\.filterControls\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*repeat\(2,/s,
    );
    expect(css).not.toMatch(/overflow-x:\s*(auto|scroll)/);
  });

  it('shows the empty state when no recipes exist', () => {
    render(
      <RecipeIndex
        recipes={[]}
        collections={[]}
        capabilities={[]}
        surfaces={[]}
      />,
    );
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });
});

describe('RecipeShowcaseCarousel', () => {
  it('starts every generated collection with its first public recipe', () => {
    const publicRecipes = recipesData.recipes.filter(
      (recipe) => recipe.visibility === 'public',
    ) as RecipeRecord[];
    const slides = selectShowcaseRecipes(
      publicRecipes,
      recipesData.collections,
    );
    expect(slides.map(({ collection }) => collection.id)).toEqual(
      recipesData.collections.map((collection) => collection.id),
    );
    for (const { collection, recipe } of slides) {
      expect(recipe.id).toBe(
        collection.recipes.find((id) =>
          publicRecipes.some((candidate) => candidate.id === id),
        ),
      );
    }
  });

  it('skips a starter the reader cannot open', () => {
    const withoutQuickstart = recipes.filter(
      (recipe) => recipe.id !== searchQuickstart.id,
    );
    expect(
      selectShowcaseRecipes(withoutQuickstart, collections).map(
        ({ recipe }) => recipe.id,
      ),
    ).toEqual([
      'embed-search-chat',
      'index-custom-source',
      'build-engineering-portal',
    ]);
  });

  it('moves through one starter per collection in collection order', async () => {
    const user = userEvent.setup();
    render(
      <RecipeShowcaseCarousel collections={collections} recipes={recipes} />,
    );

    expect(
      screen.getByRole('region', { name: 'Starter recipes' }),
    ).toHaveAttribute('aria-roledescription', 'carousel');
    expect(screen.getByText('Start here · Search')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Search Glean with discovered filters',
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: 'Pause starter recipe rotation',
      }),
    );
    expect(
      screen.getByRole('button', {
        name: 'Resume starter recipe rotation',
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next recipe' }));
    expect(screen.getByText('Start here · Indexing')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Index a custom data source',
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next recipe' }));
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Build an engineering portal',
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous recipe' }));
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Index a custom data source',
      }),
    ).toBeInTheDocument();
  });

  it('uses a rounded, bordered, responsive showcase treatment', () => {
    const css = readCss('RecipeShowcaseCarousel.module.css');
    expect(css).toMatch(
      /\.carousel\s*\{[^}]*border:\s*1px solid var\(--gdt-border-light\)[^}]*border-radius:\s*22px/s,
    );
    expect(css).toMatch(/@media \(max-width:\s*900px\)/);
    expect(css).toMatch(/@media \(prefers-reduced-motion:\s*reduce\)/);
  });
});

const plugin = {
  marketplaceName: 'glean-cookbook',
  pluginName: 'cookbook',
  repo: 'gleanwork/glean-cookbook',
};

describe('RecipeLayout', () => {
  it('renders a declared code walkthrough before runnable setup steps', () => {
    render(
      <RecipeLayout
        plugin={plugin}
        recipe={makeRecipe({
          codeWalkthrough: {
            intro: 'Read the implementation before running it.',
            examples: [
              {
                title: 'Build a request',
                description: 'Keep the request typed and explicit.',
                source: 'src/request.ts',
                language: 'typescript',
                code: 'export const request = { pageSize: 10 };',
              },
            ],
          },
          steps: [
            {
              kind: 'install',
              title: 'Install dependencies',
              command: 'npm install',
            },
          ],
        })}
      >
        <RecipeCodeWalkthrough />
        <RecipeSteps />
      </RecipeLayout>,
    );

    expect(screen.getByText('Code walkthrough')).toBeInTheDocument();
    expect(
      screen.getByText('Read the implementation before running it.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Build a request')).toBeInTheDocument();
    expect(
      screen.getByText('export const request = { pageSize: 10 };'),
    ).toBeInTheDocument();
    expect(screen.getByText('Run it yourself')).toBeInTheDocument();
    expect(screen.getByText('Install dependencies')).toBeInTheDocument();
  });

  it('renders each walkthrough command as a copyable Bash block', () => {
    render(
      <RecipeLayout
        plugin={plugin}
        recipe={makeRecipe({
          buildMethod: 'scaffold',
          steps: [
            {
              kind: 'install',
              title: 'Install dependencies',
              command: 'cd project && npm install',
            },
            {
              kind: 'run',
              title: 'Run the app',
              command: 'cd project && npm start',
            },
          ],
        })}
      >
        <RecipeSteps />
      </RecipeLayout>,
    );

    expect(screen.getByText('cd project && npm install')).toBeInTheDocument();
    expect(screen.getByText('npm start')).toBeInTheDocument();
    expect(
      screen.queryByText('cd project && npm start'),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Copy code to clipboard' }),
    ).toHaveLength(2);
  });

  it('preserves the first directory change and different directories', () => {
    const commands = humanizeStepCommands([
      { title: 'Install', command: 'cd project && npm install' },
      { title: 'Test', command: 'cd project && npm test' },
      { title: 'Other project', command: 'cd other && npm start' },
    ]);

    expect(commands.map((step) => step.command)).toEqual([
      'cd project && npm install',
      'npm test',
      'cd other && npm start',
    ]);
  });

  it('renders a compact preview that opens and closes a full-size dialog', async () => {
    const user = userEvent.setup();
    render(
      <RecipeLayout
        plugin={plugin}
        recipe={makeRecipe({
          preview: {
            path: 'recipes/embed-search-chat/assets/preview.webp',
            alt: 'Embedded search and chat preview',
            caption: 'A permission-aware embedded experience.',
          },
        })}
      >
        <p>Body</p>
      </RecipeLayout>,
    );

    expect(
      screen.getByRole('img', { name: 'Embedded search and chat preview' }),
    ).toHaveAttribute(
      'src',
      '/img/cookbook/previews/embed-search-chat/preview.webp',
    );
    expect(
      screen.getByText('A permission-aware embedded experience.'),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /Open full-size preview/ }),
    );
    const dialog = screen.getByRole('dialog', {
      name: 'Embedded search and chat preview',
    });
    expect(dialog).toHaveAttribute('open');

    await user.click(
      screen.getByRole('button', { name: 'Close full-size preview' }),
    );
    expect(dialog).not.toHaveAttribute('open');
  });

  it('does not render a preview placeholder when none is declared', () => {
    render(
      <RecipeLayout plugin={plugin} recipe={makeRecipe({})}>
        <p>Body</p>
      </RecipeLayout>,
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Open full-size preview/ }),
    ).not.toBeInTheDocument();
  });

  it('renders the banner, meta pills, and rail from the record', () => {
    render(
      <RecipeLayout
        plugin={plugin}
        recipe={makeRecipe({
          requiredScopes: ['SEARCH', 'CHAT'],
          codeAssets: [
            {
              repoPath: 'recipes/embed-search-chat/minimal',
              language: 'TypeScript',
              description: 'Starter repo',
            },
          ],
        })}
      >
        <p>Body content</p>
      </RecipeLayout>,
    );

    // View source points at the recipe directory, not codeAssets[0]: recipes
    // with a variant split have several assets, and there is no longer a
    // separate card listing the rest.
    expect(screen.getByText('View source').closest('a')).toHaveAttribute(
      'href',
      'https://github.com/gleanwork/glean-cookbook/tree/main/recipes/embed-search-chat',
    );
    expect(screen.queryByText('Code assets')).not.toBeInTheDocument();
    expect(screen.getByText('SEARCH')).toBeInTheDocument();
    expect(screen.getByText('CHAT')).toBeInTheDocument();
    const glance = screen.getByText('At a glance').parentElement!;
    expect(glance).toHaveTextContent('CapabilitiesSearch, Embed');
    expect(glance).toHaveTextContent('StatusProduction pattern');
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('suppresses public plugin actions for preview scaffold recipes', () => {
    render(
      <RecipeLayout
        plugin={plugin}
        recipe={makeRecipe({
          buildMethod: 'scaffold',
          visibility: 'preview',
        })}
      >
        <p>Body</p>
      </RecipeLayout>,
    );

    expect(
      screen.queryByRole('button', { name: /Run this recipe/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'Preview recipes are not included in the public cookbook plugin.',
      ),
    ).toBeInTheDocument();
  });

  it('offers the plugin run button for scaffold recipes, not a prompt copy', async () => {
    const user = userEvent.setup();
    render(
      <RecipeLayout
        plugin={plugin}
        recipe={makeRecipe({ buildMethod: 'scaffold' })}
      >
        <p>Body</p>
      </RecipeLayout>,
    );

    const run = screen.getByRole('button', { name: /Run this recipe/ });
    expect(run).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/Copy assistant prompt/)).not.toBeInTheDocument();

    await user.click(run);
    expect(run).toHaveAttribute('aria-expanded', 'true');

    // Claude Code is the default host; both commands come from the synced
    // plugin coordinates rather than a hardcoded name.
    expect(
      screen.getByText(/claude plugin install cookbook@glean-cookbook/),
    ).toBeInTheDocument();
    expect(screen.getByText('/cookbook:embed-search-chat')).toBeInTheDocument();

    // Each command is its own copy field. Joining the two install commands
    // into one block would hand someone a multi-line paste where either half
    // can fail independently.
    const marketplaceAdd = screen.getByText(
      'claude plugin marketplace add gleanwork/glean-cookbook',
    );
    expect(marketplaceAdd.textContent).not.toContain('plugin install');
    expect(
      screen.getAllByRole('button', { name: /Copy to clipboard/ }),
    ).toHaveLength(3);
  });

  it('presents terminal and in-session setup as a choice, not extra steps', async () => {
    const user = userEvent.setup();
    render(
      <RecipeLayout
        plugin={plugin}
        recipe={makeRecipe({ buildMethod: 'scaffold' })}
      >
        <p>Body</p>
      </RecipeLayout>,
    );
    await user.click(screen.getByRole('button', { name: /Run this recipe/ }));

    // Only the selected path's commands are shown — otherwise a reader sees
    // four commands and can't tell that two of them are an alternative.
    expect(
      screen.getByText(
        'claude plugin marketplace add gleanwork/glean-cookbook',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('/plugin marketplace add gleanwork/glean-cookbook'),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'In Claude Code' }));
    expect(
      screen.getByText('/plugin marketplace add gleanwork/glean-cookbook'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        'claude plugin marketplace add gleanwork/glean-cookbook',
      ),
    ).not.toBeInTheDocument();
  });

  it('offers no install-path choice for a host that only has one', async () => {
    const user = userEvent.setup();
    render(
      <RecipeLayout
        plugin={plugin}
        recipe={makeRecipe({ buildMethod: 'scaffold' })}
      >
        <p>Body</p>
      </RecipeLayout>,
    );
    await user.click(screen.getByRole('button', { name: /Run this recipe/ }));
    await user.click(screen.getByRole('tab', { name: /Cursor/ }));

    expect(
      screen.queryByRole('button', { name: 'Terminal' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Import from Repo/)).toBeInTheDocument();
  });

  it('switches host, and each host gets its own install and invoke syntax', async () => {
    const user = userEvent.setup();
    render(
      <RecipeLayout
        plugin={plugin}
        recipe={makeRecipe({ buildMethod: 'scaffold' })}
      >
        <p>Body</p>
      </RecipeLayout>,
    );
    await user.click(screen.getByRole('button', { name: /Run this recipe/ }));

    await user.click(screen.getByRole('tab', { name: /Codex/ }));
    expect(
      screen.getByText(/codex plugin add cookbook@glean-cookbook/),
    ).toBeInTheDocument();
    // Codex uses $, not the / prefix Claude Code and Cursor use.
    expect(screen.getByText('$embed-search-chat')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Cursor/ }));
    // Cursor has no plugin CLI at all — UI steps instead of a command.
    expect(screen.queryByText(/cursor plugin/)).not.toBeInTheDocument();
    expect(screen.getByText(/Import from Repo/)).toBeInTheDocument();
    expect(screen.getByText('/embed-search-chat')).toBeInTheDocument();
  });

  it('does not render a category tile beside the title', () => {
    render(
      <RecipeLayout plugin={plugin} recipe={makeRecipe({})}>
        <p>Body</p>
      </RecipeLayout>,
    );

    expect(
      screen.getByRole('heading', { name: 'Embed search & chat' }),
    ).toBeInTheDocument();
    expect(document.querySelector(`.${catStyles.tile}`)).toBeNull();
  });

  it('renders architecture in a horizontally scrollable canvas', () => {
    render(
      <RecipeLayout
        plugin={plugin}
        recipe={makeRecipe({
          architecture: [
            {
              label: 'App',
              caption: 'frontend',
              emphasized: false,
            },
            {
              label: 'Glean',
              caption: 'index',
              emphasized: true,
            },
            {
              label: 'Auth',
              caption: 'SSO',
              emphasized: false,
            },
            {
              label: 'Portal',
              caption: 'UI',
              emphasized: false,
            },
          ],
        })}
      >
        <RecipeArchitecture />
      </RecipeLayout>,
    );

    expect(screen.getByText('Architecture')).toBeInTheDocument();
    expect(screen.getByText('App')).toBeInTheDocument();
    expect(screen.getByText('Portal')).toBeInTheDocument();
    expect(
      document.querySelector(`.${layoutStyles.archCanvas}`),
    ).not.toBeNull();
  });

  it('scrolls the flowchart horizontally instead of stacking it', () => {
    const css = readCss('RecipeLayout.module.css');
    expect(css).toMatch(/\.archCanvas\s*\{[^}]*overflow-x:\s*auto/s);
    expect(css).toMatch(/\.archNode\s*\{[^}]*flex:\s*1 0 /s);
    expect(css).not.toMatch(
      /@media \(max-width: 700px\)[\s\S]*\.archFlow\s*\{[\s\S]*flex-direction:\s*column/,
    );
  });

  it('every recipe page goes through RecipePage, so title layout applies to all of them', () => {
    const dir = path.resolve(__dirname, '../../../docs/cookbook');
    const files = fs
      .readdirSync(dir)
      .filter((file) => file.endsWith('.mdx') && file !== 'index.mdx');
    expect(files).toHaveLength(recipesData.recipes.length);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const src = fs.readFileSync(path.join(dir, file), 'utf8');
      expect(src).toContain('<RecipePage recipeId=');
    }
  });

  it('keeps copy-prompt for recipes whose mechanism really is prose', () => {
    render(
      <RecipeLayout
        plugin={plugin}
        recipe={makeRecipe({ buildMethod: 'third-party-build' })}
      >
        <p>Body</p>
      </RecipeLayout>,
    );

    expect(
      screen.getByRole('button', { name: /Copy assistant prompt/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Run this recipe/)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Paste into Claude Code, Cursor, or Codex/),
    ).toBeInTheDocument();
  });

  it('copies the builder prompt for third-party recipes that ship one', async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);
    render(
      <RecipeLayout
        plugin={plugin}
        recipe={makeRecipe({
          buildMethod: 'third-party-build',
          pasteTarget: 'Lovable',
          pastePrompt: 'Build the IT page.',
          aiPrompt: 'This is the assistant prompt and must not be copied.',
        })}
      >
        <p>Body</p>
      </RecipeLayout>,
    );

    expect(
      screen.getByRole('button', { name: /Copy Lovable prompt/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Paste into a new private Lovable project/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Copy assistant prompt/)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /Copy Lovable prompt/ }),
    );
    expect(writeText).toHaveBeenCalledWith('Build the IT page.');
  });

  it('renders backtick spans in structured steps as inline code', () => {
    render(
      <RecipeLayout
        plugin={plugin}
        recipe={makeRecipe({
          steps: [
            {
              title: 'Copy your instance name',
              description:
                'Open `https://app.glean.com/admin/about-glean` and copy `acme`.',
            },
          ],
        })}
      >
        <RecipeSteps />
      </RecipeLayout>,
    );

    expect(
      screen.getByText('https://app.glean.com/admin/about-glean').tagName,
    ).toBe('CODE');
    expect(screen.getByText('acme').tagName).toBe('CODE');
  });

  it('renders **bold** spans in structured steps as strong text', () => {
    render(
      <RecipeLayout
        plugin={plugin}
        recipe={makeRecipe({
          steps: [
            {
              title: 'Publish the agent',
              description: 'Click **Publish**, then copy the **Agent ID**.',
            },
          ],
        })}
      >
        <RecipeSteps />
      </RecipeLayout>,
    );

    expect(screen.getByText('Publish').tagName).toBe('STRONG');
    expect(screen.getByText('Agent ID').tagName).toBe('STRONG');
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument();
  });

  it('renders backticks in banner, walkthrough, architecture, and prereqs as code', () => {
    render(
      <RecipeLayout
        plugin={plugin}
        recipe={makeRecipe({
          description: "Use the client's `createStream` `EventStream`.",
          codeWalkthrough: {
            intro: 'The scaffold uses `glean.chat.createStream`.',
            examples: [
              {
                title: 'Iterate `createStream` events',
                description: 'For-await the typed `EventStream`.',
                source: 'src/stream.ts',
                language: 'typescript',
                code: 'await client.chat.createStream({});',
              },
            ],
          },
          architecture: [
            {
              label: '`createStream`',
              caption: 'typed `EventStream`',
              emphasized: true,
            },
          ],
          prerequisites: ['The steps use `npx` and `npm`.'],
          demoQueries: [
            {
              query: 'What is the PTO policy?',
              expectedBehavior:
                'Returns a streamed response with a `conversation_id`.',
            },
          ],
          preview: {
            path: 'recipes/embed-search-chat/assets/preview.webp',
            alt: 'Preview',
            caption: 'A `createStream` session with citations.',
          },
        })}
      >
        <RecipeCodeWalkthrough />
        <RecipeArchitecture />
        <RecipePrereqs />
        <RecipeDemoQueries />
      </RecipeLayout>,
    );

    const banner = document.querySelector(`.${layoutStyles.bannerDesc}`);
    expect(banner?.querySelectorAll('code')).toHaveLength(2);
    expect(banner?.textContent).toBe(
      "Use the client's createStream EventStream.",
    );
    expect(screen.getByText('glean.chat.createStream').tagName).toBe('CODE');
    expect(
      screen
        .getByRole('heading', { name: 'Iterate createStream events' })
        .querySelector('code')?.textContent,
    ).toBe('createStream');
    expect(
      document.querySelector(`.${layoutStyles.archCaption} code`)?.textContent,
    ).toBe('EventStream');
    expect(
      document.querySelector(`.${layoutStyles.archLabel} code`)?.textContent,
    ).toBe('createStream');
    expect(screen.getByText('npx').tagName).toBe('CODE');
    expect(screen.getByText('conversation_id').tagName).toBe('CODE');
    expect(
      document.querySelector(`.${layoutStyles.previewDialogCaption} code`)
        ?.textContent,
    ).toBe('createStream');
  });

  it('renders RecipeSection labels and string children as inline code', () => {
    render(
      <RecipeLayout plugin={plugin} recipe={makeRecipe({})}>
        <RecipeSection label="`createStream` is SDK-only">
          SDK callers use `createStream()` instead of setting `stream`.
        </RecipeSection>
      </RecipeLayout>,
    );

    expect(
      document.querySelector(`.${layoutStyles.sectionLabel} code`)?.textContent,
    ).toBe('createStream');
    expect(screen.getByText('createStream()').tagName).toBe('CODE');
    expect(screen.getByText('stream').tagName).toBe('CODE');
    expect(screen.queryByText(/`createStream`/)).not.toBeInTheDocument();
  });

  it('renders TakeItFurther markdown list strings as inline code', () => {
    render(
      <RecipeLayout plugin={plugin} recipe={makeRecipe({})}>
        <TakeItFurther>
          {`- Persist \`conversation_id\` in a session.
- Add cancellation with \`AbortController\`.`}
        </TakeItFurther>
      </RecipeLayout>,
    );

    expect(screen.getByText('conversation_id').tagName).toBe('CODE');
    expect(screen.getByText('AbortController').tagName).toBe('CODE');
    expect(screen.queryByText(/`conversation_id`/)).not.toBeInTheDocument();
  });

  it('renders TakeItFurther list item children as inline code', () => {
    render(
      <RecipeLayout plugin={plugin} recipe={makeRecipe({})}>
        <TakeItFurther>
          <ul>
            <li>Render spans using `start_index` and `end_index`.</li>
          </ul>
        </TakeItFurther>
      </RecipeLayout>,
    );

    expect(screen.getByText('start_index').tagName).toBe('CODE');
    expect(screen.getByText('end_index').tagName).toBe('CODE');
  });

  it('shows the email lookup on third-party recipes when tenant personalization is on', async () => {
    tenantProfileStore.clear();
    renderWithTenantFlag(
      <RecipeLayout
        plugin={plugin}
        recipe={makeRecipe({
          buildMethod: 'third-party-build',
          steps: [
            {
              title: 'Copy your instance name',
              description:
                'Copy the instance name from the lookup on this page.',
            },
          ],
        })}
      >
        <RecipeSteps />
      </RecipeLayout>,
    );

    expect(
      await screen.findByText('Find your instance name'),
    ).toBeInTheDocument();
    expect(screen.getByText('Find my API URL')).toBeInTheDocument();
  });

  it('copies the instance slug after a Glean API URL is configured', async () => {
    tenantProfileStore.clear();
    tenantProfileStore.setManualApiUrl('https://acme-be.glean.com');
    renderWithTenantFlag(
      <RecipeLayout
        plugin={plugin}
        recipe={makeRecipe({
          buildMethod: 'third-party-build',
          steps: [
            {
              title: 'Copy your instance name',
              description:
                'Copy the instance name from the lookup on this page.',
            },
          ],
        })}
      >
        <RecipeSteps />
      </RecipeLayout>,
    );

    expect(await screen.findByLabelText('Instance name')).toHaveValue('acme');
  });

  it('links token creation from the rail for hosted-secret recipes', () => {
    render(
      <RecipeLayout
        plugin={plugin}
        recipe={makeRecipe({
          authMethod: ['custom'],
          buildMethod: 'third-party-build',
          requiredScopes: ['CHAT'],
          execution: {
            type: 'external-builder',
            questions: [],
            auth: [
              {
                kind: 'hosted-secret',
                scopes: ['CHAT'],
                credentialVariable: 'GLEAN_API_TOKEN',
              },
            ],
            verification: {
              kind: 'third-party',
              expectedDuration: 'user-mediated',
              startsOwnServer: false,
            },
          },
        })}
      >
        <p>Body</p>
      </RecipeLayout>,
    );

    expect(screen.getByText('Auth')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Token Management' }),
    ).toHaveAttribute(
      'href',
      'https://app.glean.com/admin/platform/tokenManagement?tab=client',
    );
    expect(
      screen.getByRole('link', { name: 'Glean-issued tokens' }),
    ).toHaveAttribute('href', '/api-info/client/authentication/glean-issued');
  });

  it('gives each build path its own scopes rather than the union', () => {
    render(
      <RecipeLayout
        plugin={plugin}
        recipe={makeRecipe({
          authMethod: ['client-api-oauth-or-token'],
          buildMethod: 'scaffold',
          requiredScopes: ['SEARCH', 'CHAT', 'AGENTS'],
          codeAssets: [
            dualPathAsset('platform-search-chat', ['SEARCH', 'CHAT']),
            dualPathAsset('platform-agents', ['SEARCH', 'AGENTS']),
          ],
        })}
      >
        <p>Body</p>
      </RecipeLayout>,
    );

    const auth = screen.getByText('Auth').parentElement!;
    expect(auth).toHaveTextContent('Platform Search Chat');
    expect(auth).toHaveTextContent('(SEARCH, CHAT)');
    expect(auth).toHaveTextContent('Platform Agents');
    expect(auth).toHaveTextContent('(SEARCH, AGENTS)');

    expect(screen.getAllByText('SEARCH')).toHaveLength(2);
    expect(screen.getAllByText('CHAT')).toHaveLength(1);
    expect(screen.getAllByText('AGENTS')).toHaveLength(1);
  });

  it('does not split the rail when both paths need the same scopes', () => {
    render(
      <RecipeLayout
        plugin={plugin}
        recipe={makeRecipe({
          authMethod: ['client-api-oauth-or-token'],
          buildMethod: 'scaffold',
          requiredScopes: ['SEARCH'],
          codeAssets: [
            dualPathAsset('typescript', ['SEARCH']),
            dualPathAsset('python', ['SEARCH']),
          ],
        })}
      >
        <p>Body</p>
      </RecipeLayout>,
    );

    const auth = screen.getByText('Auth').parentElement!;
    expect(auth).not.toHaveTextContent('TypeScript');
    expect(auth).not.toHaveTextContent('Python');
    expect(screen.getAllByText('SEARCH')).toHaveLength(1);
  });

  it('does not put token scopes on a cookie path that declares none', () => {
    render(
      <RecipeLayout
        plugin={plugin}
        recipe={makeRecipe({
          authMethod: ['web-sdk-cookie', 'client-api-oauth-or-token'],
          buildMethod: 'scaffold',
          requiredScopes: ['CHAT'],
          codeAssets: [
            dualPathAsset('web-sdk', [], 'browser-cookie'),
            dualPathAsset('chat-api', ['CHAT']),
          ],
        })}
      >
        <p>Body</p>
      </RecipeLayout>,
    );

    const auth = screen.getByText('Auth').parentElement!;
    expect(auth).toHaveTextContent('Web SDK');
    expect(auth).toHaveTextContent('existing Glean browser session');
    expect(auth).toHaveTextContent('Chat API');

    const scopes = screen.getByText('Required scopes').parentElement!;
    expect(scopes).toHaveTextContent('Chat API');
    expect(scopes).toHaveTextContent('CHAT');
    expect(scopes).not.toHaveTextContent('Web SDK');
  });

  it('does not tell cookie-SSO recipes to mint a token', () => {
    render(
      <RecipeLayout plugin={plugin} recipe={makeRecipe({})}>
        <p>Body</p>
      </RecipeLayout>,
    );

    expect(screen.getByText('Auth')).toBeInTheDocument();
    expect(
      screen.getByText(/existing Glean browser session/),
    ).toBeInTheDocument();
    expect(screen.queryByText('Token Management')).not.toBeInTheDocument();
  });
});
