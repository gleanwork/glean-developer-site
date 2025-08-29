import { describe, test, expect, beforeEach } from 'vitest';
import {
  MCPConfigRegistry,
  type ClientId,
} from '@gleanwork/mcp-config-schema/browser';

describe('MCP Configuration Registry', () => {
  let registry: MCPConfigRegistry;

  beforeEach(() => {
    registry = new MCPConfigRegistry();
  });

  describe('Host Configuration Properties', () => {
    test('all hosts have valid configurations', () => {
      const allClients = registry.getAllConfigs();

      expect(allClients.length).toBeGreaterThan(0);

      allClients.forEach((client) => {
        expect(client.id).toBeTruthy();
        expect(client.displayName).toBeTruthy();

        const config = registry.getConfig(client.id as ClientId);
        expect(config).toBeDefined();
      });
    });

    test.each([
      ['cursor', false], // native HTTP, not admin
      ['claude-code', false], // native HTTP, not admin
      ['claude-desktop', false], // not admin
      ['vscode', false], // native HTTP, not admin
      ['windsurf', false], // not admin
      ['goose', false], // native HTTP (streamable_http), not admin
      ['chatgpt', true], // is admin
      ['claude-teams-enterprise', true], // is admin
    ])('%s has isAdmin=%s', (clientId, isAdmin) => {
      const config = registry.getConfig(clientId as ClientId);
      expect(config).toBeDefined();

      // Check if admin required
      const hasLocalConfig = config?.localConfigSupport !== 'none';
      expect(!hasLocalConfig).toBe(isAdmin);
    });
  });

  describe('Configuration Generation', () => {
    test('generates valid JSON for hosts that support local config', () => {
      const allClients = registry.getAllConfigs();

      allClients.forEach((client) => {
        // Skip admin-required hosts that don't support local config
        const clientConfig = registry.getConfig(client.id as ClientId);
        if (clientConfig?.localConfigSupport === 'none') {
          return;
        }

        const builder = registry.createBuilder(client.id as ClientId);

        const config = builder.buildConfiguration({
          transport: 'http',
          serverUrl: 'https://test-be.glean.com/mcp/default',
          serverName: 'glean_default',
          includeWrapper: false,
        });
        const output = builder.toString(config);

        // Goose returns YAML, others return JSON
        if (client.id === 'goose') {
          expect(output).toContain('glean_default:');
          expect(output).toContain('type: streamable_http');
          expect(output).toContain(
            'uri: https://test-be.glean.com/mcp/default',
          );
        } else {
          // Should produce valid JSON
          expect(() => JSON.parse(output)).not.toThrow();

          const parsed = JSON.parse(output);
          expect(parsed).toHaveProperty('glean_default');
        }
      });
    });

    test('hosts that use mcp-remote bridge', () => {
      const bridgeHosts = ['windsurf', 'claude-desktop']; // These still use mcp-remote

      bridgeHosts.forEach((hostId) => {
        const builder = registry.createBuilder(hostId as ClientId);
        const config = builder.buildConfiguration({
          transport: 'http',
          serverUrl: 'https://test-be.glean.com/mcp/default',
          serverName: 'glean_default',
          includeWrapper: false,
        });
        const output = builder.toString(config);

        // Bridge hosts return JSON with command/args
        const parsed = JSON.parse(output);
        // Bridge hosts don't have a 'type' field, they just have command/args
        expect(
          parsed.glean_default.command ||
            parsed.mcpServers?.glean_default?.command,
        ).toBe('npx');
        const args =
          parsed.glean_default?.args || parsed.mcpServers?.glean_default?.args;
        expect(args).toContain('mcp-remote');
        expect(args).toContain('https://test-be.glean.com/mcp/default');
      });
    });

    test('native HTTP hosts use direct connection', () => {
      const httpHosts = ['cursor', 'vscode', 'goose'];

      httpHosts.forEach((hostId) => {
        const clientConfig = registry.getConfig(hostId as ClientId);

        // Skip if admin required
        if (clientConfig?.localConfigSupport === 'none') return;

        const builder = registry.createBuilder(hostId as ClientId);
        const config = builder.buildConfiguration({
          transport: 'http',
          serverUrl: 'https://test-be.glean.com/mcp/default',
          serverName: 'glean_default',
          includeWrapper: false,
        });
        const output = builder.toString(config);

        if (hostId === 'goose') {
          // Goose uses YAML format
          expect(output).toContain('glean_default:');
          expect(output).toContain('type: streamable_http');
          expect(output).toContain(
            'uri: https://test-be.glean.com/mcp/default',
          );
        } else {
          const parsed = JSON.parse(output);
          const url =
            parsed.glean_default?.url || parsed.mcpServers?.glean_default?.url;
          expect(url).toBe('https://test-be.glean.com/mcp/default');
        }
      });
    });

    test('claude-code generates HTTP configuration', () => {
      const builder = registry.createBuilder('claude-code' as ClientId);
      const config = builder.buildConfiguration({
        transport: 'http',
        serverUrl: 'https://test-be.glean.com/mcp/default',
        serverName: 'glean_default',
        includeWrapper: false,
      });
      const output = builder.toString(config);

      // Claude Code actually returns JSON config, not a CLI command
      // The CLI command is generated in the UI component
      const parsed = JSON.parse(output);
      expect(parsed.glean_default.type).toBe('http');
      expect(parsed.glean_default.url).toBe(
        'https://test-be.glean.com/mcp/default',
      );
    });

    test('configuration structure matches expected format', () => {
      // Test that native HTTP hosts have the correct structure
      const builder = registry.createBuilder('vscode' as ClientId);

      const config = builder.buildConfiguration({
        transport: 'http',
        serverUrl: 'https://test-be.glean.com/mcp/default',
        serverName: 'glean_default',
        includeWrapper: false,
      });
      const configString = builder.toString(config);

      const parsed = JSON.parse(configString);
      expect(parsed.glean_default).toBeDefined();
      expect(parsed.glean_default.type).toBe('http');
      expect(parsed.glean_default.url).toBe(
        'https://test-be.glean.com/mcp/default',
      );

      // Note: The mcp-config-schema doesn't currently add auth headers
      // Auth is handled via OAuth/DCR by default
    });
  });

  describe('One-Click URL Generation', () => {
    test('generates deeplinks for supported hosts', () => {
      const oneClickHosts = ['vscode', 'cursor'];

      oneClickHosts.forEach((hostId) => {
        const config = registry.getConfig(hostId as ClientId);
        const builder = registry.createBuilder(hostId as ClientId);

        if (config?.oneClick) {
          const url = builder.buildOneClickUrl({
            serverUrl: 'https://test-be.glean.com/mcp/default',
            serverName: 'glean_default',
          });

          expect(url).toBeTruthy();

          if (hostId === 'vscode') {
            expect(url).toContain('vscode://');
          } else if (hostId === 'cursor') {
            expect(url).toContain('cursor://');
          }
        }
      });
    });
  });

  describe('Admin-Required Hosts', () => {
    test('chatgpt and claude-teams-enterprise require admin setup', () => {
      const adminHosts = ['chatgpt', 'claude-teams-enterprise'];

      adminHosts.forEach((hostId) => {
        const config = registry.getConfig(hostId as ClientId);
        expect(config?.localConfigSupport).toBe('none');
      });
    });
  });
});
