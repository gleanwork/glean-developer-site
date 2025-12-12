import { describe, it, expect } from 'vitest';
import {
  toDeprecationItem,
  toEnumValueDeprecationItem,
  resolveRef,
  processDeprecatedValue,
  extractSchemaDeprecations,
  extractRequestBodyDeprecations,
  extractResponseDeprecations,
  extractOperationDeprecations,
  parseSpecFromString,
} from './deprecations-lib.mjs';

describe('toDeprecationItem', () => {
  it('should convert x-glean-deprecated to DeprecationItem', () => {
    const deprecated = {
      id: 'test-id-123',
      message: 'This field is deprecated',
      introduced: '2025-01-01',
      removal: '2025-07-01',
    };

    const result = toDeprecationItem(deprecated, 'field', 'testField');

    expect(result).toEqual({
      id: 'test-id-123',
      type: 'field',
      name: 'testField',
      message: 'This field is deprecated',
      introduced: '2025-01-01',
      removal: '2025-07-01',
    });
  });

  it('should include docs if present', () => {
    const deprecated = {
      id: 'test-id-123',
      message: 'This field is deprecated',
      introduced: '2025-01-01',
      removal: '2025-07-01',
      docs: 'https://docs.example.com/migration',
    };

    const result = toDeprecationItem(deprecated, 'endpoint', 'POST /api/test');

    expect(result.docs).toBe('https://docs.example.com/migration');
    expect(result.type).toBe('endpoint');
  });
});

describe('toEnumValueDeprecationItem', () => {
  it('should convert enum value deprecation to DeprecationItem', () => {
    const deprecated = {
      id: 'enum-id-456',
      'enum-value': 'OLD_VALUE',
      message: 'Use NEW_VALUE instead',
      introduced: '2025-02-01',
      removal: '2025-08-01',
    };

    const result = toEnumValueDeprecationItem(deprecated, 'status');

    expect(result).toEqual({
      id: 'enum-id-456',
      type: 'enum-value',
      name: 'status',
      enumValue: 'OLD_VALUE',
      message: 'Use NEW_VALUE instead',
      introduced: '2025-02-01',
      removal: '2025-08-01',
    });
  });

  it('should include docs if present', () => {
    const deprecated = {
      id: 'enum-id-456',
      'enum-value': 'OLD_VALUE',
      message: 'Use NEW_VALUE instead',
      introduced: '2025-02-01',
      removal: '2025-08-01',
      docs: 'https://docs.example.com/enums',
    };

    const result = toEnumValueDeprecationItem(deprecated, 'status');

    expect(result.docs).toBe('https://docs.example.com/enums');
  });
});

describe('resolveRef', () => {
  it('should return non-object values as-is', () => {
    expect(resolveRef(null, {})).toBe(null);
    expect(resolveRef(undefined, {})).toBe(undefined);
    expect(resolveRef('string', {})).toBe('string');
    expect(resolveRef(123, {})).toBe(123);
  });

  it('should return schema without $ref as-is', () => {
    const schema = { type: 'string' };
    expect(resolveRef(schema, {})).toBe(schema);
  });

  it('should resolve $ref pointers', () => {
    const spec = {
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      },
    };

    const result = resolveRef({ $ref: '#/components/schemas/User' }, spec);

    expect(result).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    });
  });

  it('should return undefined for non-existent refs', () => {
    const spec = { components: { schemas: {} } };
    const result = resolveRef(
      { $ref: '#/components/schemas/NonExistent' },
      spec,
    );
    expect(result).toBeUndefined();
  });
});

describe('processDeprecatedValue', () => {
  it('should process object format (standard deprecation)', () => {
    const deprecated = {
      id: 'dep-1',
      message: 'Deprecated',
      introduced: '2025-01-01',
      removal: '2025-07-01',
    };

    const result = processDeprecatedValue(deprecated, 'myField');

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('field');
    expect(result[0].name).toBe('myField');
  });

  it('should process array format (enum value deprecations)', () => {
    const deprecated = [
      {
        id: 'enum-1',
        'enum-value': 'VALUE_A',
        message: 'Use VALUE_B',
        introduced: '2025-01-01',
        removal: '2025-07-01',
      },
      {
        id: 'enum-2',
        'enum-value': 'VALUE_C',
        message: 'Use VALUE_D',
        introduced: '2025-01-01',
        removal: '2025-07-01',
      },
    ];

    const result = processDeprecatedValue(deprecated, 'enumField');

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('enum-value');
    expect(result[0].enumValue).toBe('VALUE_A');
    expect(result[1].enumValue).toBe('VALUE_C');
  });

  it('should skip array items without enum-value', () => {
    const deprecated = [
      {
        id: 'enum-1',
        'enum-value': 'VALUE_A',
        message: 'Valid',
        introduced: '2025-01-01',
        removal: '2025-07-01',
      },
      {
        id: 'invalid',
        message: 'No enum-value property',
        introduced: '2025-01-01',
        removal: '2025-07-01',
      },
    ];

    const result = processDeprecatedValue(deprecated, 'enumField');

    expect(result).toHaveLength(1);
    expect(result[0].enumValue).toBe('VALUE_A');
  });
});

describe('extractSchemaDeprecations', () => {
  it('should return empty array for non-object schemas', () => {
    expect(extractSchemaDeprecations(null, {})).toEqual([]);
    expect(extractSchemaDeprecations(undefined, {})).toEqual([]);
    expect(extractSchemaDeprecations('string', {})).toEqual([]);
  });

  it('should extract deprecation from schema with x-glean-deprecated', () => {
    const schema = {
      type: 'object',
      'x-glean-deprecated': {
        id: 'schema-dep',
        message: 'This schema is deprecated',
        introduced: '2025-01-01',
        removal: '2025-07-01',
      },
    };

    const result = extractSchemaDeprecations(schema, {});

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('schema-dep');
  });

  it('should extract deprecations from properties', () => {
    const schema = {
      type: 'object',
      properties: {
        oldField: {
          type: 'string',
          'x-glean-deprecated': {
            id: 'field-dep',
            message: 'Use newField instead',
            introduced: '2025-01-01',
            removal: '2025-07-01',
          },
        },
        normalField: {
          type: 'string',
        },
      },
    };

    const result = extractSchemaDeprecations(schema, {});

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('oldField');
  });

  it('should extract deprecations from nested properties', () => {
    const schema = {
      type: 'object',
      properties: {
        nested: {
          type: 'object',
          properties: {
            deepField: {
              type: 'string',
              'x-glean-deprecated': {
                id: 'deep-dep',
                message: 'Deeply nested deprecation',
                introduced: '2025-01-01',
                removal: '2025-07-01',
              },
            },
          },
        },
      },
    };

    const result = extractSchemaDeprecations(schema, {});

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('deepField');
  });

  it('should extract deprecations from array items', () => {
    const schema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          itemField: {
            type: 'string',
            'x-glean-deprecated': {
              id: 'item-dep',
              message: 'Array item field deprecated',
              introduced: '2025-01-01',
              removal: '2025-07-01',
            },
          },
        },
      },
    };

    const result = extractSchemaDeprecations(schema, {});

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('itemField');
  });

  it('should resolve $ref and extract deprecations', () => {
    const spec = {
      components: {
        schemas: {
          DeprecatedModel: {
            type: 'object',
            properties: {
              legacyField: {
                type: 'string',
                'x-glean-deprecated': {
                  id: 'ref-dep',
                  message: 'From referenced schema',
                  introduced: '2025-01-01',
                  removal: '2025-07-01',
                },
              },
            },
          },
        },
      },
    };

    const schema = { $ref: '#/components/schemas/DeprecatedModel' };
    const result = extractSchemaDeprecations(schema, spec);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ref-dep');
  });

  it('should handle circular references without infinite loop', () => {
    const spec = {
      components: {
        schemas: {
          Node: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              children: {
                type: 'array',
                items: { $ref: '#/components/schemas/Node' },
              },
            },
          },
        },
      },
    };

    const schema = { $ref: '#/components/schemas/Node' };

    // Should not throw or hang
    const result = extractSchemaDeprecations(schema, spec);
    expect(result).toEqual([]);
  });

  it('should extract deprecations from allOf schemas', () => {
    const schema = {
      allOf: [
        {
          type: 'object',
          properties: {
            baseField: {
              type: 'string',
              'x-glean-deprecated': {
                id: 'allof-dep',
                message: 'From allOf',
                introduced: '2025-01-01',
                removal: '2025-07-01',
              },
            },
          },
        },
        {
          type: 'object',
          properties: {
            extendedField: { type: 'string' },
          },
        },
      ],
    };

    const result = extractSchemaDeprecations(schema, {});

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('allof-dep');
  });
});

describe('extractRequestBodyDeprecations', () => {
  it('should return empty array for missing content', () => {
    expect(extractRequestBodyDeprecations(null, {})).toEqual([]);
    expect(extractRequestBodyDeprecations({}, {})).toEqual([]);
    expect(extractRequestBodyDeprecations({ content: null }, {})).toEqual([]);
  });

  it('should extract deprecations from request body schema', () => {
    const requestBody = {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              deprecatedInput: {
                type: 'string',
                'x-glean-deprecated': {
                  id: 'req-body-dep',
                  message: 'Request body field deprecated',
                  introduced: '2025-01-01',
                  removal: '2025-07-01',
                },
              },
            },
          },
        },
      },
    };

    const result = extractRequestBodyDeprecations(requestBody, {});

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('req-body-dep');
  });
});

describe('extractResponseDeprecations', () => {
  it('should return empty array for missing responses', () => {
    expect(extractResponseDeprecations(null, {})).toEqual([]);
    expect(extractResponseDeprecations(undefined, {})).toEqual([]);
  });

  it('should extract deprecations from response schema', () => {
    const responses = {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                legacyResult: {
                  type: 'string',
                  'x-glean-deprecated': {
                    id: 'response-dep',
                    message: 'Response field deprecated',
                    introduced: '2025-01-01',
                    removal: '2025-07-01',
                  },
                },
              },
            },
          },
        },
      },
    };

    const result = extractResponseDeprecations(responses, {});

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('response-dep');
  });
});

describe('extractOperationDeprecations', () => {
  it('should extract endpoint deprecation', () => {
    const operation = {
      'x-glean-deprecated': {
        id: 'endpoint-dep',
        message: 'This endpoint is deprecated',
        introduced: '2025-01-01',
        removal: '2025-07-01',
      },
    };

    const result = extractOperationDeprecations(
      operation,
      'post',
      '/api/v1/legacy',
      {},
    );

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('endpoint');
    expect(result[0].name).toBe('POST /api/v1/legacy');
  });

  it('should extract parameter deprecation', () => {
    const operation = {
      parameters: [
        {
          name: 'oldParam',
          in: 'query',
          'x-glean-deprecated': {
            id: 'param-dep',
            message: 'Use newParam instead',
            introduced: '2025-01-01',
            removal: '2025-07-01',
          },
        },
      ],
    };

    const result = extractOperationDeprecations(
      operation,
      'get',
      '/api/v1/search',
      {},
    );

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('parameter');
    expect(result[0].name).toBe('oldParam');
  });

  it('should extract parameter enum value deprecation', () => {
    const operation = {
      parameters: [
        {
          name: 'sortBy',
          in: 'query',
          'x-glean-deprecated': [
            {
              id: 'param-enum-dep',
              'enum-value': 'LEGACY_SORT',
              message: 'Use NEW_SORT',
              introduced: '2025-01-01',
              removal: '2025-07-01',
            },
          ],
        },
      ],
    };

    const result = extractOperationDeprecations(
      operation,
      'get',
      '/api/v1/list',
      {},
    );

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('enum-value');
    expect(result[0].name).toBe('sortBy');
    expect(result[0].enumValue).toBe('LEGACY_SORT');
  });

  it('should extract deprecations from request body and responses', () => {
    const operation = {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                inputField: {
                  type: 'string',
                  'x-glean-deprecated': {
                    id: 'input-dep',
                    message: 'Input deprecated',
                    introduced: '2025-01-01',
                    removal: '2025-07-01',
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  outputField: {
                    type: 'string',
                    'x-glean-deprecated': {
                      id: 'output-dep',
                      message: 'Output deprecated',
                      introduced: '2025-01-01',
                      removal: '2025-07-01',
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const result = extractOperationDeprecations(
      operation,
      'post',
      '/api/v1/process',
      {},
    );

    expect(result).toHaveLength(2);
    expect(result.map((d) => d.id).sort()).toEqual(['input-dep', 'output-dep']);
  });
});

describe('parseSpecFromString', () => {
  it('should return empty array for spec without paths', () => {
    const yaml = `
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
`;
    const result = parseSpecFromString(yaml);
    expect(result).toEqual([]);
  });

  it('should extract endpoint deprecation from YAML spec', () => {
    const yaml = `
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /api/v1/legacy:
    post:
      summary: Legacy endpoint
      x-glean-deprecated:
        id: legacy-endpoint
        message: Use /api/v2/new instead
        introduced: "2025-01-01"
        removal: "2025-07-01"
      responses:
        200:
          description: Success
`;
    const result = parseSpecFromString(yaml);

    expect(result).toHaveLength(1);
    expect(result[0].method).toBe('POST');
    expect(result[0].path).toBe('/api/v1/legacy');
    expect(result[0].deprecations).toHaveLength(1);
    expect(result[0].deprecations[0].type).toBe('endpoint');
  });

  it('should extract field deprecation from request body', () => {
    const yaml = `
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /api/v1/users:
    post:
      summary: Create user
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                username:
                  type: string
                legacyId:
                  type: string
                  x-glean-deprecated:
                    id: legacy-id-field
                    message: Use uuid instead
                    introduced: "2025-01-01"
                    removal: "2025-07-01"
      responses:
        200:
          description: Success
`;
    const result = parseSpecFromString(yaml);

    expect(result).toHaveLength(1);
    expect(result[0].deprecations).toHaveLength(1);
    expect(result[0].deprecations[0].type).toBe('field');
    expect(result[0].deprecations[0].name).toBe('legacyId');
  });

  it('should extract parameter deprecation', () => {
    const yaml = `
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /api/v1/search:
    get:
      summary: Search
      parameters:
        - name: oldFilter
          in: query
          schema:
            type: string
          x-glean-deprecated:
            id: old-filter-param
            message: Use filter instead
            introduced: "2025-01-01"
            removal: "2025-07-01"
      responses:
        200:
          description: Success
`;
    const result = parseSpecFromString(yaml);

    expect(result).toHaveLength(1);
    expect(result[0].deprecations).toHaveLength(1);
    expect(result[0].deprecations[0].type).toBe('parameter');
    expect(result[0].deprecations[0].name).toBe('oldFilter');
  });

  it('should extract enum value deprecation', () => {
    const yaml = `
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /api/v1/items:
    get:
      summary: List items
      parameters:
        - name: sortOrder
          in: query
          schema:
            type: string
            enum: [ASC, DESC, LEGACY_DEFAULT]
          x-glean-deprecated:
            - id: legacy-sort-value
              enum-value: LEGACY_DEFAULT
              message: Use ASC or DESC
              introduced: "2025-01-01"
              removal: "2025-07-01"
      responses:
        200:
          description: Success
`;
    const result = parseSpecFromString(yaml);

    expect(result).toHaveLength(1);
    expect(result[0].deprecations).toHaveLength(1);
    expect(result[0].deprecations[0].type).toBe('enum-value');
    expect(result[0].deprecations[0].enumValue).toBe('LEGACY_DEFAULT');
  });

  it('should resolve $ref and extract deprecations', () => {
    const yaml = `
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /api/v1/data:
    post:
      summary: Submit data
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DataRequest'
      responses:
        200:
          description: Success
components:
  schemas:
    DataRequest:
      type: object
      properties:
        value:
          type: string
        deprecatedField:
          type: string
          x-glean-deprecated:
            id: ref-resolved-dep
            message: Field in referenced schema deprecated
            introduced: "2025-01-01"
            removal: "2025-07-01"
`;
    const result = parseSpecFromString(yaml);

    expect(result).toHaveLength(1);
    expect(result[0].deprecations).toHaveLength(1);
    expect(result[0].deprecations[0].id).toBe('ref-resolved-dep');
  });

  it('should deduplicate deprecations by id', () => {
    const yaml = `
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /api/v1/data:
    post:
      summary: Submit data
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SharedModel'
      responses:
        200:
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SharedModel'
components:
  schemas:
    SharedModel:
      type: object
      properties:
        sharedField:
          type: string
          x-glean-deprecated:
            id: shared-dep
            message: Shared field deprecated
            introduced: "2025-01-01"
            removal: "2025-07-01"
`;
    const result = parseSpecFromString(yaml);

    expect(result).toHaveLength(1);
    // Should deduplicate - same schema referenced in request and response
    expect(result[0].deprecations).toHaveLength(1);
    expect(result[0].deprecations[0].id).toBe('shared-dep');
  });

  it('should handle path-level parameters', () => {
    const yaml = `
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /api/v1/resources/{id}:
    parameters:
      - name: legacyHeader
        in: header
        schema:
          type: string
        x-glean-deprecated:
          id: path-level-param
          message: Path-level param deprecated
          introduced: "2025-01-01"
          removal: "2025-07-01"
    get:
      summary: Get resource
      responses:
        200:
          description: Success
`;
    const result = parseSpecFromString(yaml);

    expect(result).toHaveLength(1);
    expect(result[0].deprecations).toHaveLength(1);
    expect(result[0].deprecations[0].id).toBe('path-level-param');
  });

  it('should handle multiple HTTP methods with deprecations', () => {
    const yaml = `
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /api/v1/resource:
    get:
      summary: Get resource
      x-glean-deprecated:
        id: get-dep
        message: GET deprecated
        introduced: "2025-01-01"
        removal: "2025-07-01"
      responses:
        200:
          description: Success
    post:
      summary: Create resource
      x-glean-deprecated:
        id: post-dep
        message: POST deprecated
        introduced: "2025-01-01"
        removal: "2025-07-01"
      responses:
        200:
          description: Success
`;
    const result = parseSpecFromString(yaml);

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.method).sort()).toEqual(['GET', 'POST']);
  });

  it('should not include endpoints without deprecations', () => {
    const yaml = `
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /api/v1/healthy:
    get:
      summary: Health check
      responses:
        200:
          description: Success
  /api/v1/legacy:
    get:
      summary: Legacy endpoint
      x-glean-deprecated:
        id: legacy-dep
        message: Deprecated
        introduced: "2025-01-01"
        removal: "2025-07-01"
      responses:
        200:
          description: Success
`;
    const result = parseSpecFromString(yaml);

    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('/api/v1/legacy');
  });
});
