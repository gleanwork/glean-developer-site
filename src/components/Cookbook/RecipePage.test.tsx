import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RecipePage from './RecipePage';

const routerState = vi.hoisted(() => ({
  location: {
    pathname: '/cookbook/preview-search',
    search: '',
  },
}));

vi.mock('@docusaurus/router', () => ({
  useLocation: () => routerState.location,
}));

// The Docusaurus parent doc metadata owns a second title entry. Ignore title
// children here so this regression specifically exercises RecipePage's
// post-hydration repair rather than jsdom's handling of nested <title> tags.
vi.mock('@docusaurus/Head', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <>
      {React.Children.toArray(children).filter(
        (child) => !React.isValidElement(child) || child.type !== 'title',
      )}
    </>
  ),
}));

vi.mock('@site/src/data/recipes.json', () => ({
  default: {
    recipes: [
      {
        id: 'preview-search',
        title: 'Preview search',
        description: 'Try the next search recipe.',
        permalink: '/cookbook/preview-search',
        visibility: 'preview',
      },
    ],
    plugin: {},
  },
}));

vi.mock('./RecipeLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

beforeEach(() => {
  document.title = 'preview-search | Glean Developer';
  document.head
    .querySelectorAll('[data-parent-preview-meta]')
    .forEach((element) => element.remove());
  for (const [attribute, key, content] of [
    ['name', 'description', 'Preview-only problem statement'],
    ['property', 'og:title', 'preview-search | Glean Developer'],
    ['property', 'og:description', 'Preview-only problem statement'],
  ]) {
    const meta = document.createElement('meta');
    meta.setAttribute(attribute, key);
    meta.setAttribute('content', content);
    meta.setAttribute('data-parent-preview-meta', 'true');
    document.head.append(meta);
  }
  routerState.location = {
    pathname: '/cookbook/preview-search',
    search: '',
  };
});

describe('RecipePage preview gate', () => {
  it('renders a generic unavailable state without an exact recipe flag', async () => {
    routerState.location.search = '?ff_recipe=preview-searc';

    render(
      <RecipePage recipeId="preview-search">
        <p>Preview-only body</p>
      </RecipePage>,
    );

    expect(
      screen.getByRole('heading', { name: 'Page not found' }),
    ).toBeVisible();
    expect(screen.queryByText('Preview-only body')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(document.title).toBe('Page not found | Glean Developer');
    });
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex,nofollow',
    );
    expect(
      [...document.querySelectorAll('meta[name="description"]')].at(-1),
    ).toHaveAttribute('content', 'The page you requested could not be found.');
    expect(
      [...document.querySelectorAll('meta[property="og:title"]')].at(-1),
    ).toHaveAttribute('content', 'Page not found');
    expect(
      [...document.querySelectorAll('meta[property="og:description"]')].at(-1),
    ).toHaveAttribute('content', 'The page you requested could not be found.');
  });

  it('unlocks an exact repeated flag and ends hydration with the recipe title', async () => {
    routerState.location.search =
      '?ff_recipe=another-recipe&ff_recipe=preview-search';

    render(
      <RecipePage recipeId="preview-search">
        <p>Preview-only body</p>
      </RecipePage>,
    );

    expect(await screen.findByText('Preview-only body')).toBeVisible();
    await waitFor(() => {
      expect(document.title).toBe('Preview search | Glean Developer');
    });
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex,nofollow',
    );
  });
});
