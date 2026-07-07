import fs from 'fs';
import path from 'path';
import { createAuthorization } from 'docusaurus-plugin-openapi-docs/lib/markdown/createAuthorization';
import { createCallbacks } from 'docusaurus-plugin-openapi-docs/lib/markdown/createCallbacks';
import { createDeprecationNotice } from 'docusaurus-plugin-openapi-docs/lib/markdown/createDeprecationNotice';
import { createDescription } from 'docusaurus-plugin-openapi-docs/lib/markdown/createDescription';
import { createHeading } from 'docusaurus-plugin-openapi-docs/lib/markdown/createHeading';
import { createMethodEndpoint } from 'docusaurus-plugin-openapi-docs/lib/markdown/createMethodEndpoint';
import { createParamsDetails } from 'docusaurus-plugin-openapi-docs/lib/markdown/createParamsDetails';
import { createRequestBodyDetails } from 'docusaurus-plugin-openapi-docs/lib/markdown/createRequestBodyDetails';
import { createRequestHeader } from 'docusaurus-plugin-openapi-docs/lib/markdown/createRequestHeader';
import { createStatusCodes } from 'docusaurus-plugin-openapi-docs/lib/markdown/createStatusCodes';
import { createVendorExtensions } from 'docusaurus-plugin-openapi-docs/lib/markdown/createVendorExtensions';
import {
  render,
  guard,
  clean,
  Props,
} from 'docusaurus-plugin-openapi-docs/lib/markdown/utils';
import type { ApiPageMetadata } from 'docusaurus-plugin-openapi-docs/lib/types';
import type {
  DeprecationItem,
  DeprecationsData,
} from '../../src/types/deprecations';

function loadDeprecationsData(): DeprecationsData {
  const deprecationsPath = path.resolve(
    __dirname,
    '../../src/data/deprecations.json',
  );
  try {
    const content = fs.readFileSync(deprecationsPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return { endpoints: [], generatedAt: '', totalCount: 0 };
  }
}

function normalizePath(p: string): string {
  let normalized = p.replace(/\/+$/, '');
  normalized = normalized.replace(/^\/rest/, '');
  return normalized.toLowerCase();
}

function isDeprecationActive(deprecation: DeprecationItem): boolean {
  const [year, month, day] = deprecation.removal.split('-').map(Number);
  const removalDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return removalDate >= today;
}

function getActiveDeprecationsForEndpoint(
  method: string,
  endpointPath: string,
  data: DeprecationsData,
): DeprecationItem[] {
  const normalizedInputPath = normalizePath(endpointPath);
  const normalizedInputMethod = method.toUpperCase();

  for (const endpoint of data.endpoints) {
    const normalizedEndpointPath = normalizePath(endpoint.path);
    const normalizedEndpointMethod = endpoint.method.toUpperCase();

    if (
      normalizedEndpointMethod === normalizedInputMethod &&
      normalizedEndpointPath === normalizedInputPath
    ) {
      return endpoint.deprecations.filter(isDeprecationActive);
    }
  }

  return [];
}

const deprecationsData = loadDeprecationsData();

interface RequestBodyProps {
  title: string;
  body: {
    content?: {
      [key: string]: any;
    };
    description?: string;
    required?: boolean;
  };
}

function createBetaAdmonition({ children }: Props) {
  return `:::info beta\n\n${render(children)}\n\n:::`;
}

interface PreviewNoticeProps {
  xVisibility?: string;
  xBeta?: boolean;
  description?: string;
}

function createPreviewNotice({
  xVisibility,
  xBeta,
  description,
}: PreviewNoticeProps) {
  return guard(xVisibility === 'Preview' || xBeta, () =>
    createBetaAdmonition({
      children:
        description && description.length > 0
          ? clean(description)
          : 'This endpoint is in Beta. Expect changes and instability.',
    }),
  );
}

function createExperimentalAdmonition({ children }: Props) {
  return `:::experimental\n\n${render(children)}\n\n:::`;
}

interface ExperimentalNoticeProps {
  xGleanExperimental?: { id?: string; introduced?: string } | unknown;
}

/**
 * Format an ISO date (`YYYY-MM-DD`) as a human-readable string, e.g.
 * "May 12, 2026". Parsed in UTC so the day doesn't drift across time zones.
 * Returns `undefined` for missing or unparseable input.
 */
function formatIntroducedDate(introduced?: string): string | undefined {
  if (!introduced) return undefined;
  const date = new Date(introduced);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function createExperimentalNotice({
  xGleanExperimental,
}: ExperimentalNoticeProps) {
  const introduced =
    xGleanExperimental && typeof xGleanExperimental === 'object'
      ? (xGleanExperimental as { introduced?: string }).introduced
      : undefined;
  const introducedDate = formatIntroducedDate(introduced);
  const introducedSentence = introducedDate
    ? ` Introduced on ${introducedDate}.`
    : '';

  return guard(Boolean(xGleanExperimental), () =>
    createExperimentalAdmonition({
      children:
        'Expect changes and instability.' +
        introducedSentence +
        ' [Learn how experimental APIs work](/experimental/overview).',
    }),
  );
}

function createApiDeprecations(
  method: string,
  endpointPath: string,
): string | undefined {
  const activeDeprecations = getActiveDeprecationsForEndpoint(
    method,
    endpointPath,
    deprecationsData,
  );

  if (activeDeprecations.length === 0) {
    return undefined;
  }

  // Serialize deprecations as JSON for the component
  const deprecationsJson = JSON.stringify(activeDeprecations);

  return `\n<ApiDeprecations deprecations={${deprecationsJson}} />\n`;
}

export function customApiMdGenerator({
  title,
  api,
  infoPath,
  frontMatter,
}: ApiPageMetadata) {
  const {
    deprecated,
    'x-deprecated-description': deprecatedDescription,
    'x-visibility': xVisibility,
    'x-beta': xBeta,
    'x-glean-experimental': xGleanExperimental,
    description,
    method,
    path: endpointPath,
    extensions,
    parameters,
    requestBody,
    responses,
    callbacks,
  } = api as any; // Type assertion to access extension properties

  const deprecationsMarkdown = createApiDeprecations(method, endpointPath);
  const hasDeprecations = deprecationsMarkdown !== undefined;

  return render([
    `import MethodEndpoint from "@theme/ApiExplorer/MethodEndpoint";\n`,
    `import ParamsDetails from "@theme/ParamsDetails";\n`,
    `import RequestSchema from "@theme/RequestSchema";\n`,
    `import StatusCodes from "@theme/StatusCodes";\n`,
    `import OperationTabs from "@theme/OperationTabs";\n`,
    `import TabItem from "@theme/TabItem";\n`,
    `import Heading from "@theme/Heading";\n`,
    `import Translate from "@docusaurus/Translate";\n`,
    hasDeprecations
      ? `import ApiDeprecations from "@site/src/theme/ApiDeprecations";\n\n`
      : '\n',
    createHeading(title),
    createMethodEndpoint(method, endpointPath),
    infoPath && createAuthorization(infoPath),
    frontMatter.show_extensions
      ? createVendorExtensions(extensions)
      : undefined,
    hasDeprecations
      ? deprecationsMarkdown
      : createDeprecationNotice({
          deprecated,
          description: deprecatedDescription,
        }),
    // When an endpoint is experimental, the experimental notice is the
    // stronger/more specific signal, so we suppress the (redundant) Beta/Preview
    // notice to avoid stacking two stability banners.
    xGleanExperimental
      ? undefined
      : createPreviewNotice({ xVisibility, xBeta }),
    createExperimentalNotice({ xGleanExperimental }),
    createDescription(description),
    requestBody || parameters ? createRequestHeader('Request') : undefined,
    createParamsDetails({ parameters }),
    createRequestBodyDetails({
      title: 'Body',
      body: requestBody,
    } as RequestBodyProps),
    createStatusCodes({ responses }),
    createCallbacks({ callbacks }),
  ]);
}
