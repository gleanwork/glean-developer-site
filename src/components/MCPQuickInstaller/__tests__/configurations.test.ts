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
      ['cursor', false, false], // native HTTP, not admin
      ['claude-code', false, false], // native HTTP, not admin
      ['claude-desktop', true, false], // needs bridge, not admin
      ['vscode', false, false], // native HTTP, not admin
      ['windsurf', true, false], // needs bridge, not admin
      ['goose', true, false], // needs bridge, not admin
      ['chatgpt', true, true], // needs bridge, is admin
      ['claude-teams-enterprise', true, true], // needs bridge, is admin
    ])(
      '%s has needsBridge=%s, isAdmin=%s',
      (clientId, needsBridge, isAdmin) => {
        const config = registry.getConfig(clientId as ClientId);
        expect(config).toBeDefined();

        // Check if needs mcp-remote bridge
        expect(config?.requiresMcpRemoteForHttp).toBe(needsBridge);

        // Check if admin required
        const hasLocalConfig = config?.localConfigSupport !== 'none';
        expect(!hasLocalConfig).toBe(isAdmin);
      },
    );
  });

  describe('Configuration Generation', () => {
    test('generates valid JSON for hosts that support local config', () => {
      const allClients = registry.getAllConfigs();

      allClients.forEach((client) => {
        // Skip admin-required hosts that don't support local config
        const config = registry.getConfig(client.id as ClientId);
        if (config?.localConfigSupport === 'none') {
          return;
        }

        const builder = registry.createBuilder(client.id as ClientId);

        const output = builder.buildConfiguration({
          mode: 'remote',
          serverUrl: 'https://test-be.glean.com/mcp/default',
          serverName: 'glean_default',
          includeWrapper: false,
        });

        // Goose returns YAML, others return JSON
        if (client.id === 'goose') {
          expect(output).toContain('glean_default:');
          expect(output).toContain('cmd: npx');
          expect(output).toContain('mcp-remote');
        } else {
          // Should produce valid JSON
          expect(() => JSON.parse(output)).not.toThrow();

          const parsed = JSON.parse(output);
          expect(parsed).toHaveProperty('glean_default');
        }
      });
    });

    test('hosts that need bridge use mcp-remote', () => {
      const bridgeHosts = ['windsurf', 'goose', 'claude-desktop'];

      bridgeHosts.forEach((hostId) => {
        const config = registry.getConfig(hostId as ClientId);
        expect(config?.requiresMcpRemoteForHttp).toBe(true);

        const builder = registry.createBuilder(hostId as ClientId);
        const output = builder.buildConfiguration({
          mode: 'remote',
          serverUrl: 'https://test-be.glean.com/mcp/default',
          serverName: 'glean_default',
          includeWrapper: false,
        });

        // Goose returns YAML, others return JSON
        if (hostId === 'goose') {
          expect(output).toContain('glean_default:');
          expect(output).toContain('cmd: npx');
          expect(output).toContain('mcp-remote');
          expect(output).toContain('https://test-be.glean.com/mcp/default');
        } else {
          const parsed = JSON.parse(output);
          // Bridge hosts don't have a 'type' field, they just have command/args
          expect(parsed.glean_default.command).toBe('npx');
          expect(parsed.glean_default.args).toContain('mcp-remote');
          expect(parsed.glean_default.args).toContain(
            'https://test-be.glean.com/mcp/default',
          );
        }
      });
    });

    test('native HTTP hosts use direct connection', () => {
      const httpHosts = ['cursor', 'vscode'];

      httpHosts.forEach((hostId) => {
        const config = registry.getConfig(hostId as ClientId);

        // Skip if admin required
        if (config?.localConfigSupport === 'none') return;

        // These should NOT require mcp-remote
        expect(config?.requiresMcpRemoteForHttp).toBe(false);

        const builder = registry.createBuilder(hostId as ClientId);
        const output = builder.buildConfiguration({
          mode: 'remote',
          serverUrl: 'https://test-be.glean.com/mcp/default',
          serverName: 'glean_default',
          includeWrapper: false,
        });

        const parsed = JSON.parse(output);
        expect(parsed.glean_default.url).toBe(
          'https://test-be.glean.com/mcp/default',
        );
      });
    });

    test('claude-code generates HTTP configuration', () => {
      const builder = registry.createBuilder('claude-code' as ClientId);
      const output = builder.buildConfiguration({
        mode: 'remote',
        serverUrl: 'https://test-be.glean.com/mcp/default',
        serverName: 'glean_default',
        includeWrapper: false,
      });

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
        mode: 'remote',
        serverUrl: 'https://test-be.glean.com/mcp/default',
        serverName: 'glean_default',
        includeWrapper: false,
      });

      const parsed = JSON.parse(config);
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
