import { themes as prismThemes } from 'prism-react-renderer';
import path from 'path';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { openApiPluginOptions } from './openapi.config';
import docTimestampsPlugin from './plugins/doc-timestamps';
const redirects = [
  ...require('./redirects.json'),
  ...require('./permalinks.json'),
];
import { getBuildTimeFlags } from './src/utils/buildTimeFlags';

/**
 * Dark prism theme matched to the TerminalPanel palette (homepage/plugin
 * pages): #121418 body, #e6e7ea text, strings #d0e26f, keywords #8f94fd,
 * numbers/constants #ffd4bf — so stock code blocks and terminal panels
 * read as one family in dark mode.
 */
const gleanDarkCodeTheme = {
  plain: { color: '#e6e7ea', backgroundColor: '#121418' },
  styles: [
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: { color: '#8b8f98', fontStyle: 'italic' as const },
    },
    { types: ['punctuation'], style: { color: '#c3c6cc' } },
    {
      types: ['string', 'char', 'attr-value', 'template-string', 'inserted'],
      style: { color: '#d0e26f' },
    },
    {
      types: ['keyword', 'tag', 'operator', 'selector', 'atrule'],
      style: { color: '#8f94fd' },
    },
    {
      types: ['number', 'boolean', 'constant', 'symbol', 'deleted'],
      style: { color: '#ffd4bf' },
    },
    {
      types: ['function', 'class-name', 'builtin', 'attr-name'],
      style: { color: '#a9e0ff' },
    },
    { types: ['variable', 'property', 'regex'], style: { color: '#e6e7ea' } },
  ],
};
import { flagsSnapshotToBooleans } from './src/lib/featureFlags';

// Optional environment variable for Google site verification
const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION;

const config: Config = {
  title: 'Glean Developer',
  tagline: 'Documentation for Glean developers',
  favicon: 'img/favicon.png',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    faster: true,
    // Rspack needs this to unlock some optimizations
    v4: { removeLegacyPostBuildHeadAttribute: true },
  },

  // Set the production url of your site here
  url: 'https://developers.glean.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/',

  onBrokenLinks: 'throw',

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
          editUrl:
            'https://github.com/gleanwork/glean-developer-site/edit/main/',
          admonitions: {
            // Register a custom `experimental` admonition used by API pages
            // (see scripts/generator/customMdGenerators.ts). Rendered via the
            // swizzled @theme/Admonition/Types and styled in src/css/custom.css.
            keywords: ['experimental'],
            extendDefaults: true,
          },
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // API Explorer: keep pasted bearer tokens across pages/reloads (stored
    // in the reader's browser only)
    api: {
      authPersistence: 'localStorage',
    },
    image: 'img/glean-developer-logo-light.svg',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      logo: {
        alt: 'Glean Developer Logo',
        src: 'img/glean-developer-logo-light.svg',
        srcDark: 'img/glean-developer-logo-dark.svg',
      },
      items: ((items) => {
        const { getBuildTimeFlags } = require('./src/utils/buildTimeFlags');
        const { flagsSnapshotToBooleans } = require('./src/lib/featureFlags');
        const { getNavbarItems } = require('./src/utils/filtering');
        const raw = getBuildTimeFlags();
        const bools = flagsSnapshotToBooleans(raw, {});
        return getNavbarItems(items, bools);
      })([
        {
          type: 'custom-mcpInstallButton',
          position: 'right',
        },
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
      ]),
    },
    prism: {
      theme: gleanDarkCodeTheme,
      darkTheme: gleanDarkCodeTheme,
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
    function (context, options) {
      return {
        name: 'webpack-config',
        configureWebpack(config, isServer) {
          const isDev = process.env.NODE_ENV === 'development';

          return {
            resolve: {
              fallback: {
                fs: false,
                path: false,
              },
              alias: {
                '@gleanwork/mcp-config-schema/browser': path.resolve(
                  __dirname,
                  'node_modules/@gleanwork/mcp-config-schema/dist/browser.js',
                ),
              },
            },
            ...(isDev && !isServer
              ? {
                  cache: true,
                  optimization: {
                    removeAvailableModules: false,
                    removeEmptyChunks: false,
                    splitChunks: false,
                    runtimeChunk: true,
                  },
                  experiments: {
                    lazyCompilation: {
                      entries: false,
                      imports: true,
                      test: /\.mdx?$/,
                    },
                  },
                }
              : {}),
          };
        },
      };
    },
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
      'docusaurus-plugin-mcp-server',
      {
        server: {
          name: 'glean-developer-docs',
          version: '1.0.0',
        },
      },
    ],
    [
      require.resolve('docusaurus-plugin-search-glean'),
      {
        searchOptions: {
          backend: 'https://glean-public-external-be.glean.com',
          webAppUrl: 'https://glean-public-external.glean.com',
          datasourcesFilter: [
            'devdocs',
            'gleandocs',
            'webjjldruagleancommunity',
          ],
          disableAssistant: true,
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
    ['docusaurus-plugin-openapi-docs', openApiPluginOptions],
    docTimestampsPlugin,
  ],
  themes: [
    'docusaurus-theme-openapi-docs',
    '@docusaurus/theme-mermaid',
    '@gleanwork/docusaurus-theme-glean',
  ],
  markdown: {
    // .md parses as CommonMark (the generated Web SDK reference relies on
    // this — raw JSDoc braces would fail MDX's acorn pass); .mdx stays MDX.
    format: 'detect',
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  customFields: (() => {
    const raw = getBuildTimeFlags();
    const booleans = flagsSnapshotToBooleans(raw, {});
    return {
      __BUILD_FLAGS__: raw,
      __BUILD_FLAGS_BOOLEANS__: booleans,
    } as Record<string, unknown>;
  })(),
};

export default config;
