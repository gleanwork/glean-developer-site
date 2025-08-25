import React, { useMemo } from 'react';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import { Icon } from '@site/src/components/Icons';
import MCPQuickInstaller from '@site/src/components/MCPQuickInstaller';
import { Steps, Step } from '@site/src/components/Steps';
import Card from '@site/src/components/Card';
import CardGroup from '@site/src/components/CardGroup';
import Admonition from '@theme/Admonition';
import { MCPConfigRegistry } from '@gleanwork/mcp-config-schema/browser';

export default function RemoteMCPContent() {
  const registry = useMemo(() => new MCPConfigRegistry(), []);

  const compatibilityData = useMemo(() => {
    if (!registry) return [];

    const allClients = registry.getAllConfigs();
    return allClients
      .map((client) => {
        const config = registry.getConfig(client.id);

        // Determine OAuth method based on whether the client needs mcp-remote bridge
        let oauthMethod = 'Bridge';

        // Check if client supports native HTTP without mcp-remote
        if (config?.clientSupports === 'http') {
          oauthMethod = 'Native';
        }

        // Determine configuration method based on local config support
        let configMethod = 'Quick Installer / CLI / Manual';
        if (client.id === 'chatgpt') {
          configMethod = 'Custom GPT Action';
        } else if (config?.localConfigSupport === 'none') {
          configMethod = 'Administrator Setup';
        } else if (config?.oneClick) {
          configMethod = 'One-Click / CLI / Manual';
        }

        return {
          name: client.displayName,
          oauthMethod,
          configMethod,
          hasOneClick: !!config?.oneClick,
          requiresBridge: config?.clientSupports === 'stdio-only',
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [registry]);

  return (
    <>
      <h1>
        <Icon name="mcp" iconSet="glean" className="inline" height="1.4rem" />{' '}
        Model Context Protocol (MCP) Remote Server
      </h1>

      <p className="lead">
        Connect your AI tools to Glean's enterprise knowledge base with zero
        setup required. The Remote MCP Server is built directly into Glean's
        platform, providing instant access to your organization's data through
        any MCP-compatible host application.
      </p>

      <Admonition type="info" title="Public Beta">
        <p>
          The Remote MCP Server is available to all Glean customers during the
          public beta period.
        </p>
        <p>
          <strong>General Availability:</strong> Targeting late September 2025
        </p>
      </Admonition>

      <h2>Install Now</h2>

      <p>
        Get started in seconds with our quick installer. Select your host
        application, enter your Glean instance details, and you're ready to go.
      </p>

      <MCPQuickInstaller />

      <Admonition type="tip">
        <p>
          For ChatGPT Connectors and Claude for Teams/Enterprise, administrator
          setup is required. The configurator will provide instructions when you
          select these hosts.
        </p>
      </Admonition>

      <hr />

      <h2>Common Use Cases</h2>

      <CardGroup cols={3}>
        <Card title="Enterprise Context in AI Tools" icon="BookOpen">
          <p>
            Let AI assistants securely access Glean's permission-aware knowledge
            across 100+ sources.
          </p>
        </Card>

        <Card title="Automate Developer Workflows" icon="Code">
          <p>
            Bring Glean context into code assistants (e.g., Cursor) for tasks
            like debugging, PR review, and writing better docs.
          </p>
        </Card>

        <Card title="Contextual Q&A in Chat Clients" icon="MessageCircle">
          <p>
            Use Glean Search and Chat within apps like Claude Desktop and
            ChatGPT.
          </p>
        </Card>
      </CardGroup>

      <h2>Core Capabilities</h2>

      <p>
        The remote MCP server exposes a curated set of Glean capabilities as MCP
        "tools." Administrators can enable defaults and optionally add more.
      </p>

      <h3>Default Tools</h3>

      <ul>
        <li>
          <strong>
            <code>search</code>
          </strong>{' '}
          (Search) - Search across your entire knowledge base
        </li>
        <li>
          <strong>
            <code>chat</code>
          </strong>{' '}
          (Chat) - Interactive conversations with Glean's AI
        </li>
        <li>
          <strong>
            <code>read_document</code>
          </strong>{' '}
          (Read Document) - Retrieve specific documents by ID or URL
        </li>
      </ul>

      <h3>Additional Configurable Tools</h3>

      <ul>
        <li>
          <strong>
            <code>code_search</code>
          </strong>{' '}
          (Code Search) - Search your codebase and repositories
        </li>
        <li>
          <strong>
            <code>employee_search</code>
          </strong>{' '}
          (Employee Search) - Find people and expertise in your organization
        </li>
        <li>
          <strong>
            <code>gemini_web_search</code>
          </strong>{' '}
          (Gemini Web Search) - Search the web with Gemini
        </li>
        <li>
          <strong>
            <code>gmail_search</code>
          </strong>{' '}
          (Gmail Search) - Search Gmail messages and threads
        </li>
        <li>
          <strong>
            <code>meeting_lookup</code>
          </strong>{' '}
          (Meeting Lookup) - Find meeting recordings and notes
        </li>
        <li>
          <strong>
            <code>outlook_search</code>
          </strong>{' '}
          (Outlook Search) - Search Outlook emails and calendar
        </li>
        <li>
          <strong>
            <code>web_browser</code>
          </strong>{' '}
          (Web Browser) - Browse and extract content from web pages
        </li>
      </ul>

      <Admonition type="note">
        <p>
          <strong>Transport:</strong> The server uses streamable HTTP (SSE
          retained for backward compatibility, but not recommended for new
          setups).
          <br />
          <strong>Permissions:</strong> All requests and responses inherit
          Glean's permission model; access is authorized per user and enforced
          via the Knowledge Graph.
        </p>
      </Admonition>

      <h2>Available Servers</h2>

      <p>
        During the public beta, we're providing access to two specialized MCP
        servers:
      </p>

      <Tabs>
        <TabItem value="tools" label="Tools Server (Default)">
          <p>
            The Tools Server provides unified access to Glean's core
            capabilities through a streamlined interface. This server is ideal
            for general-purpose AI interactions with your enterprise data.
          </p>

          <p>
            <strong>Endpoint:</strong>{' '}
            <code>https://[instance]-be.glean.com/mcp/default</code>
          </p>

          <p>
            <strong>Key Features:</strong>
          </p>
          <ul>
            <li>Comprehensive search across all your connected data sources</li>
            <li>Intelligent chat interactions with context awareness</li>
            <li>Document retrieval and analysis</li>
            <li>People directory search</li>
          </ul>
        </TabItem>

        <TabItem value="chatgpt" label="ChatGPT Server">
          <p>
            The ChatGPT Server is optimized specifically for ChatGPT Connectors,
            providing seamless integration with OpenAI's ChatGPT workspace.
          </p>

          <p>
            <strong>Endpoint:</strong>{' '}
            <code>https://[instance]-be.glean.com/mcp/chatgpt</code>
          </p>

          <p>
            <strong>Key Features:</strong>
          </p>
          <ul>
            <li>Conforms to OpenAI's MCP Connector spec</li>
            <li>Optimized response formatting for ChatGPT</li>
            <li>Automatic citation handling</li>
            <li>Token-efficient responses</li>
          </ul>

          <Admonition type="tip">
            <p>
              Use this endpoint specifically for ChatGPT integrations as it uses
              tool naming conventions that ChatGPT expects (e.g., "fetch"
              instead of "read_document").
            </p>
          </Admonition>
        </TabItem>
      </Tabs>

      <h2>Authentication</h2>

      <p>
        We support OAuth 2.0 for a smoother end-user connection experience, with
        Dynamic Client Registration (DCR) for native host integrations.
      </p>

      <CardGroup cols={2}>
        <Card title="Native OAuth (Recommended)" icon="Shield">
          <p>
            Spec-compliant MCP hosts connect directly to Glean's OAuth server
            via DCR (Authorization Code + PKCE).
          </p>
          <ul>
            <li>Automatic token management</li>
            <li>No manual credentials</li>
            <li>User-specific permissions</li>
          </ul>
        </Card>

        <Card title="Bridge OAuth (Fallback)" icon="Link">
          <p>
            Use a lightweight bridge (e.g., `mcp-remote`) when a host doesn't
            yet support native OAuth.
          </p>
          <ul>
            <li>Works with any host</li>
            <li>OAuth flow via bridge</li>
            <li>Transparent to end user</li>
          </ul>
        </Card>
      </CardGroup>

      <Admonition type="note" title="Advanced Authentication">
        <p>
          For hosts lacking OAuth or requiring manual auth, admins may provision
          user-scoped Client API tokens. Required scopes:
          <ul>
            <li>
              <code>MCP</code>
            </li>
            <li>
              <code>SEARCH</code>
            </li>
            <li>
              <code>CHAT</code>
            </li>
            <li>
              <code>DOCUMENTS</code>
            </li>
            <li>
              <code>TOOLS</code>
            </li>
            <li>
              <code>PEOPLE</code>
            </li>
          </ul>
        </p>
      </Admonition>

      <h2>Host Compatibility</h2>

      <p>
        MCP host compatibility is evolving. The table below reflects validated
        support and our recommended OAuth method:
      </p>

      <table>
        <thead>
          <tr>
            <th>MCP Host Application</th>
            <th>Recommended OAuth Method</th>
            <th>Configuration Method</th>
          </tr>
        </thead>
        <tbody>
          {compatibilityData.map((client, index) => (
            <tr key={index}>
              <td>{client.name}</td>
              <td>{client.oauthMethod}</td>
              <td>{client.configMethod}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Administrator Setup</h2>

      <p>
        Administrators need to enable the MCP server in the Glean Admin Console:
      </p>

      <Steps>
        <Step title="Enable OAuth Server">
          <p>
            Navigate to{' '}
            <strong>
              Admin Console → Settings → Third-party access (OAuth)
            </strong>
          </p>
          <p>
            Enable the OAuth server to allow secure authentication for MCP
            hosts.
          </p>
        </Step>

        <Step title="Enable MCP Servers">
          <p>
            Navigate to <strong>Admin Console → Platform → MCP</strong>
          </p>
          <p>Toggle on the MCP servers you want to enable:</p>
          <ul>
            <li>Tools Server (default)</li>
            <li>ChatGPT Server (for ChatGPT integrations)</li>
          </ul>
        </Step>

        <Step title="Configure Tools">
          <p>Review and configure available tools for each server:</p>
          <ul>
            <li>Default tools are enabled automatically</li>
            <li>Additional tools can be enabled as needed</li>
          </ul>
        </Step>

        <Step title="Copy Server URLs">
          <p>
            Copy the server URLs from the Admin Console to share with your
            users:
          </p>
          <ul>
            <li>
              Tools server:{' '}
              <code>https://[instance]-be.glean.com/mcp/default</code>
            </li>
            <li>
              ChatGPT: <code>https://[instance]-be.glean.com/mcp/chatgpt</code>
            </li>
          </ul>
        </Step>
      </Steps>

      <Admonition type="info">
        <p>
          The remote MCP server inherits Glean's platform guarantees and is
          covered under the DPA. Queries always enforce user permissions via the
          Knowledge Graph.
        </p>
      </Admonition>

      <hr />

      <h2>Local MCP Server</h2>

      <p>You can also use Glean's open-source stdio MCP server:</p>

      <Card title="@gleanwork/local-mcp-server" icon="GitHub">
        <p>
          Self-hosted MCP server implementation for Glean's search and chat
          capabilities
        </p>
        <p>
          <a href="https://github.com/gleanwork/mcp-server">View on GitHub</a>
        </p>
      </Card>

      <p>The local server is ideal for:</p>
      <ul>
        <li>Development and testing</li>
        <li>Air-gapped environments</li>
        <li>Custom tool development</li>
        <li>Full control over the server infrastructure</li>
      </ul>
    </>
  );
}
