import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - plain .mjs module without type declarations
import { injectExperimentalHeaders } from './openapi-capitalize-language.mjs';

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
