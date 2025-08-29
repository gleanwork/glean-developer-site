import React, { useState, useEffect, useMemo, useContext } from 'react';
import {
  CLIENT,
  MCPConfigRegistry,
  type ClientId,
} from '@gleanwork/mcp-config-schema/browser';
import { buildMcpServerName } from '@gleanwork/mcp-config-schema';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import { Toaster, toast } from 'sonner';
import styles from './styles.module.css';
import { InstallButton } from './InstallButton';
import { FeatureFlagsContext } from '@site/src/theme/Root';

const CLIENT_LOGOS: Record<string, string> = {
  [CLIENT.CLAUDE_CODE]: '/img/mcp-clients/claude.png',
  [CLIENT.VSCODE]: '/img/mcp-clients/vscode.png',
  [CLIENT.CLAUDE_DESKTOP]: '/img/mcp-clients/claude.png',
  [CLIENT.CLAUDE_TEAMS_ENTERPRISE]: '/img/mcp-clients/claude.png',
  [CLIENT.CURSOR]: '/img/mcp-clients/cursor.png',
  [CLIENT.GOOSE]: '/img/mcp-clients/goose.png',
  [CLIENT.WINDSURF]: '/img/mcp-clients/windsurf.png',
  [CLIENT.CHATGPT]: '/img/mcp-clients/chatgpt.png',
};

function getPlatform(): 'darwin' | 'linux' | 'win32' | undefined {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('mac')) {
    return 'darwin';
  } else if (userAgent.includes('win')) {
    return 'win32';
  } else if (userAgent.includes('linux')) {
    return 'linux';
  }

  return undefined;
}

function getConfigPath(
  client: any,
  platform?: 'darwin' | 'linux' | 'win32',
): string | undefined {
  const currentPlatform = platform || getPlatform();
  if (!currentPlatform || !client.configPath) {
    return undefined;
  }

  const path = client.configPath[currentPlatform];
  if (!path) {
    return undefined;
  }

  // Replace environment variables with actual values for display
  return path.replace('$HOME', '~').replace('%APPDATA%', '%APPDATA%');
}

export default function MCPConfigurator() {
  const registry = useMemo(() => new MCPConfigRegistry(), []);
  const { isEnabled, flagConfigs } = useContext(FeatureFlagsContext);
  const showClaudeTeams = isEnabled('show-claude-teams');

  const cliPackageVersion = flagConfigs['mcp-cli-version']?.metadata
    ?.version as string | undefined;

  const allClients = useMemo(() => {
    if (!registry) return [];

    const allRegistryClients = registry.getAllConfigs();

    return allRegistryClients
      .filter(
        (client) =>
          showClaudeTeams || client.id !== CLIENT.CLAUDE_TEAMS_ENTERPRISE,
      )
      .map((client) => ({
        ...client,
        logo: CLIENT_LOGOS[client.id] || '/img/mcp-clients/default.png',

        isAdminRequired: client.localConfigSupport === 'none',
      }));
  }, [registry, showClaudeTeams]);

  const [selectedClientId, setSelectedClientId] = useState<string>(
    CLIENT.CLAUDE_CODE,
  );
  const [instanceName, setInstanceName] = useState('');
  const [serverName, setServerName] = useState('default');
  const [authMethod, setAuthMethod] = useState<'oauth' | 'bearer'>('oauth');
  const [authToken, setAuthToken] = useState('');
  const [serverStatus, setServerStatus] = useState<
    'idle' | 'checking' | 'reachable' | 'unreachable'
  >('idle');
  const [statusMessage, setStatusMessage] = useState('');

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

  const fullServerName = useMemo(
    () => buildMcpServerName({ serverName }),
    [serverName],
  );

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);

    if (clientId === CLIENT.CHATGPT) {
      setServerName('chatgpt');
    } else if (serverName === 'chatgpt') {
      setServerName('default');
    }
  };

  const handleInstallClick = () => {};

  // Check server reachability when URL is complete
  useEffect(() => {
    if (!serverUrl) {
      setServerStatus('idle');
      setStatusMessage('');
      return;
    }

    const checkReachability = async () => {
      setServerStatus('checking');
      setStatusMessage('');

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(serverUrl, {
          method: 'HEAD',
          signal: controller.signal,
          mode: 'no-cors', // Use no-cors to avoid CORS issues
        });

        clearTimeout(timeoutId);

        // With no-cors, we can't read the status, but if fetch succeeds, server exists
        setServerStatus('reachable');
        setStatusMessage('Server endpoint detected');
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            setServerStatus('unreachable');
            setStatusMessage('Connection timeout');
          } else {
            // Try a more permissive check - just see if we can reach the domain
            try {
              const url = new URL(serverUrl);
              const baseUrl = `${url.protocol}//${url.host}`;

              const response = await fetch(baseUrl, {
                method: 'HEAD',
                mode: 'no-cors',
              });

              // If we can reach the domain, assume the endpoint exists
              setServerStatus('reachable');
              setStatusMessage('Server endpoint detected');
            } catch {
              setServerStatus('unreachable');
              setStatusMessage('Unable to reach server');
            }
          }
        }
      }
    };

    const debounceTimer = setTimeout(checkReachability, 500);
    return () => clearTimeout(debounceTimer);
  }, [serverUrl]);

  useEffect(() => {
    const firstClient = allClients[0];
    if (firstClient) {
      setSelectedClientId(firstClient.id);

      if (firstClient.id === CLIENT.CHATGPT) {
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
                  disabled={selectedClientId === CLIENT.CHATGPT}
                />
                <small className={styles.hint}>MCP server endpoint</small>
              </div>
            </div>
          </div>

          {selectedClientId !== CLIENT.CHATGPT &&
            selectedClientId !== CLIENT.CLAUDE_TEAMS_ENTERPRISE && (
              <div className={styles.formGroup}>
                <label htmlFor="auth-method" className={styles.label}>
                  Authentication Method
                </label>
                <div className={styles.selectWrapper}>
                  <select
                    id="auth-method"
                    value={authMethod}
                    onChange={(e) =>
                      setAuthMethod(e.target.value as 'oauth' | 'bearer')
                    }
                    className={styles.select}
                  >
                    <option value="oauth">OAuth (Recommended)</option>
                    <option value="bearer">Bearer Token</option>
                  </select>
                  <span className={styles.selectArrow}>▼</span>
                </div>
                <small className={styles.hint}>
                  {authMethod === 'oauth'
                    ? 'Uses Dynamic Client Registration for automatic authentication'
                    : 'Requires a manually generated API token from Glean'}
                </small>
              </div>
            )}

          {authMethod === 'bearer' &&
            selectedClientId !== CLIENT.CHATGPT &&
            selectedClientId !== CLIENT.CLAUDE_TEAMS_ENTERPRISE && (
              <div className={styles.formGroup}>
                <label htmlFor="auth-token" className={styles.label}>
                  Bearer Token
                </label>
                <input
                  id="auth-token"
                  type="password"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  placeholder="Enter your Glean API token"
                  className={styles.input}
                />
                <small className={styles.hint}>
                  {!selectedClient.requiresMcpRemoteForHttp
                    ? 'Will be added as Authorization header'
                    : 'Will be set as GLEAN_API_TOKEN environment variable'}
                </small>
              </div>
            )}

          <div className={styles.serverUrlSection}>
            <div className={styles.serverUrlHeader}>
              <label className={styles.serverUrlLabel}>Server URL</label>
              {serverStatus !== 'idle' && (
                <span className={styles.serverStatus}>
                  {serverStatus === 'checking' && (
                    <>
                      <span className={styles.statusSpinner} />
                      <span className={styles.statusText}>Checking...</span>
                    </>
                  )}
                  {serverStatus === 'reachable' && (
                    <>
                      <span className={styles.statusIcon}>✓</span>
                      <span className={styles.statusTextSuccess}>
                        {statusMessage}
                      </span>
                    </>
                  )}
                  {serverStatus === 'unreachable' && (
                    <>
                      <span className={styles.statusIconError}>✗</span>
                      <span className={styles.statusTextError}>
                        {statusMessage}
                      </span>
                    </>
                  )}
                </span>
              )}
            </div>
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
                {selectedClient.id === CLIENT.CHATGPT
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
              authToken={authMethod === 'bearer' ? authToken : ''}
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
                          const packageName = cliPackageVersion
                            ? `@gleanwork/configure-mcp-server@${cliPackageVersion}`
                            : '@gleanwork/configure-mcp-server';

                          let cliCommand =
                            selectedClientId === CLIENT.CLAUDE_CODE
                              ? `claude mcp add ${fullServerName} ${serverUrl || 'https://[instance]-be.glean.com/mcp/[endpoint]'} --transport http`
                              : `npx ${packageName} remote --url ${serverUrl || 'https://[instance]-be.glean.com/mcp/[endpoint]'} --client ${selectedClientId}`;

                          // Add bearer token to Claude Code command if present
                          if (
                            selectedClientId === CLIENT.CLAUDE_CODE &&
                            authMethod === 'bearer' &&
                            authToken
                          ) {
                            cliCommand += ` --header "Authorization: Bearer ${authToken}"`;
                          }

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
                          {selectedClientId === CLIENT.CLAUDE_CODE
                            ? `claude mcp add ${fullServerName} ${serverUrl || 'https://[instance]-be.glean.com/mcp/[endpoint]'} --transport http${
                                authMethod === 'bearer' && authToken
                                  ? ` \\
   --header "Authorization: Bearer ${authToken}"`
                                  : ''
                              }`
                            : `npx ${cliPackageVersion ? `@gleanwork/configure-mcp-server@${cliPackageVersion}` : '@gleanwork/configure-mcp-server'} remote \\
   --url ${serverUrl || 'https://[instance]-be.glean.com/mcp/[endpoint]'} \\
   --client ${selectedClientId}${
     authMethod === 'bearer' && authToken
       ? ` \\
   --token ${authToken}`
       : ''
   }`}
                        </code>
                      </pre>
                    </div>
                    <p className={styles.cliHelp}>
                      {selectedClientId === CLIENT.CLAUDE_CODE
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
                    {(() => {
                      const configPath = getConfigPath(selectedClient);
                      if (configPath) {
                        return (
                          <div className={styles.configPathInfo}>
                            <small className={styles.configPathLabel}>
                              Config file location:
                            </small>
                            <code className={styles.configPath}>
                              {configPath}
                            </code>
                          </div>
                        );
                      }
                      return null;
                    })()}
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

                              // Generate config with auth token if provided
                              const config = builder.buildConfiguration({
                                transport: 'http',
                                serverUrl,
                                serverName: fullServerName,
                                includeWrapper: false,
                                apiToken:
                                  authMethod === 'bearer' && authToken
                                    ? authToken
                                    : undefined,
                              });
                              return builder.toString(config);
                            } catch (e) {
                              console.error('Config generation error:', e);
                              return JSON.stringify(
                                {
                                  [fullServerName]:
                                    selectedClient.requiresMcpRemoteForHttp
                                      ? {
                                          type: 'stdio',
                                          command: 'npx',
                                          args:
                                            authMethod === 'bearer' && authToken
                                              ? [
                                                  '-y',
                                                  'mcp-remote',
                                                  serverUrl ||
                                                    'https://[instance]-be.glean.com/mcp/[endpoint]',
                                                  '--header',
                                                  `Authorization: Bearer ${authToken}`,
                                                ]
                                              : [
                                                  '-y',
                                                  'mcp-remote',
                                                  serverUrl ||
                                                    'https://[instance]-be.glean.com/mcp/[endpoint]',
                                                ],
                                        }
                                      : {
                                          type: 'http',
                                          url:
                                            serverUrl ||
                                            'https://[instance]-be.glean.com/mcp/[endpoint]',
                                          ...(authMethod === 'bearer' &&
                                          authToken
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
                API token instead, chose the <strong>Bearer Token</strong>{' '}
                option under <strong>Authentication Method</strong>.
              </p>
            </div>
          </details>
        </div>
      </div>
    </>
  );
}
