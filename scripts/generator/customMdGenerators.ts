import fs from 'fs';
import path from 'path';
import { createCallbacks } from 'docusaurus-plugin-openapi-docs/lib/markdown/createCallbacks';
import { createDescription } from 'docusaurus-plugin-openapi-docs/lib/markdown/createDescription';
import { createHeading } from 'docusaurus-plugin-openapi-docs/lib/markdown/createHeading';
import { createParamsDetails } from 'docusaurus-plugin-openapi-docs/lib/markdown/createParamsDetails';
import { createRequestBodyDetails } from 'docusaurus-plugin-openapi-docs/lib/markdown/createRequestBodyDetails';
import { createRequestHeader } from 'docusaurus-plugin-openapi-docs/lib/markdown/createRequestHeader';
import { createStatusCodes } from 'docusaurus-plugin-openapi-docs/lib/markdown/createStatusCodes';
import { createVendorExtensions } from 'docusaurus-plugin-openapi-docs/lib/markdown/createVendorExtensions';
import { render } from 'docusaurus-plugin-openapi-docs/lib/markdown/utils';
import type {
  DeprecationItem,
  DeprecationsData,
} from '../../src/types/deprecations';
import { buildEndpointMetadata, type ApiOperation } from './endpointMetadata';

interface ApiPageMetadata {
  title: string;
  api: unknown;
  infoPath?: string;
  frontMatter: {
    show_extensions?: boolean;
  };
}

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

/**
 * One block under the title that replaces the method/path line, the
 * Authorization panel, and every stage banner (deprecated, beta,
 * experimental). See src/theme/EndpointMetadata.
 */
function createEndpointMetadata(
  api: ApiOperation,
  infoPath: string | undefined,
): string {
  const deprecations = getActiveDeprecationsForEndpoint(
    api.method,
    api.path,
    deprecationsData,
  );
  const metadata = buildEndpointMetadata(api, infoPath, deprecations);
  return `<EndpointMetadata metadata={${JSON.stringify(metadata)}} />\n\n`;
}

export function customApiMdGenerator({
  title,
  api,
  infoPath,
  frontMatter,
}: ApiPageMetadata) {
  const {
    description,
    extensions,
    parameters,
    requestBody,
    responses,
    callbacks,
  } = api as any; // Type assertion to access extension properties

  return render([
    // Still needed: createCallbacks renders <MethodEndpoint> per callback.
    `import MethodEndpoint from "@theme/ApiExplorer/MethodEndpoint";\n`,
    `import ParamsDetails from "@theme/ParamsDetails";\n`,
    `import RequestSchema from "@theme/RequestSchema";\n`,
    `import StatusCodes from "@theme/StatusCodes";\n`,
    `import OperationTabs from "@theme/OperationTabs";\n`,
    `import TabItem from "@theme/TabItem";\n`,
    `import Heading from "@theme/Heading";\n`,
    `import Translate from "@docusaurus/Translate";\n`,
    `import EndpointMetadata from "@site/src/theme/EndpointMetadata";\n\n`,
    createHeading(title),
    createEndpointMetadata(api as ApiOperation, infoPath),
    frontMatter.show_extensions
      ? createVendorExtensions(extensions)
      : undefined,
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
