import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

const { registryCtorOptions } = vi.hoisted(() => ({
  registryCtorOptions: {
    current: undefined as
      { managedSetupUrls?: Partial<Record<string, string>> } | undefined,
  },
}));

vi.mock('@gleanwork/mcp-config-schema/browser', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@gleanwork/mcp-config-schema/browser')
    >();

  const userConfigurable = {
    id: 'fixture-ide',
    displayName: 'Fixture IDE',
    types: ['ide'] as const,
    userConfigurable: true,
    documentationUrl: 'https://example.test/fixture-ide',
    transports: ['stdio', 'http'] as const,
    supportedAuth: ['token', 'oauth:dcr'] as const,
  };

  return {
    ...actual,
    MCPConfigRegistry: class {
      constructor(options?: {
        managedSetupUrls?: Partial<Record<string, string>>;
      }) {
        registryCtorOptions.current = options;
        this.options = options;
      }

      options?: { managedSetupUrls?: Partial<Record<string, string>> };

      getManagedSetupUrl(clientId: string) {
        return this.options?.managedSetupUrls?.[clientId];
      }

      getAllConfigs() {
        return [
          {
            ...userConfigurable,
            displayName: 'Fixture IDE duplicate',
          },
          userConfigurable,
          {
            id: 'chatgpt',
            displayName: 'ChatGPT',
            types: ['web'] as const,
            userConfigurable: false,
            documentationUrl: 'https://example.test/chatgpt',
            transports: ['http'] as const,
            supportedAuth: ['oauth:dcr'] as const,
          },
          {
            id: 'gemini-enterprise',
            displayName: 'Gemini Enterprise',
            types: ['web'] as const,
            userConfigurable: false,
            documentationUrl: 'https://example.test/gemini-enterprise',
            transports: ['http'] as const,
            supportedAuth: [] as const,
          },
          {
            id: 'fixture-empty',
            displayName: 'Fixture Empty',
            types: ['web'] as const,
            userConfigurable: false,
            transports: ['http'] as const,
            supportedAuth: [] as const,
          },
          {
            id: 'copilot-studio',
            displayName: 'Microsoft Copilot Studio',
            types: ['web'] as const,
            userConfigurable: false,
            documentationUrl: 'https://example.test/copilot-studio',
            transports: ['http'] as const,
            supportedAuth: ['token', 'oauth:dcr'] as const,
          },
        ];
      }
    },
  };
});

import McpHostsList from './McpHostsList';

const GLEAN_MANAGED_SETUP_URLS = {
  chatgpt: 'https://chatgpt.com/admin/apps?tab=available&q=glean',
  'claude-teams-enterprise': 'https://claude.ai/directory/connectors/glean',
  'cursor-team': 'https://cursor.com/dashboard/integrations',
};

async function searchFor(name: string) {
  await userEvent.type(screen.getByRole('searchbox'), name);
}

describe('McpHostsList', () => {
  afterEach(cleanup);

  it('passes Glean managed setup URLs into the registry', () => {
    render(<McpHostsList />);

    expect(registryCtorOptions.current?.managedSetupUrls).toEqual(
      GLEAN_MANAGED_SETUP_URLS,
    );
  });

  it('renders a registry host only once when it is also present in the fallback list', () => {
    render(<McpHostsList />);

    expect(
      screen.getAllByRole('heading', { name: 'Microsoft Copilot Studio' }),
    ).toHaveLength(1);
    expect(
      screen.getAllByRole('heading', { name: 'Fixture IDE' }),
    ).toHaveLength(1);
    expect(
      screen.queryByRole('heading', { name: 'Fixture IDE duplicate' }),
    ).not.toBeInTheDocument();
  });

  it('combines configuration ownership, client type, and name filters', async () => {
    render(<McpHostsList />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Organization-managed' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Web' }));
    await searchFor('Fixture Empty');

    expect(
      screen.getByRole('heading', { name: 'Fixture Empty' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Microsoft Copilot Studio' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/^1 of \d+$/)).toBeInTheDocument();
  });

  it('shows registry-provided ownership, transport, and authentication metadata', async () => {
    render(<McpHostsList />);
    await searchFor('Fixture IDE');

    expect(screen.getAllByText('User-configurable').length).toBeGreaterThan(0);
    expect(screen.getByText('STDIO, HTTP')).toBeInTheDocument();
    expect(screen.getByText('API token, OAuth via DCR')).toBeInTheDocument();
  });

  it('offers user-configurable hosts the Configurator and vendor documentation', async () => {
    render(<McpHostsList />);
    await searchFor('Fixture IDE');

    expect(
      screen.getByText('Open MCP Configurator').closest('a'),
    ).toHaveAttribute(
      'href',
      'https://app.glean.com/settings/install?mcpConfigure=true&mcpHost=fixture-ide',
    );
    expect(
      screen.getByText('Vendor documentation').closest('a'),
    ).toHaveAttribute('href', 'https://example.test/fixture-ide');
  });

  it('links supported hosts to Glean documentation before vendor documentation', async () => {
    render(<McpHostsList />);
    await searchFor('Gemini Enterprise');

    expect(
      screen.getByRole('link', {
        name: 'Open Gemini Enterprise Glean documentation',
      }),
    ).toHaveAttribute(
      'href',
      'https://docs.glean.com/administration/platform/embedded-integrations/glean-in-gemini-chat/',
    );
    expect(
      screen.getByRole('link', {
        name: 'Read Gemini Enterprise Glean documentation',
      }),
    ).toHaveAttribute(
      'href',
      'https://docs.glean.com/administration/platform/embedded-integrations/glean-in-gemini-chat/',
    );
    expect(
      screen.getByRole('link', {
        name: 'Read Gemini Enterprise vendor documentation',
      }),
    ).toHaveAttribute('href', 'https://example.test/gemini-enterprise');
  });

  it('routes managed hosts with a setup URL to the host admin destination', async () => {
    const { container } = render(<McpHostsList />);
    await searchFor('ChatGPT');

    expect(screen.getAllByText('Organization-managed').length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getByRole('link', { name: 'Set up Glean for ChatGPT' }),
    ).toHaveAttribute('href', GLEAN_MANAGED_SETUP_URLS.chatgpt);
    expect(
      screen.getByRole('link', {
        name: 'Read ChatGPT vendor documentation',
      }),
    ).toHaveAttribute('href', 'https://example.test/chatgpt');
    expect(screen.queryByText('Open MCP Configurator')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Organization setup guidance'),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('a[href*="mcpConfigure=true"]'),
    ).not.toBeInTheDocument();
  });

  it('shows when the registry lists no supported authentication methods', async () => {
    render(<McpHostsList />);
    await searchFor('Fixture Empty');

    expect(
      screen.getByText('Not specified. See host documentation.'),
    ).toBeInTheDocument();
  });

  it('keeps organization guidance actionable when vendor documentation is unavailable', async () => {
    render(<McpHostsList />);
    await searchFor('Fixture Empty');

    expect(
      screen.getByRole('link', {
        name: 'Organization setup guidance for Fixture Empty',
      }),
    ).toHaveAttribute(
      'href',
      'https://docs.glean.com/administration/platform/mcp/about',
    );
    expect(
      screen.getByText('Vendor documentation unavailable'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Vendor documentation')).not.toBeInTheDocument();
    expect(screen.queryByText('Set up Glean')).not.toBeInTheDocument();
  });

  it('gives every action a host-specific accessible name', async () => {
    render(<McpHostsList />);
    await searchFor('Fixture IDE');

    expect(
      screen.getByRole('link', {
        name: 'Open MCP Configurator for Fixture IDE',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: 'Read Fixture IDE Glean documentation',
      }),
    ).toHaveAttribute('href', 'https://docs.glean.com/guides/mcp/mcp');
    expect(
      screen.getByRole('link', {
        name: 'Read Fixture IDE vendor documentation',
      }),
    ).toBeInTheDocument();
  });
});
