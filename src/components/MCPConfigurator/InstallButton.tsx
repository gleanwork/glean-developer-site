import React, { useState } from 'react';
import {
  MCPConfigRegistry,
  type ClientId,
  buildCommand,
} from '@gleanwork/mcp-config-schema/browser';
import { CLIENT, clientNeedsMcpRemote } from '@gleanwork/mcp-config-schema';
import { toast } from 'sonner';
import styles from './styles.module.css';

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

  return path.replace('$HOME', '~').replace('%APPDATA%', '%APPDATA%');
}

interface ClientWithLogo {
  id: string;
  displayName: string;
  logo?: string;
  isAdminRequired?: boolean;

  configPath?: {
    darwin?: string;
    linux?: string;
    win32?: string;
  };
}

interface InstallButtonProps {
  client: ClientWithLogo;
  registry: MCPConfigRegistry;
  instanceName: string;
  serverName: string;
  serverUrl: string;
  onInstall: () => void;
  authToken?: string;
}

export function InstallButton({
  client,
  registry,
  instanceName,
  serverName,
  serverUrl,
  onInstall,
  authToken,
}: InstallButtonProps) {
  const [isClicked, setIsClicked] = useState(false);

  const generateDeeplink = () => {
    try {
      const config = registry.getConfig(client.id as ClientId);
      if (!config?.oneClick) return '';

      const builder = registry.createBuilder(client.id as ClientId);
      const url = builder.buildOneClickUrl({
        transport: 'http',
        serverUrl,
        serverName,
        apiToken: authToken || undefined,
      });
      return url;
    } catch (error) {
      console.error('Error generating deeplink:', error);
      return '';
    }
  };

  const handleClick = async () => {
    if (client.isAdminRequired) {
      const docUrl =
        client.id === CLIENT.CHATGPT
          ? 'https://chatgpt.com/#settings/Connectors'
          : client.id === CLIENT.CLAUDE_TEAMS_ENTERPRISE
            ? 'https://support.anthropic.com/en/articles/11724452-browsing-and-connecting-to-tools-from-the-directory'
            : 'https://developers.glean.com/docs/guides/mcp';
      window.open(docUrl, '_blank');
      toast.info('Opening setup documentation...');
      onInstall();
      return;
    }

    if (!instanceName || !serverName) {
      return;
    }

    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 2000);

    const hasOneClick = Boolean(
      registry.getConfig(client.id as ClientId)?.oneClick,
    );

    if (hasOneClick) {
      const deeplink = generateDeeplink();
      if (deeplink) {
        toast.success(`Opening ${client.displayName}...`);
        setTimeout(() => {
          window.location.href = deeplink;
        }, 500);
      }
    } else {
      if (client.id === CLIENT.CLAUDE_CODE) {
        const serverData = {
          transport: 'http' as const,
          serverUrl,
          serverName,
          apiToken: authToken || undefined,
        };
        const claudeCommand = buildCommand(
          CLIENT.CLAUDE_CODE as ClientId,
          serverData,
        );
        if (claudeCommand) {
          await navigator.clipboard.writeText(claudeCommand);
          toast.success('CLI command copied! Run it in your terminal.');
        } else {
          toast.error('Unable to generate CLI command');
        }
      } else if (client.id === CLIENT.VSCODE) {
        await navigator.clipboard.writeText(serverUrl);
        toast.success('Server URL copied! Use it to install the MCP server.');
      } else {
        try {
          if (!registry) {
            throw new Error('Registry not loaded');
          }
          const builder = registry.createBuilder(client.id as ClientId);

          const config = builder.buildConfiguration({
            transport: 'http',
            serverUrl,
            serverName,
            includeWrapper: true,
            apiToken: authToken || undefined,
          });
          const finalConfig = builder.toString(config);

          await navigator.clipboard.writeText(finalConfig);
          const configPath = getConfigPath(client);
          if (configPath) {
            toast.success(
              `Complete configuration copied! Merge it with your config at ${configPath}`,
            );
          } else {
            toast.success(
              'Complete configuration copied! Merge it with your MCP settings.',
            );
          }
        } catch (error) {
          console.error('Error generating configuration:', error);

          const fallbackConfig = {
            [serverName]: {
              type: clientNeedsMcpRemote(client.id as ClientId)
                ? 'stdio'
                : 'http',
              ...(clientNeedsMcpRemote(client.id as ClientId)
                ? {
                    command: 'npx',
                    args: authToken
                      ? [
                          '-y',
                          'mcp-remote',
                          serverUrl,
                          '--header',
                          `Authorization: Bearer ${authToken}`,
                        ]
                      : ['-y', 'mcp-remote', serverUrl],
                  }
                : {
                    url: serverUrl,
                    ...(authToken
                      ? { headers: { Authorization: `Bearer ${authToken}` } }
                      : {}),
                  }),
            },
          };
          await navigator.clipboard.writeText(
            JSON.stringify(fallbackConfig, null, 2),
          );
          const configPath = getConfigPath(client);
          if (configPath) {
            toast.success(`Configuration copied! Add it to ${configPath}`);
          } else {
            toast.success('Configuration copied! Add it to your MCP settings.');
          }
        }
      }
    }

    onInstall();
  };

  const getButtonContent = () => {
    const logoElement = client.logo ? (
      <div className={styles.buttonLogoContainer}>
        <img
          src={client.logo}
          alt={client.displayName}
          className={styles.buttonLogo}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
    ) : null;

    if (client.isAdminRequired) {
      return {
        text: `View ${client.displayName} Setup Guide`,
        subtitle: isClicked
          ? 'Opening documentation...'
          : 'Administrator setup required',
        icon: logoElement,
      };
    }

    const hasOneClickInContent = Boolean(
      registry.getConfig(client.id as ClientId)?.oneClick,
    );
    if (hasOneClickInContent) {
      return {
        text: `Install in ${client.displayName}`,
        subtitle: isClicked
          ? `Opening ${client.displayName}...`
          : 'One-click installation',
        icon: logoElement,
      };
    }

    if (client.id === CLIENT.CLAUDE_CODE) {
      return {
        text: `Get CLI Command for ${client.displayName}`,
        subtitle: isClicked
          ? 'Command copied! Run: claude mcp add ...'
          : 'Click to copy `claude mcp add ...` command',
        icon: logoElement,
      };
    }

    if (client.id === CLIENT.VSCODE) {
      return {
        text: `Copy Server URL for ${client.displayName}`,
        subtitle: isClicked
          ? 'Server URL copied! Use it to install the MCP server.'
          : 'Click to copy server URL',
        icon: logoElement,
      };
    }

    return {
      text: `Configure ${client.displayName}`,
      subtitle: isClicked
        ? 'Configuration copied! Add to your MCP settings.'
        : 'Click to copy config',
      icon: logoElement,
    };
  };

  const content = getButtonContent();
  const isDisabled = !instanceName && !client.isAdminRequired;

  const buttonClass = `
    ${styles.installButton} 
    ${styles.primary} 
    ${isDisabled ? styles.disabled : ''}
    ${isClicked ? styles.clicked : ''}
  `.trim();

  return (
    <button
      className={buttonClass}
      onClick={handleClick}
      disabled={isDisabled}
      type="button"
    >
      <div className={styles.buttonContent}>
        {content.icon}
        <div className={styles.buttonText}>
          <span className={styles.buttonMain}>{content.text}</span>
          {content.subtitle && (
            <span className={styles.buttonSubtitle}>{content.subtitle}</span>
          )}
        </div>
      </div>
      {Boolean(registry.getConfig(client.id as ClientId)?.oneClick) ? (
        <span className={styles.buttonArrow}>→</span>
      ) : (
        <svg
          className={styles.copyIcon}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2 0v8h8V2H6z" />
          <path d="M2 6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2H8v2H2V8h2V6H2z" />
        </svg>
      )}
    </button>
  );
}
