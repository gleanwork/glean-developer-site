import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import McpHostsList from './McpHostsList';

async function searchFor(name: string) {
  await userEvent.type(screen.getByRole('searchbox'), name);
}

describe('McpHostsList', () => {
  afterEach(cleanup);

  it('renders a registry host only once when it is also present in the fallback list', () => {
    render(<McpHostsList />);

    expect(
      screen.getAllByRole('heading', { name: 'Microsoft Copilot Studio' }),
    ).toHaveLength(1);
  });

  it('combines configuration ownership, client type, and name filters', async () => {
    render(<McpHostsList />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Admin-managed' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Web' }));
    await searchFor('Linear');

    expect(screen.getByRole('heading', { name: 'Linear' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Microsoft Copilot Studio' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/^1 of \d+$/)).toBeInTheDocument();
  });

  it('shows registry-provided ownership, transport, and authentication metadata', async () => {
    render(<McpHostsList />);
    await searchFor('Codex');

    expect(screen.getByText('User configurable')).toBeInTheDocument();
    expect(screen.getByText('STDIO, HTTP')).toBeInTheDocument();
    expect(screen.getByText('API token, OAuth (DCR)')).toBeInTheDocument();
  });

  it('offers user-configurable hosts the Configurator and vendor documentation', async () => {
    render(<McpHostsList />);
    await searchFor('Codex');

    expect(
      screen.getByText('Open MCP Configurator').closest('a'),
    ).toHaveAttribute(
      'href',
      'https://app.glean.com/settings/install?mcpConfigure=true&mcpHost=codex',
    );
    expect(
      screen.getByText('Vendor documentation').closest('a'),
    ).toHaveAttribute('href', 'https://developers.openai.com/codex/mcp');
  });

  it('routes centrally managed hosts to organization guidance without a Configurator action', async () => {
    const { container } = render(<McpHostsList />);
    await searchFor('ChatGPT');

    expect(
      screen.getByText('Managed by your organization'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: 'Read organization-managed MCP guidance for ChatGPT',
      }),
    ).toHaveAttribute(
      'href',
      'https://docs.glean.com/administration/platform/mcp/about',
    );
    expect(
      screen.getByRole('link', {
        name: 'Read ChatGPT vendor documentation',
      }),
    ).toHaveAttribute(
      'href',
      'https://platform.openai.com/docs/mcp#test-and-connect-your-mcp-server',
    );
    expect(screen.queryByText('Open MCP Configurator')).not.toBeInTheDocument();
    expect(
      container.querySelector('a[href*="mcpConfigure=true"]'),
    ).not.toBeInTheDocument();
  });

  it('shows when the registry lists no supported authentication methods', async () => {
    render(<McpHostsList />);
    await searchFor('Claude for Desktop');

    expect(screen.getByText('None listed')).toBeInTheDocument();
  });

  it('keeps organization guidance actionable when vendor documentation is unavailable', async () => {
    render(<McpHostsList />);
    await searchFor('Linear');

    expect(
      screen.getByText('Organization setup guidance').closest('a'),
    ).toHaveAttribute(
      'href',
      'https://docs.glean.com/administration/platform/mcp/about',
    );
    expect(
      screen.getByText('Vendor documentation unavailable'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Vendor documentation')).not.toBeInTheDocument();
  });

  it('gives every action a host-specific accessible name', async () => {
    render(<McpHostsList />);
    await searchFor('Codex');

    expect(
      screen.getByRole('link', {
        name: 'Open Codex in the MCP Configurator',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: 'Read Codex vendor documentation',
      }),
    ).toBeInTheDocument();
  });
});
