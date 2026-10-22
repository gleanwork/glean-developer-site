import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Schema from './index';

vi.mock('@theme/ArrayBrackets', () => ({
  OpeningArrayBracket: () => <span>[</span>,
  ClosingArrayBracket: () => <span>]</span>,
}));
vi.mock('@theme/Details', () => ({
  default: ({
    summary,
    children,
  }: {
    summary: ReactNode;
    children: ReactNode;
  }) => (
    <details open>
      <summary>{summary}</summary>
      {children}
    </details>
  ),
}));
vi.mock('@theme/DiscriminatorTabs', () => ({ default: () => null }));
vi.mock('@theme/Markdown', () => ({ default: () => null }));
vi.mock('@theme/SchemaItem', () => ({
  default: ({ name, children }: { name?: string; children?: ReactNode }) => (
    <div data-testid={name ? `item-${name}` : undefined}>{children}</div>
  ),
}));
vi.mock('@theme/SchemaTabs', () => ({ default: () => null }));
vi.mock('@theme/TabItem', () => ({ default: () => null }));
vi.mock('docusaurus-theme-openapi-docs/lib/markdown/schema', () => ({
  getQualifierMessage: () => undefined,
  getSchemaName: (schema: { type?: string }) => schema?.type ?? '',
}));

function renderResponse(items: Record<string, unknown>) {
  return render(
    <Schema
      schemaType="response"
      schema={{
        type: 'object',
        properties: { results: { type: 'array', items } },
      }}
    />,
  );
}

describe('Schema', () => {
  it('expands array items that are a plain object', () => {
    renderResponse({
      type: 'object',
      properties: { skill_id: { type: 'string' } },
    });

    expect(screen.getByTestId('item-skill_id')).toBeInTheDocument();
  });

  it('expands array items that use allOf', () => {
    renderResponse({
      allOf: [
        {
          type: 'object',
          properties: {
            department_id: { type: 'string' },
            display_name: { type: 'string' },
          },
        },
      ],
    });

    expect(screen.getByTestId('item-department_id')).toBeInTheDocument();
    expect(screen.getByTestId('item-display_name')).toBeInTheDocument();
  });
});
