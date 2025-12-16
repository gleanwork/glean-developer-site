import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';
import { getBuildTimeFlags } from './src/utils/buildTimeFlags';
import { flagsSnapshotToBooleans } from './src/lib/featureFlags';
import { filterByFeatureFlags } from './src/utils/filtering';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const rawFlags = getBuildTimeFlags();
const boolFlags = flagsSnapshotToBooleans(rawFlags, {});

const baseSidebars: SidebarsConfig = {
  docSidebar: [
    {
      type: 'category',
      label: 'Get Started',
      collapsible: false,
      collapsed: false,
      items: [
        {
          type: 'doc',
          id: 'get-started/home',
          label: 'Home',
          customProps: {
            icon: 'Home',
            iconSet: 'feather',
          },
        },
        {
          type: 'doc',
          id: 'get-started/key-terms',
          label: 'Key Terms',
          customProps: {
            icon: 'FileText',
            iconSet: 'feather',
          },
        },
        {
          type: 'doc',
          id: 'get-started/authentication',
          label: 'Authentication Overview',
          customProps: {
            icon: 'Shield',
            iconSet: 'feather',
          },
        },
        {
          type: 'doc',
          id: 'get-started/rate-limits',
          label: 'Rate Limits',
          customProps: {
            icon: 'Activity',
            iconSet: 'feather',
          },
        },
        {
          type: 'doc',
          id: 'changelog/index',
          label: 'Changelog',
          customProps: {
            icon: 'Rss',
            iconSet: 'feather',
          },
        },
        {
          type: 'category',
          label: 'Deprecations',
          customProps: {
            icon: 'AlertTriangle',
            iconSet: 'feather',
            flag: 'x-glean-deprecated',
          },
          items: [
            {
              type: 'doc',
              id: 'deprecations/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'deprecations/index',
              label: 'Deprecation List',
            },
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsible: false,
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Chat',
          customProps: {
            icon: 'chat',
            iconSet: 'glean',
          },
          items: [
            {
              type: 'doc',
              id: 'guides/chat/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'guides/chat/chatbot-example',
              label: 'Chatbot Example',
            },
            {
              type: 'doc',
              id: 'guides/chat/deep-linked-citations',
              label: 'Deep Linked Citations',
            },
          ],
        },
        {
          type: 'category',
          label: 'Search',
          customProps: {
            icon: 'Search',
            iconSet: 'feather',
          },
          items: [
            {
              type: 'doc',
              id: 'guides/search/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'guides/search/filtering-results',
              label: 'Filtering Results',
            },
            {
              type: 'doc',
              id: 'guides/search/datasource-filters',
              label: 'Datasource Filters',
            },
            {
              type: 'doc',
              id: 'guides/search/faceted-filters',
              label: 'Faceted Filtering',
            },
            {
              type: 'doc',
              id: 'guides/search/llm-content',
              label: 'LLM Snippets',
            },
          ],
        },
        {
          type: 'category',
          label: 'Agents',
          customProps: {
            icon: 'agent',
            iconSet: 'glean',
          },
          items: [
            {
              type: 'doc',
              id: 'guides/agents/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'guides/agents/direct-api',
              label: 'Direct API Integration',
            },
            {
              type: 'doc',
              id: 'guides/agents/langchain',
              label: 'LangChain Integration',
            },
            {
              type: 'doc',
              id: 'guides/agents/toolkit',
              label: 'Agent Toolkit',
            },
            {
              type: 'doc',
              id: 'guides/agents/nvidia-example',
              label: 'NVIDIA NIM Example',
            },
          ],
        },
        {
          type: 'category',
          label: 'Actions',
          customProps: {
            icon: 'Zap',
            iconSet: 'feather',
          },
          items: [
            {
              type: 'doc',
              id: 'guides/actions/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'guides/actions/authentication',
              label: 'Authentication',
            },
            {
              type: 'doc',
              id: 'guides/actions/create-actions',
              label: 'Creating Actions',
            },
            {
              type: 'category',
              label: 'Examples',
              items: [
                {
                  type: 'doc',
                  id: 'guides/actions/examples/jira-issue-creation',
                  label: 'Jira Issue Creation',
                },
                {
                  type: 'doc',
                  id: 'guides/actions/examples/jira-issue-creation-redirect',
                  label: 'Jira Issue Creation Redirect',
                },
                {
                  type: 'doc',
                  id: 'guides/actions/examples/google-calendar-events',
                  label: 'Google Calendar Events',
                },
                {
                  type: 'doc',
                  id: 'guides/actions/examples/google-docs-update',
                  label: 'Google Docs Update',
                },
                {
                  type: 'doc',
                  id: 'guides/actions/examples/zendesk-ticket-redirection',
                  label: 'Zendesk Ticket Redirection',
                },
              ],
            },
            {
              type: 'doc',
              id: 'guides/actions/faq',
              label: 'FAQ',
            },
          ],
        },
        {
          type: 'doc',
          id: 'guides/mcp/mcp',
          label: 'MCP',
          customProps: {
            icon: 'mcp',
            iconSet: 'glean',
          },
        },
      ],
    },
    {
      type: 'category',
      label: 'Libraries',
      collapsible: false,
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Web SDK',
          items: [
            {
              type: 'doc',
              id: 'libraries/web-sdk/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'libraries/web-sdk/3rd-party-cookies',
              label: 'Third-Party Cookie Management',
            },
            {
              type: 'category',
              label: 'Authentication',
              items: [
                {
                  type: 'doc',
                  id: 'libraries/web-sdk/authentication/overview',
                  label: 'Overview',
                },
                {
                  type: 'doc',
                  id: 'libraries/web-sdk/authentication/default-sso',
                  label: 'Default SSO',
                },
                {
                  type: 'doc',
                  id: 'libraries/web-sdk/authentication/server-to-server',
                  label: 'Server-to-Server',
                },
              ],
            },
            {
              type: 'category',
              label: 'Components',
              items: [
                {
                  type: 'doc',
                  id: 'libraries/web-sdk/components/chat',
                  label: 'Glean Chat',
                },
                {
                  type: 'doc',
                  id: 'libraries/web-sdk/components/autocomplete',
                  label: 'Autocomplete',
                },
                {
                  type: 'doc',
                  id: 'libraries/web-sdk/components/modal-search',
                  label: 'Modal Search',
                },
                {
                  type: 'doc',
                  id: 'libraries/web-sdk/components/sidebar',
                  label: 'Sidebar',
                },
                {
                  type: 'doc',
                  id: 'libraries/web-sdk/components/recommendations',
                  label: 'Recommendations',
                },
              ],
            },
            {
              type: 'category',
              label: 'Guides',
              items: [
                {
                  type: 'doc',
                  id: 'libraries/web-sdk/guides/react',
                  label: 'React',
                },
                {
                  type: 'doc',
                  id: 'libraries/web-sdk/guides/zendesk',
                  label: 'Zendesk',
                },
                {
                  type: 'doc',
                  id: 'libraries/web-sdk/guides/lumapps',
                  label: 'Lumapps',
                },
                {
                  type: 'doc',
                  id: 'libraries/web-sdk/guides/brightspot',
                  label: 'Brightspot',
                },
              ],
            },
            {
              type: 'link',
              href: 'https://app.glean.com/meta/browser_api/index.html',
              label: 'SDK Reference',
            },
          ],
        },
        {
          type: 'category',
          label: 'API Clients',
          items: [
            {
              type: 'doc',
              id: 'libraries/api-clients',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'libraries/api-clients/python',
              label: 'Python',
            },
            {
              type: 'doc',
              id: 'libraries/api-clients/typescript',
              label: 'TypeScript',
            },
            {
              type: 'doc',
              id: 'libraries/api-clients/go',
              label: 'Go',
            },
            {
              type: 'doc',
              id: 'libraries/api-clients/java',
              label: 'Java',
            },
          ],
        },
      ],
    },
    {
      type: 'category' as const,
      label: 'Client API',
      collapsible: false,
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Getting Started',
          items: [
            {
              type: 'doc',
              id: 'api-info/client/getting-started/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api-info/client/getting-started/basic-usage',
              label: 'Basic Usage',
            },
          ],
        },
        {
          type: 'category',
          label: 'Authentication',
          items: [
            {
              type: 'doc',
              id: 'api-info/client/authentication/overview',
              label: 'Implementation Guide',
            },
            {
              type: 'doc',
              id: 'api-info/client/authentication/glean-issued',
              label: 'Glean Tokens',
            },
            {
              type: 'doc',
              id: 'api-info/client/authentication/oauth',
              label: 'OAuth',
            },
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Client API Reference',
      collapsible: false,
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Activity',
          items: [
            {
              type: 'doc',
              id: 'api/client-api/activity/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/client-api/activity/activity',
              label: 'Report document activity',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/activity/feedback',
              label: 'Report client activity',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'category',
          label: 'Agents',
          items: [
            {
              type: 'doc',
              id: 'api/client-api/agents/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/client-api/agents/get-agent',
              label: 'Retrieve an agent',
              className: 'api-method get',
            },
            {
              type: 'doc',
              id: 'api/client-api/agents/get-agent-schemas',
              label: "List an agent's schemas",
              className: 'api-method get',
            },
            {
              type: 'doc',
              id: 'api/client-api/agents/search-agents',
              label: 'Search agents',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/agents/create-and-stream-run',
              label: 'Create an agent run and stream the response',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/agents/create-and-wait-run',
              label: 'Create an agent run and wait for the response',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'category',
          label: 'Announcements',
          items: [
            {
              type: 'doc',
              id: 'api/client-api/announcements/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/client-api/announcements/createannouncement',
              label: 'Create Announcement',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/announcements/deleteannouncement',
              label: 'Delete Announcement',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/announcements/updateannouncement',
              label: 'Update Announcement',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'category',
          label: 'Answers',
          items: [
            {
              type: 'doc',
              id: 'api/client-api/answers/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/client-api/answers/createanswer',
              label: 'Create Answer',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/answers/deleteanswer',
              label: 'Delete Answer',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/answers/editanswer',
              label: 'Update Answer',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/answers/getanswer',
              label: 'Read Answer',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/answers/listanswers',
              label: 'List Answers',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'category',
          label: 'Authentication',
          items: [
            {
              type: 'doc',
              id: 'api/client-api/authentication/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/client-api/authentication/createauthtoken',
              label: 'Create authentication token',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'category',
          label: 'Chat',
          items: [
            {
              type: 'doc',
              id: 'api/client-api/chat/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/client-api/chat/chat',
              label: 'Chat',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/chat/deleteallchats',
              label: 'Deletes all saved Chats owned by a user',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/chat/deletechats',
              label: 'Deletes saved Chats',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/chat/getchat',
              label: 'Retrieves a Chat',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/chat/listchats',
              label: 'Retrieves all saved Chats',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/chat/getchatapplication',
              label: 'Gets the metadata for a custom Chat application',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/chat/uploadchatfiles',
              label: 'Upload files for Chat.',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/chat/getchatfiles',
              label: 'Get files uploaded by a user for Chat.',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/chat/deletechatfiles',
              label: 'Delete files uploaded by a user for chat.',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/chat/chat-stream',
              label: 'Chat',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'category',
          label: 'Documents',
          items: [
            {
              type: 'doc',
              id: 'api/client-api/documents/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/client-api/documents/getdocpermissions',
              label: 'Read document permissions',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/documents/getdocuments',
              label: 'Read documents',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/documents/getdocumentsbyfacets',
              label: 'Read documents by facets',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'category',
          label: 'Collections',
          items: [
            {
              type: 'doc',
              id: 'api/client-api/collections/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/client-api/collections/listcollections',
              label: 'List collections',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/collections/createcollection',
              label: 'Create collection',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/collections/getcollection',
              label: 'Get collection',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/collections/editcollection',
              label: 'Edit collection',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/collections/deletecollection',
              label: 'Delete collection',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/collections/addcollectionitems',
              label: 'Add collection items',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/collections/editcollectionitem',
              label: 'Edit collection item',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/collections/deletecollectionitem',
              label: 'Delete collection item',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'category',
          label: 'Entities',
          items: [
            {
              type: 'doc',
              id: 'api/client-api/entities/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/client-api/entities/listentities',
              label: 'List entities',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/entities/people',
              label: 'Read people',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'category',
          label: 'Governance',
          items: [
            {
              type: 'doc',
              id: 'api/client-api/governance/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/client-api/governance/getpolicy',
              label: 'Gets specified policy',
              className: 'api-method get',
            },
            {
              type: 'doc',
              id: 'api/client-api/governance/updatepolicy',
              label: 'Updates an existing policy',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/governance/listpolicies',
              label: 'Lists policies',
              className: 'api-method get',
            },
            {
              type: 'doc',
              id: 'api/client-api/governance/createpolicy',
              label: 'Creates new policy',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/governance/downloadpolicycsv',
              label: 'Downloads violations CSV for policy',
              className: 'api-method get',
            },
            {
              type: 'doc',
              id: 'api/client-api/governance/createreport',
              label: 'Creates new one-time report',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/governance/downloadreportcsv',
              label: 'Downloads violations CSV for report',
              className: 'api-method get',
            },
            {
              type: 'doc',
              id: 'api/client-api/governance/getreportstatus',
              label: 'Fetches report run status',
              className: 'api-method get',
            },
            {
              type: 'doc',
              id: 'api/client-api/governance/getdocvisibility',
              label: 'Fetches documents visibility',
              className: 'api-method get',
            },
            {
              type: 'doc',
              id: 'api/client-api/governance/setdocvisibility',
              label: 'Hide or unhide docs',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'category',
          label: 'Insights',
          items: [
            {
              type: 'doc',
              id: 'api/client-api/insights/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/client-api/insights/insights',
              label: 'Read insights',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'category',
          label: 'Messages',
          items: [
            {
              type: 'doc',
              id: 'api/client-api/messages/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/client-api/messages/messages',
              label: 'Read messages',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'category',
          label: 'Pins',
          items: [
            {
              type: 'doc',
              id: 'api/client-api/pins/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/client-api/pins/editpin',
              label: 'Update pin',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/pins/getpin',
              label: 'Read pin',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/pins/listpins',
              label: 'List pins',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/pins/pin',
              label: 'Create pin',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/pins/unpin',
              label: 'Delete pin',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'category',
          label: 'Search',
          items: [
            {
              type: 'doc',
              id: 'api/client-api/search/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/client-api/search/adminsearch',
              label: 'Search the index (admin)',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/search/autocomplete',
              label: 'Autocomplete',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/search/feed',
              label: 'Feed of documents and events',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/search/recommendations',
              label: 'Recommend documents',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/search/search',
              label: 'Search',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'category',
          label: 'Shortcuts',
          items: [
            {
              type: 'doc',
              id: 'api/client-api/shortcuts/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/client-api/shortcuts/createshortcut',
              label: 'Create shortcut',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/shortcuts/deleteshortcut',
              label: 'Delete shortcut',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/shortcuts/getshortcut',
              label: 'Read shortcut',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/shortcuts/listshortcuts',
              label: 'List shortcuts',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/shortcuts/updateshortcut',
              label: 'Update shortcut',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'category',
          label: 'Summarize',
          items: [
            {
              type: 'doc',
              id: 'api/client-api/summarize/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/client-api/summarize/summarize',
              label: 'Summarize documents',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'category',
          label: 'Tools',
          items: [
            {
              type: 'doc',
              id: 'api/client-api/tools/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/client-api/tools/list-available-tools',
              label: 'List available tools',
              className: 'api-method get',
            },
            {
              type: 'doc',
              id: 'api/client-api/tools/execute-the-specified-tool',
              label: 'Execute the specified tool',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'category',
          label: 'Verification',
          items: [
            {
              type: 'doc',
              id: 'api/client-api/verification/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/client-api/verification/addverificationreminder',
              label: 'Create verification',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/verification/listverifications',
              label: 'List verifications',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/client-api/verification/verify',
              label: 'Update verification',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'link',
          href: 'https://developers.glean.com/oas/client',
          label: 'OpenAPI Spec',
        },
      ],
    },
    {
      type: 'category',
      label: 'Indexing API',
      collapsible: false,
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Getting Started',
          items: [
            {
              type: 'doc',
              id: 'api-info/indexing/getting-started/overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api-info/indexing/getting-started/setup-datasource',
              label: 'Setup Datasources',
            },
            {
              type: 'doc',
              id: 'api-info/indexing/getting-started/index-documents',
              label: 'Index Documents',
            },
          ],
        },
        {
          type: 'category',
          label: 'Authentication',
          items: [
            {
              type: 'doc',
              id: 'api-info/indexing/authentication/overview',
              label: 'Implementation Guide',
            },
            {
              type: 'doc',
              id: 'api/client-api/authentication/createauthtoken',
              label: 'Create authentication token',
            },
            {
              type: 'doc',
              id: 'api-info/indexing/authentication/token-rotation',
              label: 'Token Rotation',
            },
          ],
        },
        {
          type: 'category',
          label: 'Datasource',
          items: [
            {
              type: 'doc',
              id: 'api-info/indexing/datasource/custom-properties',
              label: 'Custom Properties',
            },
            {
              type: 'doc',
              id: 'api-info/indexing/datasource/test-datasource',
              label: 'Test Datasource',
            },
            {
              type: 'doc',
              id: 'api-info/indexing/datasource/category',
              label: 'Category',
            },
            {
              type: 'doc',
              id: 'api-info/indexing/datasource/rendering-search-results',
              label: 'Rendering Search Results',
            },
          ],
        },
        {
          type: 'category',
          label: 'Debugging',
          items: [
            {
              type: 'doc',
              id: 'api-info/indexing/debugging/datasource-config',
              label: 'Datasource Config',
            },
            {
              type: 'doc',
              id: 'api-info/indexing/debugging/datasource-status',
              label: 'Datasource Status',
            },
            {
              type: 'doc',
              id: 'api-info/indexing/debugging/datasource-document',
              label: 'Datasource Document',
            },
            {
              type: 'doc',
              id: 'api-info/indexing/debugging/datasource-user',
              label: 'Datasource User',
            },
            {
              type: 'doc',
              id: 'api-info/indexing/debugging/document-access',
              label: 'Document Access',
            },
            {
              type: 'doc',
              id: 'api-info/indexing/debugging/document-count',
              label: 'Document Count',
            },
          ],
        },
        {
          type: 'category',
          label: 'Documents',
          items: [
            {
              type: 'doc',
              id: 'api-info/indexing/documents/activity',
              label: 'Activity',
            },
            {
              type: 'doc',
              id: 'api-info/indexing/documents/permissions',
              label: 'Permissions',
            },
            {
              type: 'doc',
              id: 'api-info/indexing/documents/bulk-indexing',
              label: 'Bulk Indexing',
            },
            {
              type: 'doc',
              id: 'api-info/indexing/documents/bulk-upload-model',
              label: 'Bulk Upload Model',
            },
            {
              type: 'doc',
              id: 'api-info/indexing/documents/document-model',
              label: 'Document Model',
            },
            {
              type: 'doc',
              id: 'api-info/indexing/documents/supported-mimetypes',
              label: 'Supported MIME Types',
            },
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Indexing API Reference',
      collapsible: false,
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Authentication',
          items: [
            {
              type: 'doc',
              id: 'api/indexing-api/authentication-overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/rotate-token',
              label: 'Rotate token',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'category',
          label: 'Datasources',
          items: [
            {
              type: 'doc',
              id: 'api/indexing-api/datasources-overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/add-or-update-datasource',
              label: 'Add or update datasource',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/get-datasource-config',
              label: 'Get datasource config',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'category',
          label: 'Documents',
          items: [
            {
              type: 'doc',
              id: 'api/indexing-api/documents-overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/index-document',
              label: 'Index document',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/index-documents',
              label: 'Index documents',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/bulk-index-documents',
              label: 'Bulk index documents',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/update-document-permissions',
              label: 'Update document permissions',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/schedules-the-processing-of-uploaded-documents',
              label: 'Schedules the processing of uploaded documents',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/delete-document',
              label: 'Delete document',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'category',
          label: 'People',
          items: [
            {
              type: 'doc',
              id: 'api/indexing-api/people-overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/index-employee',
              label: 'Index employee',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/bulk-index-employees',
              label: 'Bulk index employees',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/schedules-the-processing-of-uploaded-employees-and-teams',
              label: 'Schedules the processing of uploaded employees and teams',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/delete-employee',
              label: 'Delete employee',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/index-team',
              label: 'Index team',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/delete-team',
              label: 'Delete team',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/bulk-index-teams',
              label: 'Bulk index teams',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'category',
          label: 'Permissions',
          items: [
            {
              type: 'doc',
              id: 'api/indexing-api/permissions-overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/index-user',
              label: 'Index user',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/bulk-index-users',
              label: 'Bulk index users',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/index-group',
              label: 'Index group',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/bulk-index-groups',
              label: 'Bulk index groups',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/index-membership',
              label: 'Index membership',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/bulk-index-memberships-for-a-group',
              label: 'Bulk index memberships for a group',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/schedules-the-processing-of-group-memberships',
              label: 'Schedules the processing of group memberships',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/delete-user',
              label: 'Delete user',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/delete-group',
              label: 'Delete group',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/delete-membership',
              label: 'Delete membership',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/beta-users',
              label: 'Beta users',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'category',
          label: 'Shortcuts',
          items: [
            {
              type: 'doc',
              id: 'api/indexing-api/shortcuts-overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/bulk-index-external-shortcuts',
              label: 'Bulk index external shortcuts',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/upload-shortcuts',
              label: 'Upload shortcuts',
              className: 'api-method post',
            },
          ],
        },
        {
          type: 'category',
          label: 'Troubleshooting',
          items: [
            {
              type: 'doc',
              id: 'api/indexing-api/troubleshooting-overview',
              label: 'Overview',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/beta-get-datasource-status',
              label: 'Beta: Get datasource status\n',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/beta-get-document-information',
              label: 'Beta: Get document information\n',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/beta-get-information-of-a-batch-of-documents',
              label: 'Beta: Get information of a batch of documents\n',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/beta-get-user-information',
              label: 'Beta: Get user information\n',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/check-document-access',
              label: 'Check document access',
              className: 'api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/get-document-upload-and-indexing-status',
              label: 'Get document upload and indexing status',
              className: 'menu__list-item--deprecated api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/get-document-count',
              label: 'Get document count',
              className: 'menu__list-item--deprecated api-method post',
            },
            {
              type: 'doc',
              id: 'api/indexing-api/get-user-count',
              label: 'Get user count',
              className: 'menu__list-item--deprecated api-method post',
            },
          ],
        },
        {
          type: 'link',
          href: 'https://developers.glean.com/oas/indexing',
          label: 'OpenAPI Spec',
        },
      ],
    },
  ],
};

const sidebars = filterByFeatureFlags(baseSidebars, boolFlags);

export default sidebars;
