import type * as OpenApiPlugin from 'docusaurus-plugin-openapi-docs';
import { customApiMdGenerator } from './scripts/generator/customMdGenerators';

const sharedOptions = {
  showSchemas: false,
  // Explicitly enable prop externalization (externalJsonProps defaults to true in
  // validateOptions, but gen-api-docs CLI bypasses that validation, so we set it here
  // to ensure large JSON props are written to separate .json files rather than inlined
  // in MDX — this significantly reduces MDX file sizes and speeds up the Docusaurus build).
  externalJsonProps: true,
  sidebarOptions: {
    groupPathsBy: 'tag' as const,
    categoryLinkSource: 'tag' as const,
  },
  markdownGenerators: { createApiPageMD: customApiMdGenerator },
} satisfies Partial<OpenApiPlugin.Options>;

export const openApiPluginOptions = {
  id: 'api',
  docsPluginId: 'classic',
  config: {
    indexing: {
      ...sharedOptions,
      specPath: './openapi/indexing/indexing-capitalized.yaml',
      outputDir: 'docs/api/indexing-api',
    },
    activity: {
      // ok
      ...sharedOptions,
      specPath: './openapi/client/split-apis/activity-api.yaml',
      outputDir: 'docs/api/client-api/activity',
    },
    announcements: {
      // circular
      ...sharedOptions,
      specPath: './openapi/client/split-apis/announcements-api.yaml',
      outputDir: 'docs/api/client-api/announcements',
    },
    answers: {
      // ok
      ...sharedOptions,
      specPath: './openapi/client/split-apis/answers-api.yaml',
      outputDir: 'docs/api/client-api/answers',
    },
    authentication: {
      // ok
      ...sharedOptions,
      specPath: './openapi/client/split-apis/authentication-api.yaml',
      outputDir: 'docs/api/client-api/authentication',
    },
    chat: {
      // circular
      ...sharedOptions,
      specPath: './openapi/client/split-apis/chat-api.yaml',
      outputDir: 'docs/api/client-api/chat',
    },
    agents: {
      // ok
      ...sharedOptions,
      specPath: './openapi/client/split-apis/agents-api.yaml',
      outputDir: 'docs/api/client-api/agents',
    },
    collections: {
      // circular
      ...sharedOptions,
      specPath: './openapi/client/split-apis/collections-api.yaml',
      outputDir: 'docs/api/client-api/collections',
    },
    documents: {
      // circular
      ...sharedOptions,
      specPath: './openapi/client/split-apis/documents-api.yaml',
      outputDir: 'docs/api/client-api/documents',
    },
    insights: {
      // circular
      ...sharedOptions,
      specPath: './openapi/client/split-apis/insights-api.yaml',
      outputDir: 'docs/api/client-api/insights',
    },
    messages: {
      // circular
      ...sharedOptions,
      specPath: './openapi/client/split-apis/messages-api.yaml',
      outputDir: 'docs/api/client-api/messages',
    },
    pins: {
      // circular
      ...sharedOptions,
      specPath: './openapi/client/split-apis/pins-api.yaml',
      outputDir: 'docs/api/client-api/pins',
    },
    search: {
      // circular
      ...sharedOptions,
      specPath: './openapi/client/split-apis/search-api.yaml',
      outputDir: 'docs/api/client-api/search',
    },
    entities: {
      // circular
      ...sharedOptions,
      specPath: './openapi/client/split-apis/entities-api.yaml',
      outputDir: 'docs/api/client-api/entities',
    },
    shortcuts: {
      // circular
      ...sharedOptions,
      specPath: './openapi/client/split-apis/shortcuts-api.yaml',
      outputDir: 'docs/api/client-api/shortcuts',
    },
    summarize: {
      // ok
      ...sharedOptions,
      specPath: './openapi/client/split-apis/summarize-api.yaml',
      outputDir: 'docs/api/client-api/summarize',
    },
    verification: {
      // circular
      ...sharedOptions,
      specPath: './openapi/client/split-apis/verification-api.yaml',
      outputDir: 'docs/api/client-api/verification',
    },
    tools: {
      // ok
      ...sharedOptions,
      specPath: './openapi/client/split-apis/tools-api.yaml',
      outputDir: 'docs/api/client-api/tools',
    },
    governance: {
      // ok
      ...sharedOptions,
      specPath: './openapi/client/split-apis/governance-api.yaml',
      outputDir: 'docs/api/client-api/governance',
    },
  } satisfies Record<string, OpenApiPlugin.Options>,
};
