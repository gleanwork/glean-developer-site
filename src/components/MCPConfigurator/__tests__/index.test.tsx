import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MCPConfigurator from '../index';

// Mock sonner toast
vi.mock('sonner', () => ({
  Toaster: () => null,
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('MCPQuickInstaller Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    test('renders with default state', () => {
      render(<MCPConfigurator />);

      expect(
        screen.getByText('Quick Install Remote MCP Server'),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('Select Your Host Application'),
      ).toBeInTheDocument();
      expect(screen.getByText('Configure Server URL')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Instance name (e.g., acme)'),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Server (e.g., default)'),
      ).toBeInTheDocument();
    });

    test('shows server URL when instance and endpoint are provided', async () => {
      const user = userEvent.setup();
      render(<MCPConfigurator />);

      const instanceInput = screen.getByPlaceholderText(
        'Instance name (e.g., acme)',
      );

      await user.type(instanceInput, 'mycompany');

      // Server URL should be displayed
      expect(
        screen.getByDisplayValue(/https:\/\/mycompany-be\.glean\.com\/mcp\//),
      ).toBeInTheDocument();
    });
  });

  describe('Host Selection Behavior', () => {
    test('ChatGPT automatically sets server endpoint to "chatgpt"', async () => {
      const user = userEvent.setup();
      render(<MCPConfigurator />);

      const select = screen.getByLabelText('Select Your Host Application');
      await user.selectOptions(select, 'chatgpt');

      const endpointInput = screen.getByPlaceholderText(
        'Server (e.g., default)',
      ) as HTMLInputElement;
      expect(endpointInput.value).toBe('chatgpt');
      expect(endpointInput).toBeDisabled();
    });

    test('switching from ChatGPT resets endpoint to "default"', async () => {
      const user = userEvent.setup();
      render(<MCPConfigurator />);

      const select = screen.getByLabelText('Select Your Host Application');

      // Select ChatGPT first
      await user.selectOptions(select, 'chatgpt');
      let endpointInput = screen.getByPlaceholderText(
        'Server (e.g., default)',
      ) as HTMLInputElement;
      expect(endpointInput.value).toBe('chatgpt');

      // Switch to Cursor
      await user.selectOptions(select, 'cursor');
      endpointInput = screen.getByPlaceholderText(
        'Server (e.g., default)',
      ) as HTMLInputElement;
      expect(endpointInput.value).toBe('default');
      expect(endpointInput).not.toBeDisabled();
    });
  });

  describe('Tab Display Logic', () => {
    test('admin-required hosts show no tabs', async () => {
      const user = userEvent.setup();
      render(<MCPConfigurator />);

      const select = screen.getByLabelText('Select Your Host Application');
      await user.selectOptions(select, 'chatgpt');

      // Should not show tabs for admin-required hosts
      expect(screen.queryByText('CLI Command')).not.toBeInTheDocument();
      expect(screen.queryByText('Manual Config')).not.toBeInTheDocument();

      // Should show the setup button
      expect(screen.getByText(/View.*Setup Guide/)).toBeInTheDocument();
    });

    test('regular hosts show all three tabs', async () => {
      const user = userEvent.setup();
      render(<MCPConfigurator />);

      const select = screen.getByLabelText('Select Your Host Application');
      await user.selectOptions(select, 'cursor');

      // Should show all tabs
      expect(screen.getByText('Quick Setup')).toBeInTheDocument();
      expect(screen.getByText('CLI Command')).toBeInTheDocument();
      expect(screen.getByText('Manual Config')).toBeInTheDocument();
    });
  });

  describe('CLI Command Generation', () => {
    test('generates correct CLI command with instance and token', async () => {
      const user = userEvent.setup();
      render(<MCPConfigurator />);

      // Select Cursor
      const select = screen.getByLabelText('Select Your Host Application');
      await user.selectOptions(select, 'cursor');

      // Enter instance
      const instanceInput = screen.getByPlaceholderText(
        'Instance name (e.g., acme)',
      );
      await user.type(instanceInput, 'mycompany');

      // Click CLI Command tab
      const cliTab = screen.getByText('CLI Command');
      await user.click(cliTab);

      // Check CLI command content
      const cliCommand = screen.getByText(
        /npx -y @gleanwork\/configure-mcp-server remote/,
      );
      expect(cliCommand).toBeInTheDocument();
      // The URL should contain the instance and endpoint
      expect(cliCommand.textContent).toContain(
        '--url https://mycompany-be.glean.com/mcp/',
      );
      expect(cliCommand.textContent).toContain('--client cursor');
    });

    test('includes token in CLI command when provided', async () => {
      const user = userEvent.setup();
      render(<MCPConfigurator />);

      // Select a non-admin host first
      const select = screen.getByLabelText('Select Your Host Application');
      await user.selectOptions(select, 'cursor');

      // Select Bearer Token auth method
      const authMethodSelect = screen.getByLabelText('Authentication Method');
      await user.selectOptions(authMethodSelect, 'bearer');

      // Enter token
      const tokenInput = screen.getByPlaceholderText(
        'Enter your Glean API token',
      );
      await user.type(tokenInput, 'test_token_123');

      // Enter instance
      const instanceInput = screen.getByPlaceholderText(
        'Instance name (e.g., acme)',
      );
      await user.type(instanceInput, 'mycompany');

      // Click CLI Command tab
      const cliTab = screen.getByText('CLI Command');
      await user.click(cliTab);

      // Check token is included
      const cliCommand = screen.getByText(
        /npx -y @gleanwork\/configure-mcp-server remote/,
      );
      expect(cliCommand.textContent).toContain('--token test_token_123');
    });
  });

  describe('Manual Configuration', () => {
    test('shows correct JSON config for stdio hosts', async () => {
      const user = userEvent.setup();
      render(<MCPConfigurator />);

      // Select Windsurf (actual stdio host that uses mcp-remote)
      const select = screen.getByLabelText('Select Your Host Application');
      await user.selectOptions(select, 'windsurf');

      // Enter instance
      const instanceInput = screen.getByPlaceholderText(
        'Instance name (e.g., acme)',
      );
      await user.type(instanceInput, 'mycompany');

      // Click Manual Config tab
      const manualTab = screen.getByText('Manual Config');
      await user.click(manualTab);

      // Get config content - look for the pre element containing the config
      const configPre = screen.getByText((content, element) => {
        return element?.tagName === 'CODE' && content.includes('glean_default');
      });
      expect(configPre).toBeTruthy();

      const config = JSON.parse(configPre.textContent || '{}');
      expect(config.glean_default).toBeDefined();
      // Windsurf uses stdio with mcp-remote
      expect(config.glean_default.command).toBe('npx');
      expect(config.glean_default.args).toContain('mcp-remote');
    });

    test('shows correct JSON config for http hosts', async () => {
      const user = userEvent.setup();
      render(<MCPConfigurator />);

      // Select VS Code (http host)
      const select = screen.getByLabelText('Select Your Host Application');
      await user.selectOptions(select, 'vscode');

      // Enter instance
      const instanceInput = screen.getByPlaceholderText(
        'Instance name (e.g., acme)',
      );
      await user.type(instanceInput, 'mycompany');

      // Click Manual Config tab
      const manualTab = screen.getByText('Manual Config');
      await user.click(manualTab);

      // Get config content - look for the pre element containing the config
      const configPre = screen.getByText((content, element) => {
        return element?.tagName === 'CODE' && content.includes('glean_default');
      });
      expect(configPre).toBeTruthy();

      const config = JSON.parse(configPre.textContent || '{}');
      expect(config.glean_default).toBeDefined();
      expect(config.glean_default.url).toContain(
        'https://mycompany-be.glean.com/mcp/',
      );
    });
  });
});
