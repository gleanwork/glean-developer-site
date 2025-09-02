import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CLIENT, buildCommand } from '@gleanwork/mcp-config-schema/browser';
import MCPConfigurator from '../index';

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

      await user.selectOptions(select, 'chatgpt');
      let endpointInput = screen.getByPlaceholderText(
        'Server (e.g., default)',
      ) as HTMLInputElement;
      expect(endpointInput.value).toBe('chatgpt');

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

      expect(screen.queryByText('CLI Command')).not.toBeInTheDocument();
      expect(screen.queryByText('Manual Config')).not.toBeInTheDocument();

      expect(screen.getByText(/View.*Setup Guide/)).toBeInTheDocument();
    });

    test('regular hosts show all three tabs', async () => {
      const user = userEvent.setup();
      render(<MCPConfigurator />);

      const select = screen.getByLabelText('Select Your Host Application');
      await user.selectOptions(select, 'cursor');

      expect(screen.getByText('Quick Setup')).toBeInTheDocument();
      expect(screen.getByText('CLI Command')).toBeInTheDocument();
      expect(screen.getByText('Manual Config')).toBeInTheDocument();
    });
  });

  describe('CLI Command Generation', () => {
    test('generates correct CLI command with instance and token', async () => {
      const user = userEvent.setup();
      render(<MCPConfigurator />);

      const select = screen.getByLabelText('Select Your Host Application');
      await user.selectOptions(select, 'cursor');

      const instanceInput = screen.getByPlaceholderText(
        'Instance name (e.g., acme)',
      );
      await user.type(instanceInput, 'mycompany');

      const cliTab = screen.getByText('CLI Command');
      await user.click(cliTab);

      const cliCommand = screen.getByText(
        /npx -y @gleanwork\/configure-mcp-server remote/,
      );
      expect(cliCommand).toBeInTheDocument();
      expect(cliCommand.textContent).toContain(
        '--url https://mycompany-be.glean.com/mcp/',
      );
      expect(cliCommand.textContent).toContain('--client cursor');
    });

    test('includes token in CLI command when provided', async () => {
      const user = userEvent.setup();
      render(<MCPConfigurator />);

      const select = screen.getByLabelText('Select Your Host Application');
      await user.selectOptions(select, 'cursor');

      const authMethodSelect = screen.getByLabelText('Authentication Method');
      await user.selectOptions(authMethodSelect, 'bearer');

      const tokenInput = screen.getByPlaceholderText(
        'Enter your Glean API token',
      );
      await user.type(tokenInput, 'test_token_123');

      const instanceInput = screen.getByPlaceholderText(
        'Instance name (e.g., acme)',
      );
      await user.type(instanceInput, 'mycompany');

      const cliTab = screen.getByText('CLI Command');
      await user.click(cliTab);

      const cliCommand = screen.getByText(
        /npx -y @gleanwork\/configure-mcp-server remote/,
      );
      expect(cliCommand.textContent).toContain('--token test_token_123');
    });
  });

  describe('CLI Command Validation', () => {
    test('validates exact CLI command strings for all supported clients', async () => {
      const user = userEvent.setup();
      render(<MCPConfigurator />);


      const select = screen.getByLabelText('Select Your Host Application');
      await user.selectOptions(select, 'cursor');

      const authMethodSelect = screen.getByLabelText('Authentication Method');
      await user.selectOptions(authMethodSelect, 'bearer');

      const tokenInput = screen.getByPlaceholderText('Enter your Glean API token');
      await user.type(tokenInput, 'test_validation_token');

      const instanceInput = screen.getByPlaceholderText('Instance name (e.g., acme)');
      await user.type(instanceInput, 'testcompany');

      const cliTab = screen.getByText('CLI Command');
      await user.click(cliTab);

      const cliCommandElement = screen.getByText((content, element) => {
        return element?.tagName === 'CODE' && content.includes('npx -y @gleanwork/configure-mcp-server remote');
      });

      const cliCommandText = cliCommandElement.textContent || '';

      expect(cliCommandText).toContain('npx -y @gleanwork/configure-mcp-server remote');
      expect(cliCommandText).toContain('--url https://testcompany-be.glean.com/mcp/default');
      expect(cliCommandText).toContain('--client cursor');
      expect(cliCommandText).toContain('--token test_validation_token');

      const lines = cliCommandText.trim().split('\n');
      expect(lines[0]).toBe('npx -y @gleanwork/configure-mcp-server remote \\');
      expect(lines[1]).toBe('   --url https://testcompany-be.glean.com/mcp/default \\');
      expect(lines[2]).toBe('   --client cursor \\');
      expect(lines[3]).toBe('   --token test_validation_token');
    });

    test('validates exact Claude Code CLI command format', async () => {
      const user = userEvent.setup();
      render(<MCPConfigurator />);

      const select = screen.getByLabelText('Select Your Host Application');
      await user.selectOptions(select, CLIENT.CLAUDE_CODE);

      const authMethodSelect = screen.getByLabelText('Authentication Method');
      await user.selectOptions(authMethodSelect, 'bearer');

      const tokenInput = screen.getByPlaceholderText('Enter your Glean API token');
      await user.type(tokenInput, 'test_claude_token');

      const instanceInput = screen.getByPlaceholderText('Instance name (e.g., acme)');
      await user.type(instanceInput, 'testcompany');

      const cliTab = screen.getByText('CLI Command');
      await user.click(cliTab);

      const cliCommandElement = screen.getByText((content, element) => {
        return element?.tagName === 'CODE' && content.includes('claude mcp add');
      });

      const cliCommandText = cliCommandElement.textContent || '';

      expect(cliCommandText).toContain('claude mcp add glean_default https://testcompany-be.glean.com/mcp/default');
      expect(cliCommandText).toContain('--transport http');
      expect(cliCommandText).toContain('--header "Authorization: Bearer test_claude_token"');

      const lines = cliCommandText.trim().split('\n');
      expect(lines[0]).toBe('claude mcp add glean_default https://testcompany-be.glean.com/mcp/default \\');
      expect(lines[1]).toBe('   --transport http \\');
      expect(lines[2]).toBe('   --scope user \\');
      expect(lines[3]).toBe('   --header "Authorization: Bearer test_claude_token"');
    });

    test('validates CLI command without token', async () => {
      const user = userEvent.setup();
      render(<MCPConfigurator />);


      const select = screen.getByLabelText('Select Your Host Application');
      await user.selectOptions(select, 'cursor');

      const instanceInput = screen.getByPlaceholderText('Instance name (e.g., acme)');
      await user.type(instanceInput, 'testcompany');

      const cliTab = screen.getByText('CLI Command');
      await user.click(cliTab);

      const cliCommandElement = screen.getByText((content, element) => {
        return element?.tagName === 'CODE' && content.includes('npx -y @gleanwork/configure-mcp-server remote');
      });

      const cliCommandText = cliCommandElement.textContent || '';

      expect(cliCommandText).toContain('npx -y @gleanwork/configure-mcp-server remote');
      expect(cliCommandText).toContain('--url https://testcompany-be.glean.com/mcp/default');
      expect(cliCommandText).toContain('--client cursor');
      expect(cliCommandText).not.toContain('--token');

      const lines = cliCommandText.trim().split('\n');
      expect(lines[0]).toBe('npx -y @gleanwork/configure-mcp-server remote \\');
      expect(lines[1]).toBe('   --url https://testcompany-be.glean.com/mcp/default \\');
      expect(lines[2]).toBe('   --client cursor');
      expect(lines.length).toBe(3);
    });

    test('validates CLI command with custom server name', async () => {
      const user = userEvent.setup();
      render(<MCPConfigurator />);

      const select = screen.getByLabelText('Select Your Host Application');
      await user.selectOptions(select, 'cursor');

      const instanceInput = screen.getByPlaceholderText('Instance name (e.g., acme)');
      await user.type(instanceInput, 'testcompany');

      const serverInput = screen.getByPlaceholderText('Server (e.g., default)');
      await user.clear(serverInput);
      await user.type(serverInput, 'custom-server');

      const cliTab = screen.getByText('CLI Command');
      await user.click(cliTab);

      const cliCommandElement = screen.getByText((content, element) => {
        return element?.tagName === 'CODE' && content.includes('npx -y @gleanwork/configure-mcp-server remote');
      });

      const cliCommandText = cliCommandElement.textContent || '';

      expect(cliCommandText).toContain('--url https://testcompany-be.glean.com/mcp/custom-server');
    });

    test('buildCommand produces identical output to original logic', async () => {
      const serverData = {
        transport: 'http' as const,
        serverUrl: 'https://testcompany-be.glean.com/mcp/default',
        serverName: 'glean_default',
        apiToken: 'test_token_123',
        configureMcpServerVersion: undefined,
      };

      const claudeCommand = buildCommand('claude-code', serverData);
      expect(claudeCommand).toBe('claude mcp add glean_default https://testcompany-be.glean.com/mcp/default --transport http --scope user --header "Authorization: Bearer test_token_123"');

      const cursorCommand = buildCommand('cursor', serverData);
      expect(cursorCommand).toBe('npx -y @gleanwork/configure-mcp-server remote --url https://testcompany-be.glean.com/mcp/default --client cursor --token test_token_123');

      const serverDataNoToken = { ...serverData, apiToken: undefined };
      const claudeCommandNoToken = buildCommand('claude-code', serverDataNoToken);
      expect(claudeCommandNoToken).toBe('claude mcp add glean_default https://testcompany-be.glean.com/mcp/default --transport http --scope user');

      const cursorCommandNoToken = buildCommand('cursor', serverDataNoToken);
      expect(cursorCommandNoToken).toBe('npx -y @gleanwork/configure-mcp-server remote --url https://testcompany-be.glean.com/mcp/default --client cursor');
    });

    test('validates CLI command copy functionality matches display', async () => {
      const mockWriteText = vi.fn();
      vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(mockWriteText);

      const user = userEvent.setup();
      render(<MCPConfigurator />);

      const select = screen.getByLabelText('Select Your Host Application');
      await user.selectOptions(select, 'cursor');

      const authMethodSelect = screen.getByLabelText('Authentication Method');
      await user.selectOptions(authMethodSelect, 'bearer');

      const tokenInput = screen.getByPlaceholderText('Enter your Glean API token');
      await user.type(tokenInput, 'test_copy_token');

      const instanceInput = screen.getByPlaceholderText('Instance name (e.g., acme)');
      await user.type(instanceInput, 'testcompany');

      const cliTab = screen.getByText('CLI Command');
      await user.click(cliTab);

      const cliCommandElement = screen.getByText((content, element) => {
        return element?.tagName === 'CODE' && content.includes('npx -y @gleanwork/configure-mcp-server remote');
      });
      const displayedCommand = cliCommandElement.textContent || '';

      const copyButton = screen.getByTitle('Copy CLI command');
      await user.click(copyButton);

      expect(mockWriteText).toHaveBeenCalledWith(
        displayedCommand.replace(/\s*\\\s*\n\s*/g, ' ').trim()
      );
    });
  });

  describe('Manual Configuration', () => {
    test('shows correct JSON config for stdio hosts', async () => {
      const user = userEvent.setup();
      render(<MCPConfigurator />);

      const select = screen.getByLabelText('Select Your Host Application');
      await user.selectOptions(select, 'windsurf');

      const instanceInput = screen.getByPlaceholderText(
        'Instance name (e.g., acme)',
      );
      await user.type(instanceInput, 'mycompany');

      const manualTab = screen.getByText('Manual Config');
      await user.click(manualTab);

      const configPre = screen.getByText((content, element) => {
        const isCodeElement = element?.tagName === 'CODE';
        const hasGleanDefault = content.includes('glean_default');
        const isManualConfig = content.includes('"command": "npx"') && content.includes('"args":');
        return isCodeElement && hasGleanDefault && isManualConfig;
      });
      expect(configPre).toBeTruthy();

      const config = JSON.parse(configPre.textContent || '{}');
      expect(config.glean_default).toBeDefined();
      expect(config.glean_default.command).toBe('npx');
      expect(config.glean_default.args).toContain('mcp-remote');
    });

    test('shows correct JSON config for http hosts', async () => {
      const user = userEvent.setup();
      render(<MCPConfigurator />);

      const select = screen.getByLabelText('Select Your Host Application');
      await user.selectOptions(select, 'vscode');

      const instanceInput = screen.getByPlaceholderText(
        'Instance name (e.g., acme)',
      );
      await user.type(instanceInput, 'mycompany');

      const manualTab = screen.getByText('Manual Config');
      await user.click(manualTab);

      const configPre = screen.getByText((content, element) => {
        const isCodeElement = element?.tagName === 'CODE';
        const hasGleanDefault = content.includes('glean_default');
        const isManualConfig = content.includes('"type": "http"') && content.includes('"url":');
        return isCodeElement && hasGleanDefault && isManualConfig;
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
