import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type * as OpenApiPlugin from 'docusaurus-plugin-openapi-docs';
const redirects = [...require('./redirects.json'), ...require('./permalinks.json')];
import { customApiMdGenerator } from './scripts/generator/customMdGenerators';

// Environment variable to control API docs generation
const shouldGenerateApiDocs = process.env.GENERATE_API_DOCS !== 'false';
// Optional environment variable for Google site verification
const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION;

const config: Config = {
  title: 'Glean Developer',
  tagline: 'Documentation for Glean developers',
  favicon: 'img/favicon.png',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    experimental_faster: true,
    // Rspack needs this to unlock some optimizations
    v4: { removeLegacyPostBuildHeadAttribute: true },
  },

  // Set the production url of your site here
  url: 'https://developers.glean.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          docItemComponent: '@theme/ApiItem',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/glean-developer-logo-light.svg',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    navbar: {
      logo: {
        alt: 'Glean Developer Logo',
        src: 'img/glean-developer-logo-light.svg',
        srcDark: 'img/glean-developer-logo-dark.svg',
      },
      items: [
        {
          label: 'More from Glean',
          position: 'right',
          items: [
            {
              label: 'Go to Glean',
              href: 'https://app.glean.com',
              className:
                'navbar-dropdown-with-icon navbar-dropdown-icon-glean-app',
            },
            {
              label: 'Help Center',
              href: 'https://docs.glean.com',
              className:
                'navbar-dropdown-with-icon navbar-dropdown-icon-help-center',
            },
            {
              label: 'Community',
              href: 'https://community.glean.com',
              className:
                'navbar-dropdown-with-icon navbar-dropdown-icon-community',
            },
            {
              label: 'Support',
              href: 'https://support.glean.com',
              className:
                'navbar-dropdown-with-icon navbar-dropdown-icon-support',
            },
            {
              label: 'Trust Portal',
              href: 'https://trust.glean.com',
              className: 'navbar-dropdown-with-icon navbar-dropdown-icon-trust',
            },
            {
              label: 'Status',
              href: 'https://status.glean.com',
              className:
                'navbar-dropdown-with-icon navbar-dropdown-icon-status',
            },
          ],
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['go', 'java'],
    },
    headTags: [
      {
        tagName: 'link',
        attributes: {
          rel: 'alternate',
          type: 'application/rss+xml',
          title: 'Glean Developer Changelog',
          href: '/changelog.xml',
        },
      },
      ...(googleSiteVerification
        ? [
            {
              tagName: 'meta',
              attributes: {
                name: 'google-site-verification',
                content: googleSiteVerification,
              },
            },
          ]
        : []),
    ],
    languageTabs: [
      {
        highlight: 'python',
        language: 'python',
        logoClass: 'python',
      },
      {
        highlight: 'go',
        language: 'go',
        logoClass: 'go',
      },
      {
        highlight: 'java',
        language: 'java',
        logoClass: 'java',
      },
      {
        highlight: 'javascript',
        language: 'javascript',
        logoClass: 'javascript',
      },
      {
        highlight: 'curl',
        language: 'curl',
        logoClass: 'curl',
      },
    ],
  } satisfies Preset.ThemeConfig,

  plugins: [
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects,
      },
    ],
    [
      '@signalwire/docusaurus-plugin-llms-txt',
      {
        siteTitle: 'Glean Developer',
        siteDescription: 'Glean Developer',
        depth: 2,
        content: {
          includePages: true,
          enableLlmsFullTxt: true,
        },
      },
    ],
    [
      require.resolve('docusaurus-plugin-search-glean'),
      {
        searchOptions: {
          backend: 'https://glean-public-external-be.glean.com',
          webAppUrl: 'https://glean-public-external.glean.com',
          datasourcesFilter: ['webj88x6azgleandeveloperdocs'],
        },
        chatOptions: false,
        enableAnonymousAuth: true,
      },
    ],
    [
      'vercel-analytics',
      {
        debug: true,
        mode: 'auto',
      },
    ],
    // Conditionally include OpenAPI docs plugin
    ...(shouldGenerateApiDocs
      ? [
          [
            'docusaurus-plugin-openapi-docs',
            {
              id: 'api',
              docsPluginId: 'classic',
              config: {
                indexing: {
                  specPath: './openapi/indexing/indexing-capitalized.yaml',
                  outputDir: 'docs/api/indexing-api',
                  sidebarOptions: {
                    groupPathsBy: 'tag',
                    categoryLinkSource: 'tag',
                  },
                  markdownGenerators: { createApiPageMD: customApiMdGenerator },
                } satisfies OpenApiPlugin.Options,
                activity: {
                  // ok
                  specPath: './openapi/client/split-apis/activity-api.yaml',
                  outputDir: 'docs/api/client-api/activity',
                  sidebarOptions: {
                    groupPathsBy: 'tag',
                    categoryLinkSource: 'tag',
                  },
                  markdownGenerators: { createApiPageMD: customApiMdGenerator },
                } satisfies OpenApiPlugin.Options,
                announcements: {
                  // circular
                  specPath:
                    './openapi/client/split-apis/announcements-api.yaml',
                  outputDir: 'docs/api/client-api/announcements',
                  sidebarOptions: {
                    groupPathsBy: 'tag',
                    categoryLinkSource: 'tag',
                  },
                  markdownGenerators: { createApiPageMD: customApiMdGenerator },
                } satisfies OpenApiPlugin.Options,
                answers: {
                  // ok
                  specPath: './openapi/client/split-apis/answers-api.yaml',
                  outputDir: 'docs/api/client-api/answers',
                  sidebarOptions: {
                    groupPathsBy: 'tag',
                    categoryLinkSource: 'tag',
                  },
                  markdownGenerators: { createApiPageMD: customApiMdGenerator },
                } satisfies OpenApiPlugin.Options,
                authentication: {
                  // ok
                  specPath:
                    './openapi/client/split-apis/authentication-api.yaml',
                  outputDir: 'docs/api/client-api/authentication',
                  sidebarOptions: {
                    groupPathsBy: 'tag',
                    categoryLinkSource: 'tag',
                  },
                  markdownGenerators: { createApiPageMD: customApiMdGenerator },
                } satisfies OpenApiPlugin.Options,
                chat: {
                  // circular
                  specPath: './openapi/client/split-apis/chat-api.yaml',
                  outputDir: 'docs/api/client-api/chat',
                  sidebarOptions: {
                    groupPathsBy: 'tag',
                    categoryLinkSource: 'tag',
                  },
                  markdownGenerators: { createApiPageMD: customApiMdGenerator },
                } satisfies OpenApiPlugin.Options,
                agents: {
                  // ok
                  specPath: './openapi/client/split-apis/agents-api.yaml',
                  outputDir: 'docs/api/client-api/agents',
                  sidebarOptions: {
                    groupPathsBy: 'tag',
                    categoryLinkSource: 'tag',
                  },
                  markdownGenerators: { createApiPageMD: customApiMdGenerator },
                } satisfies OpenApiPlugin.Options,
                collections: {
                  // circular
                  specPath: './openapi/client/split-apis/collections-api.yaml',
                  outputDir: 'docs/api/client-api/collections',
                  sidebarOptions: {
                    groupPathsBy: 'tag',
                    categoryLinkSource: 'tag',
                  },
                  markdownGenerators: { createApiPageMD: customApiMdGenerator },
                } satisfies OpenApiPlugin.Options,
                documents: {
                  // circular
                  specPath: './openapi/client/split-apis/documents-api.yaml',
                  outputDir: 'docs/api/client-api/documents',
                  sidebarOptions: {
                    groupPathsBy: 'tag',
                    categoryLinkSource: 'tag',
                  },
                  markdownGenerators: { createApiPageMD: customApiMdGenerator },
                } satisfies OpenApiPlugin.Options,
                insights: {
                  // circular
                  specPath: './openapi/client/split-apis/insights-api.yaml',
                  outputDir: 'docs/api/client-api/insights',
                  sidebarOptions: {
                    groupPathsBy: 'tag',
                    categoryLinkSource: 'tag',
                  },
                  markdownGenerators: { createApiPageMD: customApiMdGenerator },
                } satisfies OpenApiPlugin.Options,
                messages: {
                  // circular
                  specPath: './openapi/client/split-apis/messages-api.yaml',
                  outputDir: 'docs/api/client-api/messages',
                  sidebarOptions: {
                    groupPathsBy: 'tag',
                    categoryLinkSource: 'tag',
                  },
                  markdownGenerators: { createApiPageMD: customApiMdGenerator },
                } satisfies OpenApiPlugin.Options,
                pins: {
                  // circular
                  specPath: './openapi/client/split-apis/pins-api.yaml',
                  outputDir: 'docs/api/client-api/pins',
                  sidebarOptions: {
                    groupPathsBy: 'tag',
                    categoryLinkSource: 'tag',
                  },
                  markdownGenerators: { createApiPageMD: customApiMdGenerator },
                } satisfies OpenApiPlugin.Options,
                search: {
                  // circular
                  specPath: './openapi/client/split-apis/search-api.yaml',
                  outputDir: 'docs/api/client-api/search',
                  sidebarOptions: {
                    groupPathsBy: 'tag',
                    categoryLinkSource: 'tag',
                  },
                  markdownGenerators: { createApiPageMD: customApiMdGenerator },
                } satisfies OpenApiPlugin.Options,
                entities: {
                  // circular
                  specPath: './openapi/client/split-apis/entities-api.yaml',
                  outputDir: 'docs/api/client-api/entities',
                  sidebarOptions: {
                    groupPathsBy: 'tag',
                    categoryLinkSource: 'tag',
                  },
                  markdownGenerators: { createApiPageMD: customApiMdGenerator },
                } satisfies OpenApiPlugin.Options,
                shortcuts: {
                  // circular
                  specPath: './openapi/client/split-apis/shortcuts-api.yaml',
                  outputDir: 'docs/api/client-api/shortcuts',
                  sidebarOptions: {
                    groupPathsBy: 'tag',
                    categoryLinkSource: 'tag',
                  },
                  markdownGenerators: { createApiPageMD: customApiMdGenerator },
                } satisfies OpenApiPlugin.Options,
                summarize: {
                  // ok
                  specPath: './openapi/client/split-apis/summarize-api.yaml',
                  outputDir: 'docs/api/client-api/summarize',
                  sidebarOptions: {
                    groupPathsBy: 'tag',
                    categoryLinkSource: 'tag',
                  },
                  markdownGenerators: { createApiPageMD: customApiMdGenerator },
                } satisfies OpenApiPlugin.Options,
                verification: {
                  // circular
                  specPath: './openapi/client/split-apis/verification-api.yaml',
                  outputDir: 'docs/api/client-api/verification',
                  sidebarOptions: {
                    groupPathsBy: 'tag',
                    categoryLinkSource: 'tag',
                  },
                  markdownGenerators: { createApiPageMD: customApiMdGenerator },
                } satisfies OpenApiPlugin.Options,
                tools: {
                  // ok
                  specPath: './openapi/client/split-apis/tools-api.yaml',
                  outputDir: 'docs/api/client-api/tools',
                  sidebarOptions: {
                    groupPathsBy: 'tag',
                    categoryLinkSource: 'tag',
                  },
                  markdownGenerators: { createApiPageMD: customApiMdGenerator },
                } satisfies OpenApiPlugin.Options,
                governance: {
                  // ok
                  specPath: './openapi/client/split-apis/governance-api.yaml',
                  outputDir: 'docs/api/client-api/governance',
                  sidebarOptions: {
                    groupPathsBy: 'tag',
                    categoryLinkSource: 'tag',
                  },
                  markdownGenerators: { createApiPageMD: customApiMdGenerator },
                } satisfies OpenApiPlugin.Options,
              },
            },
          ],
        ]
      : []),
  ],
  themes: ['docusaurus-theme-openapi-docs', '@docusaurus/theme-mermaid'],
  markdown: {
    mermaid: true,
  },
};

export default config;
