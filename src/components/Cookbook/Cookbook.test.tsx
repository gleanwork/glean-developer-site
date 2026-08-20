import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecipeIndex from './RecipeIndex';
import RecipeLayout, { RecipeArchitecture } from './RecipeLayout';
import FlagshipCard from './FlagshipCard';
import type { RecipeRecord } from '../../types/recipe';
import type { AuthKind } from './authContexts';
import catStyles from './categories.module.css';
import layoutStyles from './RecipeLayout.module.css';

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
    status: 'production-pattern',
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
    featured: false,
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
  level: 'Intermediate',
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

const recipes = [
  makeRecipe({}),
  makeRecipe({
    id: 'index-custom-source',
    title: 'Index a custom data source',
    permalink: '/cookbook/index-custom-source',
    surfaces: ['connector-sdk', 'indexing-api'],
    category: 'index',
    level: 'Intermediate',
  }),
  flagship,
];

describe('RecipeIndex', () => {
  const props = {
    recipes,
    surfaces: ['web-sdk', 'connector-sdk', 'indexing-api'],
  };

  it('renders the header, flagship hero, and grid cards', () => {
    render(<RecipeIndex {...props} />);
    expect(
      screen.getByText('Recipes for building on Glean'),
    ).toBeInTheDocument();
    // flagship renders as the hero, not a grid card
    expect(screen.getByText('End-to-end build')).toBeInTheDocument();
    expect(screen.getByText('Open the build guide')).toBeInTheDocument();
    expect(screen.getByText('Embed search & chat')).toBeInTheDocument();
    expect(screen.getByText('Index a custom data source')).toBeInTheDocument();
    expect(screen.getByText('3 recipes')).toBeInTheDocument();
  });

  it('filters grid cards via a single-select chip, keeping the flagship pinned', async () => {
    const user = userEvent.setup();
    render(<RecipeIndex {...props} />);

    await user.click(screen.getByRole('button', { name: 'Indexing API' }));
    expect(screen.queryByText('Embed search & chat')).not.toBeInTheDocument();
    expect(screen.getByText('End-to-end build')).toBeInTheDocument();
    expect(screen.getByText('2 recipes')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getByText('End-to-end build')).toBeInTheDocument();
    expect(screen.getByText('3 recipes')).toBeInTheDocument();
  });

  it('shows the empty state when no recipes exist', () => {
    render(<RecipeIndex recipes={[]} surfaces={[]} />);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });
});

describe('FlagshipCard', () => {
  it('renders the combines mini-list', () => {
    render(<FlagshipCard recipe={flagship} />);
    expect(screen.getByText('Combines three recipes')).toBeInTheDocument();
    expect(screen.getByText('Index a developer catalog')).toBeInTheDocument();
    expect(screen.getByText('Ground chat in the catalog')).toBeInTheDocument();
  });

  it('uses the regular light border and a neutral pill', () => {
    const css = readCss('FlagshipCard.module.css');
    expect(css).toMatch(
      /\.card\s*\{[^}]*border:\s*1px solid var\(--gdt-border-light\)/s,
    );
    expect(css).not.toMatch(
      /\.card\s*\{[^}]*border:\s*1\.5px solid var\(--gdt-primary\)/s,
    );
    expect(css).toMatch(/\.pill\s*\{[^}]*background:\s*var\(--gdt-bg-mid\)/s);
    expect(css).not.toMatch(
      /\.pill\s*\{[^}]*background:\s*var\(--gdt-primary\)/s,
    );
  });
});

const plugin = {
  marketplaceName: 'glean-cookbook',
  pluginName: 'cookbook',
  repo: 'gleanwork/glean-cookbook',
};

describe('RecipeLayout', () => {
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
    expect(screen.getByText('At a glance')).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
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
    expect(screen.queryByText(/Copy build prompt/)).not.toBeInTheDocument();

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
    expect(files.length).toBeGreaterThanOrEqual(12);
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
      screen.getByRole('button', { name: /Copy build prompt/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Run this recipe/)).not.toBeInTheDocument();
    expect(screen.getByText(/Lovable or Replit/)).toBeInTheDocument();
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
