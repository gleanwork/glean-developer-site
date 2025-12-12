/**
 * Library functions for extracting x-glean-deprecated properties from OpenAPI specs
 *
 * This module exports all the functions used by generate-deprecations.mjs
 * for testing purposes.
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

/**
 * Extra deprecations for testing purposes.
 * Add entries here to "fake" deprecations without modifying the OpenAPI specs.
 * Each entry should be an EndpointGroup with method, path, and deprecations array.
 *
 * Example:
 * {
 *   method: 'POST',
 *   path: '/api/v1/example',
 *   deprecations: [
 *     {
 *       id: 'test-deprecation-1',
 *       type: 'field',
 *       name: 'exampleField',
 *       message: 'This field is deprecated for testing.',
 *       introduced: '2025-01-01',
 *       removal: '2025-07-15',
 *     },
 *   ],
 * }
 *
 * @type {EndpointGroup[]}
 */
export const EXTRA_DEPRECATIONS = [];

/**
 * @typedef {Object} XGleanDeprecated
 * @property {string} id - UUID for internal bookkeeping
 * @property {string} message - Customer-facing explanation
 * @property {string} introduced - Date deprecation was introduced (YYYY-MM-DD)
 * @property {string} removal - Date feature will be removed (YYYY-MM-DD)
 * @property {string} [docs] - Additional documentation or URL
 */

/**
 * @typedef {Object} XGleanDeprecatedEnumValue
 * @property {string} id - UUID for internal bookkeeping
 * @property {string} 'enum-value' - The specific enum value being deprecated
 * @property {string} message - Customer-facing explanation
 * @property {string} introduced - Date deprecation was introduced (YYYY-MM-DD)
 * @property {string} [removal] - Date feature will be removed (YYYY-MM-DD)
 * @property {string} [docs] - Additional documentation or URL
 */

/**
 * @typedef {'endpoint' | 'field' | 'parameter' | 'enum-value'} DeprecationType
 */

/**
 * @typedef {Object} DeprecationItem
 * @property {string} id
 * @property {DeprecationType} type
 * @property {string} name
 * @property {string} message
 * @property {string} introduced
 * @property {string} removal
 * @property {string} [docs]
 * @property {string} [enumValue] - For enum-value deprecations, the specific value being deprecated
 */

/**
 * @typedef {Object} EndpointGroup
 * @property {string} method
 * @property {string} path
 * @property {DeprecationItem[]} deprecations
 */

/**
 * Convert x-glean-deprecated to DeprecationItem
 * @param {XGleanDeprecated} deprecated
 * @param {DeprecationType} type
 * @param {string} name
 * @returns {DeprecationItem}
 */
export function toDeprecationItem(deprecated, type, name) {
  const item = {
    id: deprecated.id,
    type,
    name,
    message: deprecated.message,
    introduced: deprecated.introduced,
    removal: deprecated.removal,
  };

  if (deprecated.docs) {
    item.docs = deprecated.docs;
  }

  return item;
}

/**
 * Convert x-glean-deprecated enum value array item to DeprecationItem
 * @param {XGleanDeprecatedEnumValue} deprecated
 * @param {string} fieldName - The field containing the enum
 * @returns {DeprecationItem}
 */
export function toEnumValueDeprecationItem(deprecated, fieldName) {
  const item = {
    id: deprecated.id,
    type: 'enum-value',
    name: fieldName,
    enumValue: deprecated['enum-value'],
    message: deprecated.message,
    introduced: deprecated.introduced,
    removal: deprecated.removal,
  };

  if (deprecated.docs) {
    item.docs = deprecated.docs;
  }

  return item;
}

/**
 * Resolve a $ref pointer to the actual schema
 * @param {Object} schemaOrRef - A schema object or $ref pointer
 * @param {Object} spec - The full OpenAPI spec for resolving refs
 * @returns {Object} The resolved schema
 */
export function resolveRef(schemaOrRef, spec) {
  if (!schemaOrRef || typeof schemaOrRef !== 'object') {
    return schemaOrRef;
  }

  if (schemaOrRef.$ref) {
    // Parse the $ref pointer (e.g., "#/components/schemas/Activity")
    const refPath = schemaOrRef.$ref;
    if (refPath.startsWith('#/')) {
      const parts = refPath.slice(2).split('/');
      let resolved = spec;
      for (const part of parts) {
        resolved = resolved?.[part];
      }
      return resolved;
    }
  }

  return schemaOrRef;
}

/**
 * Process x-glean-deprecated value which can be either an object or array format
 * @param {XGleanDeprecated | XGleanDeprecatedEnumValue[]} deprecated
 * @param {string} fieldName - The field name for context
 * @returns {DeprecationItem[]}
 */
export function processDeprecatedValue(deprecated, fieldName) {
  const deprecations = [];

  if (Array.isArray(deprecated)) {
    // Array format: enum value deprecations
    for (const enumDeprecation of deprecated) {
      if (enumDeprecation['enum-value']) {
        deprecations.push(
          toEnumValueDeprecationItem(enumDeprecation, fieldName),
        );
      }
    }
  } else if (deprecated && typeof deprecated === 'object') {
    // Object format: standard field/parameter/endpoint deprecation
    deprecations.push(toDeprecationItem(deprecated, 'field', fieldName));
  }

  return deprecations;
}

/**
 * Extract deprecations from schema properties recursively
 * @param {Object} schema
 * @param {Object} spec - The full OpenAPI spec for resolving refs
 * @param {string} parentPath - Current path in the schema (for nested properties)
 * @param {Set} visited - Set of visited $ref paths to prevent infinite recursion
 * @returns {DeprecationItem[]}
 */
export function extractSchemaDeprecations(
  schema,
  spec,
  parentPath = '',
  visited = new Set(),
) {
  const deprecations = [];

  if (!schema || typeof schema !== 'object') {
    return deprecations;
  }

  // Handle $ref - resolve and recurse
  if (schema.$ref) {
    if (visited.has(schema.$ref)) {
      return deprecations; // Prevent infinite recursion
    }
    visited.add(schema.$ref);
    const resolved = resolveRef(schema, spec);
    if (resolved) {
      deprecations.push(
        ...extractSchemaDeprecations(resolved, spec, parentPath, visited),
      );
    }
    return deprecations;
  }

  // Check if this schema itself has x-glean-deprecated
  if (schema['x-glean-deprecated']) {
    // This handles the case where a schema ref is deprecated
    deprecations.push(
      ...processDeprecatedValue(
        schema['x-glean-deprecated'],
        parentPath || 'schema',
      ),
    );
  }

  // Check properties
  if (schema.properties && typeof schema.properties === 'object') {
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const fullPath = parentPath ? `${parentPath}.${propName}` : propName;

      if (propSchema['x-glean-deprecated']) {
        deprecations.push(
          ...processDeprecatedValue(propSchema['x-glean-deprecated'], propName),
        );
      }

      // Recursively check nested objects - pass the original propSchema so $ref handling works
      if (propSchema.properties || propSchema.items || propSchema.$ref) {
        deprecations.push(
          ...extractSchemaDeprecations(propSchema, spec, fullPath, visited),
        );
      }
    }
  }

  // Check items (for arrays)
  if (schema.items) {
    deprecations.push(
      ...extractSchemaDeprecations(schema.items, spec, parentPath, visited),
    );
  }

  // Check allOf, anyOf, oneOf
  for (const keyword of ['allOf', 'anyOf', 'oneOf']) {
    if (Array.isArray(schema[keyword])) {
      for (const subSchema of schema[keyword]) {
        deprecations.push(
          ...extractSchemaDeprecations(subSchema, spec, parentPath, visited),
        );
      }
    }
  }

  return deprecations;
}

/**
 * Extract deprecations from request body
 * @param {Object} requestBody
 * @param {Object} spec - The full OpenAPI spec for resolving refs
 * @returns {DeprecationItem[]}
 */
export function extractRequestBodyDeprecations(requestBody, spec) {
  const deprecations = [];

  if (!requestBody?.content) {
    return deprecations;
  }

  for (const mediaType of Object.values(requestBody.content)) {
    if (mediaType.schema) {
      deprecations.push(...extractSchemaDeprecations(mediaType.schema, spec));
    }
  }

  return deprecations;
}

/**
 * Extract deprecations from responses
 * @param {Object} responses
 * @param {Object} spec - The full OpenAPI spec for resolving refs
 * @returns {DeprecationItem[]}
 */
export function extractResponseDeprecations(responses, spec) {
  const deprecations = [];

  if (!responses) {
    return deprecations;
  }

  for (const response of Object.values(responses)) {
    if (response.content) {
      for (const mediaType of Object.values(response.content)) {
        if (mediaType.schema) {
          deprecations.push(
            ...extractSchemaDeprecations(mediaType.schema, spec),
          );
        }
      }
    }
  }

  return deprecations;
}

/**
 * Extract deprecations from an operation
 * @param {Object} operation
 * @param {string} method
 * @param {string} path
 * @param {Object} spec - The full OpenAPI spec for resolving refs
 * @returns {DeprecationItem[]}
 */
export function extractOperationDeprecations(operation, method, path, spec) {
  const deprecations = [];

  // Check if the operation itself is deprecated
  if (operation['x-glean-deprecated']) {
    deprecations.push(
      toDeprecationItem(
        operation['x-glean-deprecated'],
        'endpoint',
        `${method.toUpperCase()} ${path}`,
      ),
    );
  }

  // Check parameters
  if (Array.isArray(operation.parameters)) {
    for (const param of operation.parameters) {
      if (param['x-glean-deprecated']) {
        const deprecated = param['x-glean-deprecated'];
        if (Array.isArray(deprecated)) {
          // Array format: enum value deprecations for this parameter
          for (const enumDeprecation of deprecated) {
            if (enumDeprecation['enum-value']) {
              deprecations.push(
                toEnumValueDeprecationItem(enumDeprecation, param.name),
              );
            }
          }
        } else {
          // Object format: the parameter itself is deprecated
          deprecations.push(
            toDeprecationItem(deprecated, 'parameter', param.name),
          );
        }
      }
    }
  }

  // Check request body
  if (operation.requestBody) {
    deprecations.push(
      ...extractRequestBodyDeprecations(operation.requestBody, spec),
    );
  }

  // Check responses
  if (operation.responses) {
    deprecations.push(
      ...extractResponseDeprecations(operation.responses, spec),
    );
  }

  return deprecations;
}

/**
 * Parse an OpenAPI spec and extract all deprecations
 * @param {string} specPath
 * @returns {EndpointGroup[]}
 */
export function parseSpec(specPath) {
  console.log(`📖 Reading spec: ${specPath}`);

  if (!fs.existsSync(specPath)) {
    console.warn(`⚠️  Spec file not found: ${specPath}`);
    return [];
  }

  const content = fs.readFileSync(specPath, 'utf8');
  const spec = yaml.load(content);

  if (!spec.paths) {
    console.warn(`⚠️  No paths found in spec: ${specPath}`);
    return [];
  }

  const endpointGroups = [];
  const httpMethods = ['get', 'post', 'put', 'patch', 'delete'];

  for (const [pathKey, pathItem] of Object.entries(spec.paths)) {
    // Check path-level parameters
    const pathLevelParams = pathItem.parameters || [];

    for (const method of httpMethods) {
      const operation = pathItem[method];
      if (!operation) continue;

      // Merge path-level parameters
      const allParams = [...pathLevelParams, ...(operation.parameters || [])];
      const operationWithParams = { ...operation, parameters: allParams };

      const deprecations = extractOperationDeprecations(
        operationWithParams,
        method,
        pathKey,
        spec,
      );

      if (deprecations.length > 0) {
        // Deduplicate by id
        const uniqueDeprecations = [];
        const seenIds = new Set();

        for (const dep of deprecations) {
          if (!seenIds.has(dep.id)) {
            seenIds.add(dep.id);
            uniqueDeprecations.push(dep);
          }
        }

        endpointGroups.push({
          method: method.toUpperCase(),
          path: pathKey,
          deprecations: uniqueDeprecations,
        });
      }
    }
  }

  console.log(`   Found ${endpointGroups.length} endpoints with deprecations`);
  return endpointGroups;
}

/**
 * Parse an OpenAPI spec from a YAML string (for testing)
 * @param {string} yamlContent - The YAML content as a string
 * @returns {EndpointGroup[]}
 */
export function parseSpecFromString(yamlContent) {
  const spec = yaml.load(yamlContent);

  if (!spec.paths) {
    return [];
  }

  const endpointGroups = [];
  const httpMethods = ['get', 'post', 'put', 'patch', 'delete'];

  for (const [pathKey, pathItem] of Object.entries(spec.paths)) {
    // Check path-level parameters
    const pathLevelParams = pathItem.parameters || [];

    for (const method of httpMethods) {
      const operation = pathItem[method];
      if (!operation) continue;

      // Merge path-level parameters
      const allParams = [...pathLevelParams, ...(operation.parameters || [])];
      const operationWithParams = { ...operation, parameters: allParams };

      const deprecations = extractOperationDeprecations(
        operationWithParams,
        method,
        pathKey,
        spec,
      );

      if (deprecations.length > 0) {
        // Deduplicate by id
        const uniqueDeprecations = [];
        const seenIds = new Set();

        for (const dep of deprecations) {
          if (!seenIds.has(dep.id)) {
            seenIds.add(dep.id);
            uniqueDeprecations.push(dep);
          }
        }

        endpointGroups.push({
          method: method.toUpperCase(),
          path: pathKey,
          deprecations: uniqueDeprecations,
        });
      }
    }
  }

  return endpointGroups;
}

/**
 * Main function to generate deprecations.json
 * @param {Object} options - Configuration options
 * @param {string} [options.rootDir] - Root directory (defaults to computed from import.meta.url)
 * @param {string[]} [options.specFiles] - Spec file paths (defaults to standard locations)
 * @param {string} [options.outputFile] - Output file path (defaults to src/data/deprecations.json)
 * @param {EndpointGroup[]} [options.extraDeprecations] - Extra deprecations to include
 */
export function generateDeprecations(options = {}) {
  // Compute root directory
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const rootDir = options.rootDir || path.resolve(__dirname, '..');

  // Compute spec files
  const specFiles = options.specFiles || [
    path.join(rootDir, 'openapi/client/client-capitalized.yaml'),
    path.join(rootDir, 'openapi/indexing/indexing-capitalized.yaml'),
  ];

  // Compute output file
  const outputFile =
    options.outputFile || path.join(rootDir, 'src/data/deprecations.json');

  // Extra deprecations
  const extraDeprecations = options.extraDeprecations || EXTRA_DEPRECATIONS;

  console.log('🔍 Scanning OpenAPI specs for deprecations...\n');

  const allEndpoints = [];

  for (const specPath of specFiles) {
    const endpoints = parseSpec(specPath);
    allEndpoints.push(...endpoints);
  }

  // Merge extra deprecations (for testing)
  if (extraDeprecations.length > 0) {
    console.log(
      `\n📌 Adding ${extraDeprecations.length} extra deprecation group(s) for testing`,
    );
    allEndpoints.push(...extraDeprecations);
  }

  // Sort endpoints by path and method
  allEndpoints.sort((a, b) => {
    const pathCompare = a.path.localeCompare(b.path);
    if (pathCompare !== 0) return pathCompare;
    return a.method.localeCompare(b.method);
  });

  // Count total deprecations
  const totalCount = allEndpoints.reduce(
    (sum, ep) => sum + ep.deprecations.length,
    0,
  );

  const output = {
    endpoints: allEndpoints,
    generatedAt: new Date().toISOString(),
    totalCount,
  };

  // Ensure output directory exists
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2) + '\n');

  console.log(`\n✅ Generated ${outputFile}`);
  console.log(`   Total endpoints with deprecations: ${allEndpoints.length}`);
  console.log(`   Total deprecation items: ${totalCount}`);
}
