import { createAuthorization } from "docusaurus-plugin-openapi-docs/lib/markdown/createAuthorization";
import { createCallbacks } from "docusaurus-plugin-openapi-docs/lib/markdown/createCallbacks";
import { createDeprecationNotice } from "docusaurus-plugin-openapi-docs/lib/markdown/createDeprecationNotice";
import { createDescription } from "docusaurus-plugin-openapi-docs/lib/markdown/createDescription";
import { createHeading } from "docusaurus-plugin-openapi-docs/lib/markdown/createHeading";
import { createMethodEndpoint } from "docusaurus-plugin-openapi-docs/lib/markdown/createMethodEndpoint";
import { createParamsDetails } from "docusaurus-plugin-openapi-docs/lib/markdown/createParamsDetails";
import { createRequestBodyDetails } from "docusaurus-plugin-openapi-docs/lib/markdown/createRequestBodyDetails";
import { createRequestHeader } from "docusaurus-plugin-openapi-docs/lib/markdown/createRequestHeader";
import { createStatusCodes } from "docusaurus-plugin-openapi-docs/lib/markdown/createStatusCodes";
import { createVendorExtensions } from "docusaurus-plugin-openapi-docs/lib/markdown/createVendorExtensions";
import { render, guard, clean, Props } from "docusaurus-plugin-openapi-docs/lib/markdown/utils";
import type { ApiPageMetadata } from "docusaurus-plugin-openapi-docs/lib/types";

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
  return guard(xVisibility === "Preview" || xBeta, () =>
    createBetaAdmonition({
      children:
        description && description.length > 0
          ? clean(description)
          : "This endpoint is in Beta. Expect changes and instability.",
    })
  );
}

export function customApiMdGenerator({
  title,
  api,
  infoPath,
  frontMatter,
}: ApiPageMetadata) {
  const {
    deprecated,
    "x-deprecated-description": deprecatedDescription,
    "x-visibility": xVisibility,
    "x-beta": xBeta,
    description,
    method,
    path,
    extensions,
    parameters,
    requestBody,
    responses,
    callbacks,
  } = api as any; // Type assertion to access extension properties

  return render([
    `import MethodEndpoint from "@theme/ApiExplorer/MethodEndpoint";\n`,
    `import ParamsDetails from "@theme/ParamsDetails";\n`,
    `import RequestSchema from "@theme/RequestSchema";\n`,
    `import StatusCodes from "@theme/StatusCodes";\n`,
    `import OperationTabs from "@theme/OperationTabs";\n`,
    `import TabItem from "@theme/TabItem";\n`,
    `import Heading from "@theme/Heading";\n\n`,
    createHeading(title),
    createMethodEndpoint(method, path),
    infoPath && createAuthorization(infoPath),
    frontMatter.show_extensions
      ? createVendorExtensions(extensions)
      : undefined,
    createDeprecationNotice({ deprecated, description: deprecatedDescription }),
    createPreviewNotice({ xVisibility, xBeta }),
    createDescription(description),
    requestBody || parameters ? createRequestHeader("Request") : undefined,
    createParamsDetails({ parameters }),
    createRequestBodyDetails({
      title: "Body",
      body: requestBody,
    } as RequestBodyProps),
    createStatusCodes({ responses }),
    createCallbacks({ callbacks }),
  ]);
}
