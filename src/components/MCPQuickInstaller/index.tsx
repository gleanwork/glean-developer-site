import React, { useState, useEffect, useMemo } from 'react';
import {
  MCPConfigRegistry,
  type ClientId,
} from '@gleanwork/mcp-config-schema/browser';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import { Toaster, toast } from 'sonner';
import styles from './styles.module.css';
import { InstallButton } from './InstallButton';

// Map client IDs to logo paths
const CLIENT_LOGOS: Record<string, string> = {
  'claude-code': '/img/mcp-clients/claude.png',
  vscode: '/img/mcp-clients/vscode.png',
  'claude-desktop': '/img/mcp-clients/claude.png',
  'claude-teams-enterprise': '/img/mcp-clients/claude.png',
  cursor: '/img/mcp-clients/cursor.png',
  goose: '/img/mcp-clients/goose.png',
  windsurf: '/img/mcp-clients/windsurf.png',
  chatgpt: '/img/mcp-clients/chatgpt.png',
};

export default function MCPQuickInstaller() {
  const registry = useMemo(() => new MCPConfigRegistry(), []);

  const allClients = useMemo(() => {
    if (!registry) return [];

    const allRegistryClients = registry.getAllConfigs();

    return allRegistryClients.map((client) => ({
      ...client,
      logo: CLIENT_LOGOS[client.id] || '/img/mcp-clients/default.png',

      isAdminRequired: client.localConfigSupport === 'none',
    }));
  }, [registry]);

  const [selectedClientId, setSelectedClientId] =
    useState<string>('claude-code');
  const [instanceName, setInstanceName] = useState('');
  const [serverName, setServerName] = useState('default');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [authToken, setAuthToken] = useState('');

  const selectedClient = useMemo(() => {
    const client =
      allClients.find((c) => c.id === selectedClientId) || allClients[0];
    if (!client) return null;

    return {
      ...client,
      logo:
        client.logo ||
        CLIENT_LOGOS[client.id] ||
        '/img/mcp-clients/default.png',
      isAdminRequired:
        'isAdminRequired' in client ? client.isAdminRequired : false,
      oneClick: 'oneClick' in client ? (client as any).oneClick : undefined,
    };
  }, [selectedClientId, allClients]);

  const serverUrl = useMemo(
    () =>
      instanceName && serverName
        ? `https://${instanceName}-be.glean.com/mcp/${serverName}`
        : '',
    [instanceName, serverName],
  );

  const fullServerName = useMemo(() => `glean_${serverName}`, [serverName]);

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);

    if (clientId === 'chatgpt') {
      setServerName('chatgpt');
    } else if (serverName === 'chatgpt') {
      setServerName('default');
    }
  };

  const handleInstallClick = () => {};

  useEffect(() => {
    const firstClient = allClients[0];
    if (firstClient) {
      setSelectedClientId(firstClient.id);

      if (firstClient.id === 'chatgpt') {
        setServerName('chatgpt');
      }
    }
  }, [allClients]);

  if (!selectedClient) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Quick Install Remote MCP Server</h2>
          <p className={styles.subtitle}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Quick Install Remote MCP Server</h2>
          <p className={styles.subtitle}>
            Get connected in seconds with our MCP Host configurator
          </p>
        </div>

        <div className={styles.configSection}>
          <div className={styles.formGroup}>
            <label htmlFor="client-select" className={styles.label}>
              Select Your Host Application
            </label>
            <div className={styles.selectWrapper}>
              <select
                id="client-select"
                value={selectedClientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className={styles.select}
              >
                {allClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.displayName}
                  </option>
                ))}
              </select>
              <span className={styles.selectArrow}>▼</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Configure Server URL</label>
            <div className={styles.urlConfig}>
              <div>
                <input
                  id="instance-name"
                  type="text"
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  placeholder="Instance name (e.g., acme)"
                  className={styles.input}
                />
                <small className={styles.hint}>
                  Your company's Glean instance
                </small>
              </div>
              <div>
                <input
                  id="server-name"
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="Server (e.g., default)"
                  className={styles.input}
                  disabled={selectedClientId === 'chatgpt'}
                />
                <small className={styles.hint}>MCP server endpoint</small>
              </div>
            </div>
          </div>

          <div className={styles.advancedSection}>
            <button
              className={styles.advancedToggle}
              onClick={() => setShowAdvanced(!showAdvanced)}
              type="button"
            >
              <span className={styles.advancedToggleIcon}>
                {showAdvanced ? '▼' : '▶'}
              </span>
              Advanced Settings (Optional)
            </button>

            {showAdvanced && (
              <div className={styles.advancedContent}>
                <div className={styles.advancedInfo}>
                  <p>
                    <strong>Default:</strong> OAuth with Dynamic Client
                    Registration (recommended)
                  </p>
                  <p>
                    Only add a token below if you want to use bearer token
                    authentication instead of OAuth.
                  </p>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="auth-token">Bearer Token (Optional)</label>
                  <input
                    id="auth-token"
                    type="password"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    placeholder="Leave empty for OAuth/DCR"
                    className={styles.input}
                  />
                  <small className={styles.inputHelp}>
                    {!selectedClient.requiresMcpRemoteForHttp
                      ? 'Will be added as Authorization header'
                      : 'Will be set as GLEAN_API_TOKEN environment variable'}
                  </small>
                </div>
              </div>
            )}
          </div>

          <div className={styles.serverUrlSection}>
            <label className={styles.serverUrlLabel}>Server URL</label>
            <div className={styles.serverUrlField}>
              <input
                type="text"
                value={
                  serverUrl || 'https://[instance]-be.glean.com/mcp/[endpoint]'
                }
                readOnly
                className={styles.serverUrlInput}
                onClick={(e) => e.currentTarget.select()}
                style={{ opacity: serverUrl ? 1 : 0.5 }}
              />
              <button
                className={styles.serverUrlCopy}
                onClick={() => {
                  if (serverUrl) {
                    navigator.clipboard.writeText(serverUrl);
                    toast.success('Server URL copied to clipboard!');
                  }
                }}
                title="Copy server URL"
                type="button"
                disabled={!serverUrl}
                style={{ opacity: serverUrl ? 1 : 0.3 }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2 0v8h8V2H6z" />
                  <path d="M2 6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2H8v2H2V8h2V6H2z" />
                </svg>
              </button>
            </div>
            {selectedClient.isAdminRequired && serverUrl && (
              <small className={styles.serverUrlHelp}>
                {selectedClient.id === 'chatgpt'
                  ? 'Share this URL with your ChatGPT administrator'
                  : 'Share this URL with your organization administrator'}
              </small>
            )}
          </div>
        </div>

        <div className={styles.installSection}>
          {selectedClient.isAdminRequired ? (
            <InstallButton
              client={selectedClient}
              registry={registry}
              instanceName={instanceName}
              serverName={fullServerName}
              serverUrl={serverUrl}
              onInstall={handleInstallClick}
              authToken={authToken}
            />
          ) : (
            <Tabs className={styles.installTabs}>
              <TabItem value="quick" label="Quick Setup" default>
                <div className={styles.tabContent}>
                  <InstallButton
                    client={selectedClient}
                    registry={registry}
                    instanceName={instanceName}
                    serverName={fullServerName}
                    serverUrl={serverUrl}
                    onInstall={handleInstallClick}
                    authToken={authToken}
                  />
                </div>
              </TabItem>

              <TabItem value="cli" label="CLI Command">
                <div className={styles.tabContent}>
                  <div className={styles.cliCommand}>
                    <div className={styles.cliHeader}>
                      <h4 className={styles.cliTitle}>
                        CLI Installation Command
                      </h4>
                      <button
                        className={styles.copyConfigIcon}
                        onClick={() => {
                          const cliCommand =
                            selectedClientId === 'claude-code'
                              ? `claude mcp add ${fullServerName} ${serverUrl || 'https://[instance]-be.glean.com/mcp/[endpoint]'} --transport http`
                              : `npx @gleanwork/configure-mcp-server remote --url ${serverUrl || 'https://[instance]-be.glean.com/mcp/[endpoint]'} --client ${selectedClientId}${authToken ? ` --token ${authToken}` : ''}`;
                          navigator.clipboard.writeText(cliCommand);
                          toast.success('CLI command copied to clipboard!');
                        }}
                        title="Copy CLI command"
                        type="button"
                        disabled={!instanceName || !serverName}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2 0v8h8V2H6z" />
                          <path d="M2 6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2H8v2H2V8h2V6H2z" />
                        </svg>
                      </button>
                    </div>
                    <div className={styles.cliCode}>
                      <pre>
                        <code>
                          {selectedClientId === 'claude-code'
                            ? `claude mcp add ${fullServerName} ${serverUrl || 'https://[instance]-be.glean.com/mcp/[endpoint]'} --transport http`
                            : `npx @gleanwork/configure-mcp-server remote \\
  --url ${serverUrl || 'https://[instance]-be.glean.com/mcp/[endpoint]'} \\
  --client ${selectedClientId}${
    authToken
      ? ` \\
  --token ${authToken}`
      : ''
  }`}
                        </code>
                      </pre>
                    </div>
                    <p className={styles.cliHelp}>
                      {selectedClientId === 'claude-code'
                        ? `Run this command in your terminal to add the MCP server to ${selectedClient.displayName}.`
                        : `Run this command in your terminal to configure ${selectedClient.displayName} automatically.`}
                    </p>
                  </div>
                </div>
              </TabItem>

              <TabItem value="manual" label="Manual Config">
                <div className={styles.tabContent}>
                  <div className={styles.manualConfig}>
                    <div className={styles.manualHeader}>
                      <h4 className={styles.manualTitle}>
                        Configuration Preview
                      </h4>
                      <button
                        className={styles.copyConfigIcon}
                        onClick={() => {
                          const configElement = document.querySelector(
                            `.${styles.configCode} code`,
                          );
                          if (configElement) {
                            navigator.clipboard.writeText(
                              configElement.textContent || '',
                            );
                            toast.success('Configuration copied to clipboard!');
                          }
                        }}
                        title="Copy configuration"
                        type="button"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2 0v8h8V2H6z" />
                          <path d="M2 6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2H8v2H2V8h2V6H2z" />
                        </svg>
                      </button>
                    </div>
                    <div className={styles.configCode}>
                      <pre>
                        <code>
                          {(() => {
                            try {
                              if (!registry || !serverUrl) {
                                return JSON.stringify(
                                  {
                                    [fullServerName]: {
                                      type: selectedClient.requiresMcpRemoteForHttp
                                        ? 'stdio'
                                        : 'http',
                                      '...': `Complete the 'Configure Server URL' section above`,
                                    },
                                  },
                                  null,
                                  2,
                                );
                              }

                              const builder = registry.createBuilder(
                                selectedClient.id as ClientId,
                              );
                              const config = builder.buildConfiguration({
                                mode: 'remote',
                                serverUrl,
                                serverName: fullServerName,
                                apiToken: authToken || undefined,
                                includeWrapper: false,
                              });

                              if (selectedClient.id === 'goose') {
                                return config;
                              }

                              try {
                                const parsed = JSON.parse(config);
                                return JSON.stringify(parsed, null, 2);
                              } catch {
                                return config;
                              }
                            } catch (e) {
                              console.error('Config generation error:', e);
                              return JSON.stringify(
                                {
                                  [fullServerName]:
                                    selectedClient.requiresMcpRemoteForHttp
                                      ? {
                                          type: 'stdio',
                                          command: 'npx',
                                          args: [
                                            '-y',
                                            'mcp-remote',
                                            serverUrl ||
                                              'https://[instance]-be.glean.com/mcp/[endpoint]',
                                          ],
                                          ...(authToken
                                            ? {
                                                env: {
                                                  GLEAN_API_TOKEN: authToken,
                                                },
                                              }
                                            : {}),
                                        }
                                      : {
                                          type: 'http',
                                          url:
                                            serverUrl ||
                                            'https://[instance]-be.glean.com/mcp/[endpoint]',
                                          ...(authToken
                                            ? {
                                                headers: {
                                                  Authorization: `Bearer ${authToken}`,
                                                },
                                              }
                                            : {}),
                                        },
                                },
                                null,
                                2,
                              );
                            }
                          })()}
                        </code>
                      </pre>
                    </div>
                  </div>
                </div>
              </TabItem>
            </Tabs>
          )}
        </div>

        <div className={styles.helpSection}>
          <details className={styles.helpDetails}>
            <summary className={styles.helpSummary}>
              How does this work?
            </summary>
            <div className={styles.helpContent}>
              <p>
                The Remote MCP Server connects your AI tools directly to Glean's
                search and knowledge platform. Installation is simple:
              </p>
              <ul>
                <li>
                  <strong>Configurator:</strong> Use our configurator to quickly
                  generate the MCP server configuration.
                </li>
                <li>
                  <strong>CLI configuration:</strong> Use our CLI tool to
                  automatically configure supported hosts from your terminal.
                </li>
                <li>
                  <strong>Manual configuration:</strong> Copy the generated
                  configuration to your host's settings file.
                </li>
                <li>
                  <strong>Administrator setup:</strong> ChatGPT Connectors and
                  Claude for Teams/Enterprise require your admin to install
                  first - no local configuration needed.
                </li>
              </ul>
              <p>
                By default, authentication uses OAuth with Dynamic Client
                Registration (DCR) - no API keys needed. If you need to use an
                API token instead, expand the Advanced Settings above.
              </p>
            </div>
          </details>
        </div>
      </div>
    </>
  );
}
