import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecipeIndex from './RecipeIndex';
import RecipeLayout from './RecipeLayout';
import FlagshipCard from './FlagshipCard';
import type { RecipeRecord } from '../../types/recipe';

function makeRecipe(overrides: Partial<RecipeRecord>): RecipeRecord {
  return {
    id: 'embed-search-chat',
    title: 'Embed search & chat',
    summary: 'Put Glean search and chat inside an internal app.',
    permalink: '/cookbook/embed-search-chat',
    surfaces: ['web-sdk'],
    status: 'production-pattern',
    category: 'search',
    level: 'Beginner',
    levels: { minimal: true, wow: true },
    time_estimate: '~15 min (minimal)',
    required_scopes: ['SEARCH'],
    prerequisites: ['A Glean instance'],
    demo_queries: [],
    code_assets: [],
    scaffold_actions: [],
    ai_prompt: 'Build the recipe.',
    go_dependency: false,
    featured: false,
    tags: [],
    ...overrides,
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

  it('filters via a single-select chip and hides the flagship when unmatched', async () => {
    const user = userEvent.setup();
    render(<RecipeIndex {...props} />);

    await user.click(screen.getByRole('button', { name: 'Indexing API' }));
    expect(screen.queryByText('Embed search & chat')).not.toBeInTheDocument();
    expect(screen.queryByText('End-to-end build')).not.toBeInTheDocument();
    expect(screen.getByText('1 recipe')).toBeInTheDocument();

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
});

describe('RecipeLayout', () => {
  it('renders the banner, meta pills, and rail from the record', () => {
    render(
      <RecipeLayout
        recipe={makeRecipe({
          required_scopes: ['SEARCH', 'CHAT'],
          code_assets: [
            {
              repo_path: 'recipes/embed-search-chat/minimal',
              language: 'TypeScript',
              description: 'Starter repo',
            },
          ],
        })}
      >
        <p>Body content</p>
      </RecipeLayout>,
    );

    expect(
      screen.getByRole('button', { name: /Run minimal demo/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('Scaffold starter code')).toBeInTheDocument();
    expect(screen.getByText('SEARCH')).toBeInTheDocument();
    expect(screen.getByText('CHAT')).toBeInTheDocument();
    expect(screen.getByText('Starter repo')).toBeInTheDocument();
    expect(screen.getByText('At a glance')).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });
});
