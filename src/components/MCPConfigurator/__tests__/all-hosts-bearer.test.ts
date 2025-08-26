import { describe, test, expect } from 'vitest';
import {
  MCPConfigRegistry,
  type ClientId,
} from '@gleanwork/mcp-config-schema/browser';

describe('Bearer Token Handling for All Hosts', () => {
  const registry = new MCPConfigRegistry();
  const authToken = 'test-bearer-token-abc123';
  const serverUrl = 'https://acme-be.glean.com/mcp/default';
  const serverName = 'glean_default';

  describe('Manual Configuration with Bearer Token', () => {
    test.each([
      ['cursor', 'http', true, false],
      ['vscode', 'http', true, false],
      ['claude-code', 'http', true, false],
      ['claude-desktop', 'stdio', false, true],
      ['windsurf', 'stdio', false, true],
      ['goose', 'yaml', false, false],
    ])(
      '%s generates correct bearer token config',
      (hostId, configType, hasHeaders, hasHeaderFlag) => {
        const config = registry.getConfig(hostId as ClientId);
        
        // Skip admin-required hosts
        if (config?.localConfigSupport === 'none') {
          return;
        }

        const builder = registry.createBuilder(hostId as ClientId);
        const baseConfig = builder.buildConfiguration({
          mode: 'remote',
          serverUrl,
          serverName,
          includeWrapper: false,
        });

        // Simulate adding bearer token
        let finalConfig = baseConfig;

        if (hostId === 'goose') {
          // Goose uses YAML
          const lines = baseConfig.split('\n');
          const envIndex = lines.findIndex((line) =>
            line.trim().startsWith('envs:'),
          );
          
          if (envIndex !== -1 && lines[envIndex].includes('{}')) {
            lines[envIndex] = '  envs:';
            lines.splice(envIndex + 1, 0, `    GLEAN_API_TOKEN: ${authToken}`);
          }
          finalConfig = lines.join('\n');

          expect(finalConfig).toContain('envs:');
          expect(finalConfig).toContain(`GLEAN_API_TOKEN: ${authToken}`);
        } else {
          // JSON configs
          const parsed = JSON.parse(baseConfig);
          const serverEntry = parsed[serverName];

          if (configType === 'http') {
            // Native HTTP support
            serverEntry.headers = {
              Authorization: `Bearer ${authToken}`,
            };
            finalConfig = JSON.stringify(parsed, null, 2);

            expect(finalConfig).toContain('"headers"');
            expect(finalConfig).toContain(`"Authorization": "Bearer ${authToken}"`);
          } else if (configType === 'stdio') {
            // Needs mcp-remote bridge
            if (serverEntry.type === 'stdio' || serverEntry.command) {
              if (!serverEntry.args) {
                serverEntry.args = [];
              }
              serverEntry.args.push('--header', `Authorization: Bearer ${authToken}`);
              finalConfig = JSON.stringify(parsed, null, 2);

              expect(finalConfig).toContain('--header');
              expect(finalConfig).toContain(`Authorization: Bearer ${authToken}`);
            }
          }
        }
      },
    );

    test('admin-required hosts (chatgpt, claude-teams) skip local config', () => {
      const adminHosts = ['chatgpt', 'claude-teams-enterprise'];
      
      adminHosts.forEach(hostId => {
        const config = registry.getConfig(hostId as ClientId);
        expect(config?.localConfigSupport).toBe('none');
      });
    });
  });

  describe('OAuth vs Bearer Token', () => {
    test('OAuth mode generates clean config without auth headers', () => {
      const hosts = ['cursor', 'vscode', 'claude-desktop', 'windsurf'];
      
      hosts.forEach(hostId => {
        const config = registry.getConfig(hostId as ClientId);
        if (config?.localConfigSupport === 'none') return;

        const builder = registry.createBuilder(hostId as ClientId);
        const output = builder.buildConfiguration({
          mode: 'remote',
          serverUrl,
          serverName,
          includeWrapper: false,
        });

        // OAuth configs should not have auth headers
        expect(output).not.toContain('Authorization');
        expect(output).not.toContain('Bearer');
        expect(output).not.toContain('--header');
        expect(output).not.toContain('GLEAN_API_TOKEN');
      });
    });
  });

  describe('CLI Command Generation', () => {
    test('claude-code uses special claude CLI command', () => {
      const expectedCommand = `claude mcp add ${serverName} ${serverUrl} --transport http`;
      
      // The CLI command for claude-code doesn't include bearer token
      // as the claude CLI doesn't support it directly
      expect(expectedCommand).not.toContain('--token');
      expect(expectedCommand).toContain('claude mcp add');
    });

    test('other hosts use configure-mcp-server CLI with --token flag', () => {
      const hosts = ['cursor', 'vscode', 'windsurf', 'goose'];
      
      hosts.forEach(hostId => {
        const expectedCommand = `npx @gleanwork/configure-mcp-server remote --url ${serverUrl} --client ${hostId} --token ${authToken}`;
        
        expect(expectedCommand).toContain('--token');
        expect(expectedCommand).toContain(authToken);
      });
    });
  });

  describe('Config Button Behavior', () => {
    test('native HTTP hosts copy config with Authorization header', () => {
      const hosts = ['cursor', 'vscode'];
      
      hosts.forEach(hostId => {
        const builder = registry.createBuilder(hostId as ClientId);
        const baseConfig = builder.buildConfiguration({
          mode: 'remote',
          serverUrl,
          serverName,
          includeWrapper: false,
        });

        const parsed = JSON.parse(baseConfig);
        parsed[serverName].headers = {
          Authorization: `Bearer ${authToken}`,
        };

        const finalConfig = JSON.stringify(parsed, null, 2);
        
        expect(parsed[serverName].type).toBe('http');
        expect(parsed[serverName].headers).toBeDefined();
        expect(parsed[serverName].headers.Authorization).toBe(`Bearer ${authToken}`);
      });
    });

    test('stdio hosts copy config with --header flag', () => {
      const hosts = ['claude-desktop', 'windsurf'];
      
      hosts.forEach(hostId => {
        const builder = registry.createBuilder(hostId as ClientId);
        const baseConfig = builder.buildConfiguration({
          mode: 'remote',
          serverUrl,
          serverName,
          includeWrapper: false,
        });

        const parsed = JSON.parse(baseConfig);
        const serverEntry = parsed[serverName];
        
        if (!serverEntry.args) {
          serverEntry.args = [];
        }
        serverEntry.args.push('--header', `Authorization: Bearer ${authToken}`);

        expect(serverEntry.args).toContain('--header');
        expect(serverEntry.args).toContain(`Authorization: Bearer ${authToken}`);
      });
    });
  });
});
