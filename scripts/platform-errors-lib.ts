import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';

const problemDetailMetadataExtension = 'x-glean-problem-detail-codes';
const canonicalErrorUrlBase = 'https://developers.glean.com/errors/';

export interface PlatformProblemDetailCodeSchema {
  enum: string[];
  [problemDetailMetadataExtension]: Record<
    string,
    PlatformProblemDetailMetadata
  >;
}

export interface PlatformOpenApiSpec {
  components: {
    schemas: {
      PlatformProblemDetailCode: PlatformProblemDetailCodeSchema;
    };
  };
}

export interface PlatformProblemDetailMetadata {
  status: number;
  title: string;
}

export interface RelatedDoc {
  title: string;
  href: string;
}

export interface PlatformErrorRemediation {
  meaning: string;
  commonCauses: string[];
  clientRemediation: string[];
  adminRemediation?: string[];
  retryGuidance: string;
  relatedDocs?: RelatedDoc[];
}

export type PlatformErrorRemediationCatalog = Record<
  string,
  PlatformErrorRemediation
>;

export interface PlatformProblemDetailExample {
  type: string;
  title: string;
  status: number;
  detail: string;
  code: string;
  documentation_url: string;
  request_id: string;
}

export interface PlatformErrorPage {
  code: string;
  slug: string;
  status: number;
  title: string;
  canonicalUrl: string;
  docPath: string;
  example: PlatformProblemDetailExample;
  remediation: PlatformErrorRemediation;
}

export interface PlatformErrorsOutput {
  generatedAt: string;
  totalCount: number;
  errors: PlatformErrorPage[];
}

export function buildPlatformErrorsOutput(
  spec: PlatformOpenApiSpec,
  catalog: PlatformErrorRemediationCatalog,
  generatedAt = new Date().toISOString(),
): PlatformErrorsOutput {
  const codeSchema = spec.components.schemas.PlatformProblemDetailCode;
  if (!Array.isArray(codeSchema.enum) || codeSchema.enum.length === 0) {
    throw new Error('PlatformProblemDetailCode enum is missing or empty');
  }

  const codeToMetadata = codeSchema[problemDetailMetadataExtension];
  if (!codeToMetadata || typeof codeToMetadata !== 'object') {
    throw new Error(`${problemDetailMetadataExtension} is missing`);
  }

  validateCatalog(catalog);
  assertSameCodes(
    'metadata',
    Object.keys(codeToMetadata),
    'enum',
    codeSchema.enum,
  );
  assertSameCodes('remediation', Object.keys(catalog), 'enum', codeSchema.enum);

  const errors = codeSchema.enum.map((code) => {
    const metadata = codeToMetadata[code];
    const slug = code.replaceAll('_', '-');
    const canonicalUrl = canonicalErrorUrlBase + slug;

    return {
      code,
      slug,
      status: metadata.status,
      title: metadata.title,
      canonicalUrl,
      docPath: `docs/errors/${slug}.mdx`,
      example: {
        type: canonicalUrl,
        title: metadata.title,
        status: metadata.status,
        detail: 'Human-readable explanation specific to this occurrence.',
        code,
        documentation_url: canonicalUrl,
        request_id: 'req_7f8a9b0c1d2e',
      },
      remediation: catalog[code],
    };
  });

  return {
    generatedAt,
    totalCount: errors.length,
    errors,
  };
}

export function loadPlatformErrorsOutput(
  openApiPath: string,
  catalogPath: string,
): PlatformErrorsOutput {
  return buildPlatformErrorsOutput(
    loadYamlFile<PlatformOpenApiSpec>(openApiPath),
    loadYamlFile<PlatformErrorRemediationCatalog>(catalogPath),
  );
}

export function writePlatformErrorDocs(
  output: PlatformErrorsOutput,
  options: {
    dataPath: string;
    docsDir: string;
  },
) {
  fs.mkdirSync(path.dirname(options.dataPath), { recursive: true });
  fs.mkdirSync(options.docsDir, { recursive: true });

  fs.writeFileSync(options.dataPath, JSON.stringify(output, null, 2) + '\n');
  fs.writeFileSync(path.join(options.docsDir, 'index.mdx'), renderIndexMdx());
  for (const error of output.errors) {
    fs.writeFileSync(
      path.join(options.docsDir, `${error.slug}.mdx`),
      renderErrorPageMdx(error),
    );
  }
}

function loadYamlFile<T>(filePath: string): T {
  return load(fs.readFileSync(filePath, 'utf8')) as T;
}

function validateCatalog(catalog: PlatformErrorRemediationCatalog) {
  for (const [code, entry] of Object.entries(catalog)) {
    const rawEntry = entry as unknown as Record<string, unknown>;
    for (const field of [
      'status',
      'title',
      'slug',
      'canonicalUrl',
      'example',
    ]) {
      if (field in rawEntry) {
        throw new Error(`${code} remediation must not duplicate ${field}`);
      }
    }

    assertNonEmptyString(entry.meaning, `${code}.meaning`);
    assertNonEmptyStringArray(entry.commonCauses, `${code}.commonCauses`);
    assertNonEmptyStringArray(
      entry.clientRemediation,
      `${code}.clientRemediation`,
    );
    assertNonEmptyString(entry.retryGuidance, `${code}.retryGuidance`);
    if (entry.adminRemediation) {
      assertNonEmptyStringArray(
        entry.adminRemediation,
        `${code}.adminRemediation`,
      );
    }
    if (entry.relatedDocs) {
      for (const [index, relatedDoc] of entry.relatedDocs.entries()) {
        assertNonEmptyString(
          relatedDoc.title,
          `${code}.relatedDocs.${index}.title`,
        );
        assertNonEmptyString(
          relatedDoc.href,
          `${code}.relatedDocs.${index}.href`,
        );
      }
    }
  }
}

function assertSameCodes(
  leftName: string,
  leftCodes: string[],
  rightName: string,
  rightCodes: string[],
) {
  const left = new Set(leftCodes);
  const right = new Set(rightCodes);
  const missing = rightCodes.filter((code) => !left.has(code));
  const extra = leftCodes.filter((code) => !right.has(code));

  if (missing.length > 0) {
    throw new Error(`missing ${leftName} entries for: ${missing.join(', ')}`);
  }
  if (extra.length > 0) {
    throw new Error(
      `${leftName} contains codes missing from ${rightName}: ${extra.join(', ')}`,
    );
  }
}

function assertNonEmptyString(value: unknown, name: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} must be a non-empty string`);
  }
}

function assertNonEmptyStringArray(value: unknown, name: string) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${name} must be a non-empty array`);
  }
  for (const [index, item] of value.entries()) {
    assertNonEmptyString(item, `${name}.${index}`);
  }
}

function renderIndexMdx(): string {
  return `---
title: Platform API Errors
description: Error reference for Glean Platform API ProblemDetail responses
hide_title: true
---

import PlatformErrorsIndex from '@site/src/components/PlatformErrors/PlatformErrorsIndex';
import platformErrorsData from '@site/src/data/platform-errors.json';

<PlatformErrorsIndex errors={platformErrorsData.errors} />
`;
}

function renderErrorPageMdx(error: PlatformErrorPage): string {
  return `---
title: ${error.title}
description: ${error.code} ProblemDetail reference for the Glean Platform API
---

# ${error.title}

## Code

- \`code\`: \`${error.code}\`
- \`status\`: \`${error.status}\`
- \`url\`: \`${error.canonicalUrl}\`

## What It Means

${error.remediation.meaning}

## Common Causes

${renderBullets(error.remediation.commonCauses)}

## How To Resolve

### Client Actions

${renderBullets(error.remediation.clientRemediation)}
${renderAdminRemediation(error.remediation)}
## Retry Guidance

${error.remediation.retryGuidance}

## Example Response

\`\`\`json
${JSON.stringify(error.example, null, 2)}
\`\`\`
${renderRelatedDocs(error.remediation)}
`;
}

function renderBullets(values: string[]): string {
  return values.map((value) => `- ${value}`).join('\n');
}

function renderAdminRemediation(remediation: PlatformErrorRemediation): string {
  if (!remediation.adminRemediation) {
    return '';
  }

  return `

### Admin Actions

${renderBullets(remediation.adminRemediation)}
`;
}

function renderRelatedDocs(remediation: PlatformErrorRemediation): string {
  if (!remediation.relatedDocs || remediation.relatedDocs.length === 0) {
    return '';
  }

  return `

## Related Docs

${remediation.relatedDocs.map((doc) => `- [${doc.title}](${doc.href})`).join('\n')}
`;
}
