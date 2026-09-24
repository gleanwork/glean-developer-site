import fs from 'node:fs';
import path from 'node:path';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DocSidebarItemLink from './index';

vi.mock('@docusaurus/theme-common', () => ({
  ThemeClassNames: {
    docs: {
      docSidebarItemLink: 'theme-doc-sidebar-item-link',
      docSidebarItemLinkLevel: (level: number) =>
        `theme-doc-sidebar-item-link-level-${level}`,
    },
  },
}));

vi.mock('@docusaurus/plugin-content-docs/client', () => ({
  isActiveSidebarItem: () => false,
}));

vi.mock('@theme/Icon/ExternalLink', () => ({ default: () => null }));
vi.mock('@theme/Icons', () => ({
  Icon: ({ name, className }: { name: string; className?: string }) => (
    <svg data-icon={name} className={className} aria-hidden="true" />
  ),
}));

vi.mock('@site/src/data/experimental.json', () => ({
  default: {
    endpoints: [{ docId: 'api/platform-api/experimental-endpoint' }],
  },
}));

type SidebarItem = ComponentProps<typeof DocSidebarItemLink>['item'];

function renderItem(overrides: Partial<SidebarItem> = {}) {
  return render(
    <DocSidebarItemLink
      item={{
        type: 'link',
        label: 'Endpoint',
        href: '/api/indexing-api/endpoint',
        docId: 'api/indexing-api/endpoint',
        className: 'post api-method',
        ...overrides,
      }}
      activePath="/"
      level={1}
      index={0}
    />,
  );
}

// Use the committed generator output to cover the real metadata contract.
function generatedSidebarClass(docId: string): string {
  const content = fs.readFileSync(
    path.resolve('docs', `${docId}.api.mdx`),
    'utf8',
  );
  const match = content.match(/^sidebar_class_name: "([^"]+)"$/m);
  if (!match) throw new Error(`Missing sidebar class for ${docId}`);
  return match[1];
}

describe('sidebar endpoint status icons', () => {
  it.each([
    'post api-method menu__list-item--deprecated',
    'menu__list-item--deprecated\tapi-method post',
  ])(
    'shows an accessible warning for deprecated endpoints: %s',
    (className) => {
      renderItem({ className });

      const warning = screen.getByRole('img', { name: 'Deprecated' });
      expect(warning).toHaveAttribute('title', 'Deprecated');
      expect(warning.querySelector('svg')).toHaveAttribute(
        'data-icon',
        'AlertTriangle',
      );
    },
  );

  it.each([
    undefined,
    'post api-method',
    'schema menu__list-item--deprecated',
    'post api-method menu__list-item--deprecated-extra',
  ])(
    'does not warn without an exact endpoint deprecation flag: %s',
    (className) => {
      renderItem({ className });
      expect(
        screen.queryByRole('img', { name: 'Deprecated' }),
      ).not.toBeInTheDocument();
    },
  );

  it('warns for a generated deprecated endpoint', () => {
    const docId = 'api/indexing-api/bulk-index-employees';
    renderItem({ docId, className: generatedSidebarClass(docId) });
    expect(screen.getByRole('img', { name: 'Deprecated' })).toBeInTheDocument();
  });

  it.each(['api/indexing-api/index-employee', 'api/client-api/chat/chat'])(
    'does not warn for generated endpoints with only deprecated fields: %s',
    (docId) => {
      renderItem({ docId, className: generatedSidebarClass(docId) });
      expect(
        screen.queryByRole('img', { name: 'Deprecated' }),
      ).not.toBeInTheDocument();
    },
  );

  it('preserves the experimental badge without a deprecation warning', () => {
    renderItem({ docId: 'api/platform-api/experimental-endpoint' });
    expect(
      screen.getByRole('img', { name: 'Experimental' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: 'Deprecated' }),
    ).not.toBeInTheDocument();
  });

  it('shows both badges when an endpoint is experimental and deprecated', () => {
    renderItem({
      docId: 'api/platform-api/experimental-endpoint',
      className: 'post api-method menu__list-item--deprecated',
    });
    expect(
      screen.getByRole('img', { name: 'Experimental' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Deprecated' })).toBeInTheDocument();
  });
});
