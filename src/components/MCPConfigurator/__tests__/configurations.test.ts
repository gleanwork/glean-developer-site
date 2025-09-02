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
      { client: 'cursor', admin: false },
      { client: 'claude-code', admin: false },
      { client: 'claude-desktop', admin: false },
      { client: 'vscode', admin: false },
      { client: 'windsurf', admin: false },
      { client: 'goose', admin: false },
      { client: 'chatgpt', admin: true },
      { client: 'claude-teams-enterprise', admin: true },
    ])('$client has isAdmin=$admin', ({ client: clientId, admin: isAdmin }) => {
      const config = registry.getConfig(clientId as ClientId);
      expect(config).toBeDefined();

      const hasLocalConfig = config?.localConfigSupport !== 'none';
      expect(!hasLocalConfig).toBe(isAdmin);
    });
  });

  describe('Configuration Generation', () => {
    test('generates valid JSON for hosts that support local config', () => {
      const allClients = registry.getAllConfigs();

      allClients.forEach((client) => {
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

        if (client.id === 'goose') {
          expect(output).toContain('glean_default:');
          expect(output).toContain('type: streamable_http');
          expect(output).toContain(
            'uri: https://test-be.glean.com/mcp/default',
          );
        } else {
          expect(() => JSON.parse(output)).not.toThrow();

          const parsed = JSON.parse(output);
          expect(parsed).toHaveProperty('glean_default');
        }
      });
    });

    test('hosts that use mcp-remote bridge', () => {
      const bridgeHosts = ['windsurf', 'claude-desktop'];

      bridgeHosts.forEach((hostId) => {
        const builder = registry.createBuilder(hostId as ClientId);
        const config = builder.buildConfiguration({
          transport: 'http',
          serverUrl: 'https://test-be.glean.com/mcp/default',
          serverName: 'glean_default',
          includeWrapper: false,
        });
        const output = builder.toString(config);

        const parsed = JSON.parse(output);

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


      const parsed = JSON.parse(output);
      expect(parsed.glean_default.type).toBe('http');
      expect(parsed.glean_default.url).toBe(
        'https://test-be.glean.com/mcp/default',
      );
    });

    test('configuration structure matches expected format', () => {
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
            transport: 'http',
            serverUrl: 'https://test-be.glean.com/mcp/default',
            serverName: 'glean_default',
          });

          expect(url).toBeTruthy();

          if (hostId === 'vscode') {
            expect(url).toContain('vscode:');
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
