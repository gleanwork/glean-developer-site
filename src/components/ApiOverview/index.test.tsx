import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ApiOverview from './index';

vi.mock('@theme/Card', () => ({
  default: ({
    title,
    children,
  }: {
    title: string;
    children?: React.ReactNode;
  }) => (
    <div>
      <h3>{title}</h3>
      {children}
    </div>
  ),
}));

vi.mock('@theme/CardGroup', () => ({
  default: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@theme/Icons', () => ({
  Icon: () => null,
}));

vi.mock('@site/src/data/beta.json', () => ({
  default: {
    endpoints: [{ docId: 'api/platform-api/platform-search-filters' }],
  },
}));

const useCases = [
  { title: 'Lookup', description: 'Find something.', icon: 'Search' },
];

function row(path: string): HTMLElement {
  const code = screen.getByText(path);
  const tr = code.closest('tr');
  if (!tr) throw new Error(`No row for ${path}`);
  return tr;
}

describe('platform endpoint listing', () => {
  it('badges the experimental endpoint and leaves the GA sibling unlabeled', () => {
    render(
      <ApiOverview
        title="Search API"
        description="Search."
        apiFamily="search"
        apiType="platform-api"
        useCases={useCases}
      />,
    );

    expect(row('/api/search/filters')).toHaveTextContent('Beta');
    expect(row('/api/search')).not.toHaveTextContent('Beta');
  });

  it('leaves a family unlabeled when none of its endpoints are experimental', () => {
    render(
      <ApiOverview
        title="Chat API"
        description="Chat."
        apiFamily="chat"
        apiType="platform-api"
        useCases={useCases}
      />,
    );

    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
  });
});
