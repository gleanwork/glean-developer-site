import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - plain .mjs module without type declarations
import {
  injectExperimentalHeaders,
  injectSkillsMultipartCurlSamples,
} from './openapi-capitalize-language.mjs';

const HEADER_NAME = 'X-Glean-Include-Experimental';

function loadSpec(spec: string) {
  return yaml.load(spec) as any;
}

describe('injectExperimentalHeaders', () => {
  it('injects the opt-in header on experimental operations', () => {
    const spec = loadSpec(`
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /rest/api/v1/tool-servers/{serverId}/auth:
    get:
      operationId: getToolServerAuthStatus
      x-glean-experimental:
        id: 52fde6ec-c18b-4de6-b761-f82008542ae7
        introduced: "2026-07-02"
      parameters:
        - in: path
          name: serverId
          required: true
          schema:
            type: string
      responses:
        200:
          description: Success
`);

    injectExperimentalHeaders(spec);

    const params =
      spec.paths['/rest/api/v1/tool-servers/{serverId}/auth'].get.parameters;
    expect(params).toHaveLength(2);

    const header = params[0];
    expect(header.in).toBe('header');
    expect(header.name).toBe(HEADER_NAME);
    expect(header.required).toBe(true);
    expect(header.schema).toEqual({ type: 'boolean', default: true });
    // Non-standard `value` pre-fills the generated cURL snippet in
    // docusaurus-theme-openapi-docs (see buildPostmanRequest setHeaders).
    expect(header.value).toBe('true');
  });

  it('creates a parameters array when the operation has none', () => {
    const spec = loadSpec(`
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /rest/api/v1/search:
    post:
      operationId: search
      x-glean-experimental:
        id: abc
      responses:
        200:
          description: Success
`);

    injectExperimentalHeaders(spec);

    const params = spec.paths['/rest/api/v1/search'].post.parameters;
    expect(params).toHaveLength(1);
    expect(params[0].name).toBe(HEADER_NAME);
  });

  it('leaves non-experimental operations untouched', () => {
    const spec = loadSpec(`
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /rest/api/v1/search:
    post:
      operationId: search
      responses:
        200:
          description: Success
`);

    injectExperimentalHeaders(spec);

    expect(spec.paths['/rest/api/v1/search'].post.parameters).toBeUndefined();
  });

  it('is idempotent when the header is already declared', () => {
    const spec = loadSpec(`
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /rest/api/v1/search:
    post:
      operationId: search
      x-glean-experimental:
        id: abc
      responses:
        200:
          description: Success
`);

    injectExperimentalHeaders(spec);
    injectExperimentalHeaders(spec);

    const params = spec.paths['/rest/api/v1/search'].post.parameters;
    expect(params.filter((p: any) => p.name === HEADER_NAME)).toHaveLength(1);
  });

  it('handles specs without paths', () => {
    expect(() => injectExperimentalHeaders({})).not.toThrow();
    expect(() => injectExperimentalHeaders(undefined)).not.toThrow();
  });
});

describe('injectSkillsMultipartCurlSamples', () => {
  it('adds a runnable file upload sample for each Skills multipart operation', () => {
    const spec = loadSpec(`
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
servers:
  - url: https://{instance}-be.glean.com
    variables:
      instance:
        default: instance-name
paths:
  /api/skills:
    post:
      operationId: platform-skills-create
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
      responses:
        200:
          content:
            application/json: {}
  /api/skills/{skill_id}/versions:
    post:
      operationId: platform-skills-create-version
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
      responses:
        200:
          content:
            application/json: {}
`);

    injectSkillsMultipartCurlSamples(spec);

    const createSample = spec.paths['/api/skills'].post['x-codeSamples'][0];
    expect(createSample).toEqual({
      lang: 'curl',
      label: 'cURL (multipart upload)',
      source: [
        "curl -L -X POST 'https://instance-name-be.glean.com/api/skills' \\",
        "  -H 'Accept: application/json' \\",
        "  -H 'X-Glean-Include-Experimental: true' \\",
        "  -H 'Authorization: Bearer <token>' \\",
        "  -F 'file=@./SKILL.md'",
      ].join('\n'),
    });
    expect(createSample.source).not.toContain('Content-Type');

    const versionSample =
      spec.paths['/api/skills/{skill_id}/versions'].post['x-codeSamples'][0];
    expect(versionSample.source).toContain('/api/skills/<skill_id>/versions');
  });

  it('is idempotent and leaves unrelated multipart operations untouched', () => {
    const spec = loadSpec(`
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /api/skills:
    post:
      operationId: platform-skills-create
      requestBody:
        content:
          multipart/form-data: {}
      x-codeSamples:
        - lang: cURL
          source: existing sample
  /rest/api/v1/upload:
    post:
      operationId: unrelated-upload
      requestBody:
        content:
          multipart/form-data: {}
`);

    injectSkillsMultipartCurlSamples(spec);
    injectSkillsMultipartCurlSamples(spec);

    expect(spec.paths['/api/skills'].post['x-codeSamples']).toHaveLength(1);
    expect(spec.paths['/rest/api/v1/upload'].post['x-codeSamples']).toBe(
      undefined,
    );
  });

  it('handles specs without paths', () => {
    expect(() => injectSkillsMultipartCurlSamples({})).not.toThrow();
    expect(() => injectSkillsMultipartCurlSamples(undefined)).not.toThrow();
  });
});
