import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CookbookCollectionLink from './CookbookCollectionLink';

vi.mock('@site/src/data/recipes.json', () => ({
  default: {
    recipes: [
      {
        id: 'second',
        title: 'Second recipe',
        level: 'Intermediate',
        timeEstimate: '~20 min (minimal)',
        visibility: 'public',
      },
      {
        id: 'first',
        title: 'First recipe',
        level: 'Beginner',
        timeEstimate: '~5 min',
        visibility: 'public',
      },
      {
        id: 'unreleased',
        title: 'Unreleased recipe',
        level: 'Advanced',
        timeEstimate: '~1 hr',
        visibility: 'preview',
      },
    ],
    collections: [
      {
        id: 'agents',
        label: 'Agents',
        description: 'Agent recipes.',
        recipes: ['first', 'unreleased', 'second'],
      },
      {
        id: 'previews',
        label: 'Previews',
        description: 'Only previews.',
        recipes: ['unreleased'],
      },
    ],
  },
}));

describe('CookbookCollectionLink', () => {
  it('lists the collection’s public recipes in path order and links the collection', () => {
    render(<CookbookCollectionLink collection="agents" />);

    const callout = screen.getByRole('complementary', {
      name: 'Agents recipes',
    });
    expect(
      within(callout).getByRole('link', { name: 'Agents collection →' }),
    ).toHaveAttribute('href', '/cookbook#agents');
    expect(
      within(callout)
        .getAllByRole('listitem')
        .map((item) => within(item).getByRole('link').textContent),
    ).toEqual(['First recipe', 'Second recipe']);
    expect(within(callout).getByText('Intermediate · ~20 min')).toBeVisible();
  });

  it('renders nothing when the collection has no public recipes', () => {
    const { container } = render(
      <CookbookCollectionLink collection="previews" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('fails the build on an unknown collection id', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(<CookbookCollectionLink collection="agnets" />),
    ).toThrow('no cookbook collection with id "agnets"');
  });
});
