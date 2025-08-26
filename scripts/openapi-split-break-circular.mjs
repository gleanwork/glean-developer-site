#!/usr/bin/env node

/**
 * DETERMINISTIC Split-first approach: Split OpenAPI by tags first, then resolve circular references per-tag
 * This version ensures 100% deterministic output by eliminating all sources of non-determinism
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import https from 'https';
import http from 'http';

function fetchFromUrl(url) {
  /**Fetch content from URL*/
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https://') ? https : http;

    protocol
      .get(url, (response) => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          let data = '';
          response.on('data', (chunk) => (data += chunk));
          response.on('end', () => resolve(data));
        } else {
          reject(
            new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`),
          );
        }
      })
      .on('error', reject);
  });
}

async function readContent(inputPath) {
  /**Read content from file or URL*/
  if (inputPath.startsWith('http://') || inputPath.startsWith('https://')) {
    return await fetchFromUrl(inputPath);
  } else {
    console.log(`  Reading local file: ${inputPath}...`);
    return fs.readFileSync(inputPath, 'utf-8');
  }
}

function collectSchemaRefs(obj, refs) {
  /**Collect all schema references from an object*/
  if (typeof obj !== 'object' || obj === null) {
    return;
  }

  if ('$ref' in obj && obj['$ref'].startsWith('#/components/schemas/')) {
    refs.add(obj['$ref']);
  }

  for (const value of Object.values(obj)) {
    if (typeof value === 'object' && value !== null) {
      collectSchemaRefs(value, refs);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        collectSchemaRefs(item, refs);
      }
    }
  }
}

function collectAllReferencedSchemas(taggedPaths, allSchemas) {
  /**Collect all schemas referenced by the tagged paths, following $ref chains*/
  // Get all direct schema references
  const usedSchemaRefs = new Set();

  for (const pathItem of Object.values(taggedPaths)) {
    for (const operation of Object.values(pathItem)) {
      collectSchemaRefs(operation, usedSchemaRefs);
    }
  }

  if (usedSchemaRefs.size === 0) {
    return {};
  }

  // Convert refs to schema names
  const directSchemas = new Set();
  for (const ref of usedSchemaRefs) {
    const schemaName = ref.replace('#/components/schemas/', '');
    directSchemas.add(schemaName);
  }

  // Now collect all schemas that are referenced by these schemas (following $ref chains)
  const allNeededSchemas = new Set();
  const toProcess = Array.from(directSchemas);

  while (toProcess.length > 0) {
    const schemaName = toProcess.shift();
    if (allNeededSchemas.has(schemaName) || !(schemaName in allSchemas)) {
      continue;
    }

    allNeededSchemas.add(schemaName);

    // Find all schemas referenced by this schema
    const schemaRefs = new Set();
    collectSchemaRefs(allSchemas[schemaName], schemaRefs);

    for (const ref of schemaRefs) {
      const refName = ref.replace('#/components/schemas/', '');
      if (!allNeededSchemas.has(refName)) {
        toProcess.push(refName);
      }
    }
  }

  // Return all needed schemas
  const neededSchemas = {};
  for (const schemaName of allNeededSchemas) {
    if (schemaName in allSchemas) {
      neededSchemas[schemaName] = allSchemas[schemaName];
    }
  }

  return neededSchemas;
}

function collectParameterRefs(obj, refs) {
  /**Collect all parameter references from an object*/
  if (typeof obj !== 'object' || obj === null) {
    return;
  }

  if ('$ref' in obj && obj['$ref'].startsWith('#/components/parameters/')) {
    refs.add(obj['$ref']);
  }

  for (const value of Object.values(obj)) {
    if (typeof value === 'object' && value !== null) {
      collectParameterRefs(value, refs);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        collectParameterRefs(item, refs);
      }
    }
  }
}

function collectAllReferencedParameters(taggedPaths, allParameters) {
  /**Collect all parameters referenced by the tagged paths*/
  // Get all direct parameter references
  const usedParameterRefs = new Set();

  for (const pathItem of Object.values(taggedPaths)) {
    for (const operation of Object.values(pathItem)) {
      collectParameterRefs(operation, usedParameterRefs);
    }
  }

  if (usedParameterRefs.size === 0) {
    return {};
  }

  // Convert refs to parameter names and collect them
  const neededParameters = {};
  for (const ref of usedParameterRefs) {
    const paramName = ref.replace('#/components/parameters/', '');
    if (paramName in allParameters) {
      neededParameters[paramName] = allParameters[paramName];
    }
  }

  return neededParameters;
}

class DeterministicCircularResolver {
  /**DETERMINISTIC: Split by tags first, then resolve circular references with 100% deterministic behavior*/

  constructor() {
    this.schemaGraph = {}; // Use Array instead of Set for determinism
    this.circularRefs = new Set();
    this.resolvedCache = {};
  }

  extractSchemaReferences(schema, refs = new Set()) {
    /**Extract all $ref references from a schema*/

    if (typeof schema !== 'object' || schema === null) {
      return refs;
    }

    if (
      '$ref' in schema &&
      schema['$ref'].startsWith('#/components/schemas/')
    ) {
      const refName = schema['$ref'].replace('#/components/schemas/', '');
      refs.add(refName);
    }

    for (const value of Object.values(schema)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          this.extractSchemaReferences(item, refs);
        }
      } else if (typeof value === 'object' && value !== null) {
        this.extractSchemaReferences(value, refs);
      }
    }

    return refs;
  }

  buildSchemaGraph(schemas) {
    /**Build dependency graph of schemas - DETERMINISTIC VERSION*/
    this.schemaGraph = {};

    for (const [schemaName, schema] of Object.entries(schemas)) {
      const refs = this.extractSchemaReferences(schema);
      // Convert set to SORTED list for deterministic iteration
      this.schemaGraph[schemaName] = Array.from(refs).sort();
    }
  }

  printSchemaGraph() {
    console.log('\nSchema Dependency Graph:');
    for (const [parent, children] of Object.entries(this.schemaGraph)) {
      console.log(`- ${parent}: [${children.join(', ')}]`);
    }
  }

  detectCircularReferences(schemas) {
    /**Detect all circular references - DETERMINISTIC VERSION*/
    this.buildSchemaGraph(schemas);
    this.printSchemaGraph();
    const visitedGlobal = new Set();
    const circularSchemas = new Set();

    const dfsAllPaths = (node, path, visitedInPath) => {
      /**DFS that explores ALL paths, not just first cycles found*/
      if (visitedInPath.has(node)) {
        // Found a cycle - mark all schemas in the current path as circular
        const cycleStartIdx = path.indexOf(node);
        const cycleSchemas = new Set(path.slice(cycleStartIdx));
        for (const schema of cycleSchemas) {
          circularSchemas.add(schema);
        }
        return;
      }

      // Continue exploring even if we've visited this node in other paths
      visitedInPath.add(node);
      path.push(node);

      // DETERMINISTIC: dependencies is now a sorted list, not a set
      const dependencies = this.schemaGraph[node] || [];
      for (const dep of dependencies) {
        // Now iterates in sorted order!
        if (dep in this.schemaGraph) {
          // Only follow refs to schemas that exist
          dfsAllPaths(dep, [...path], new Set(visitedInPath));
        }
      }

      visitedInPath.delete(node);
      path.pop();
    };

    // Start DFS from every schema in SORTED order for determinism
    for (const schemaName of Object.keys(schemas).sort()) {
      if (!visitedGlobal.has(schemaName)) {
        dfsAllPaths(schemaName, [], new Set());
        visitedGlobal.add(schemaName);
      }
    }

    // Also check for direct self-references
    for (const [schemaName, schema] of Object.entries(schemas)) {
      const refs = this.extractSchemaReferences(schema);
      if (refs.has(schemaName)) {
        circularSchemas.add(schemaName);
      }
    }

    return circularSchemas;
  }

  calculateSchemaComplexity(schemaName, schema, allSchemas) {
    /**Calculate complexity score for a schema to optimize MDX ordering - DETERMINISTIC*/
    let complexity = 0;

    // Major factor: Count direct references to other schemas
    const refs = this.extractSchemaReferences(schema);
    const schemaRefs = Array.from(refs).filter(
      (r) => r in allSchemas && r !== schemaName,
    );
    complexity += schemaRefs.length * 100;

    // Count total properties/fields in schema
    const countProperties = (obj) => {
      let count = 0;
      if (typeof obj === 'object' && obj !== null) {
        if ('properties' in obj) {
          count += Object.keys(obj['properties']).length;
        }
        // Process dict items in sorted order for determinism
        for (const key of Object.keys(obj).sort()) {
          const value = obj[key];
          if (typeof value === 'object' && value !== null) {
            count += countProperties(value);
          }
        }
      } else if (Array.isArray(obj)) {
        for (const item of obj) {
          count += countProperties(item);
        }
      }
      return count;
    };

    const propertyCount = countProperties(schema);
    complexity += propertyCount * 5;

    // Penalize schemas with deeply nested structures
    const countNestingDepth = (obj, depth = 0) => {
      if (depth > 10) {
        // Prevent infinite recursion
        return depth;
      }
      let maxDepth = depth;
      if (typeof obj === 'object' && obj !== null) {
        // Process dict items in sorted order for determinism
        for (const key of Object.keys(obj).sort()) {
          const value = obj[key];
          if (
            ['properties', 'items', 'allOf', 'oneOf', 'anyOf'].includes(key)
          ) {
            maxDepth = Math.max(maxDepth, countNestingDepth(value, depth + 1));
          } else {
            maxDepth = Math.max(maxDepth, countNestingDepth(value, depth));
          }
        }
      } else if (Array.isArray(obj)) {
        for (const item of obj) {
          maxDepth = Math.max(maxDepth, countNestingDepth(item, depth + 1));
        }
      }
      return maxDepth;
    };

    const nestingDepth = countNestingDepth(schema);
    complexity += nestingDepth * 20;

    // Penalize schemas with arrays of complex objects
    const countArrayComplexity = (obj) => {
      let count = 0;
      if (typeof obj === 'object' && obj !== null) {
        if ('type' in obj && obj['type'] === 'array' && 'items' in obj) {
          const items = obj['items'];
          if (
            typeof items === 'object' &&
            items !== null &&
            ('$ref' in items || 'properties' in items)
          ) {
            count += 80; // Array of complex objects is very expensive
          } else if (typeof items === 'object' && items !== null) {
            count += 20; // Array of simple objects
          }
        }
        // Process dict items in sorted order for determinism
        for (const key of Object.keys(obj).sort()) {
          const value = obj[key];
          count += countArrayComplexity(value);
        }
      } else if (Array.isArray(obj)) {
        for (const item of obj) {
          count += countArrayComplexity(item);
        }
      }
      return count;
    };

    complexity += countArrayComplexity(schema);

    // Major bonus for simple schemas (enums, basic types)
    if (['string', 'integer', 'boolean', 'number'].includes(schema.type)) {
      if ('enum' in schema) {
        complexity -= 150;
      } else {
        complexity -= 80;
      }
    }

    // Big bonus for schemas with no references
    if (schemaRefs.length === 0) {
      complexity -= 120;
    }

    // Special handling for known simple patterns
    if (
      schemaName.endsWith('Id') ||
      (schemaName.endsWith('Request') && schemaRefs.length <= 1)
    ) {
      complexity -= 50;
    }

    // Special penalty for known complex patterns
    if (
      schemaName.includes('Document') ||
      schemaName.includes('Result') ||
      schemaName.includes('Metadata')
    ) {
      complexity += 80;
    }

    return complexity;
  }

  simpleDependencySort(schemas) {
    /**Sort schemas to minimize MDX blow-up - DETERMINISTIC*/

    // Calculate complexity scores for all schemas
    const complexityScores = {};
    for (const [schemaName, schema] of Object.entries(schemas)) {
      complexityScores[schemaName] = this.calculateSchemaComplexity(
        schemaName,
        schema,
        schemas,
      );
    }

    // Sort by: 1) complexity (simple first), 2) alphabetically for determinism
    const sortedNames = Object.keys(schemas).sort((a, b) => {
      const complexityDiff = complexityScores[a] - complexityScores[b];
      return complexityDiff !== 0 ? complexityDiff : a.localeCompare(b);
    });

    // Return ordered dict maintaining the sorted order
    const result = {};
    for (const name of sortedNames) {
      result[name] = schemas[name];
    }
    return result;
  }

  getSchemasUsedByTag(apiSpec, tag) {
    /**Get all schemas used by a specific tag*/
    // Get all paths for this tag
    const taggedPaths = {};
    const paths = apiSpec.paths || {};
    for (const [pathName, pathItem] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (
          ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(
            method.toUpperCase(),
          )
        ) {
          const operationTags = operation.tags || [];
          if (operationTags.includes(tag)) {
            if (!(pathName in taggedPaths)) {
              taggedPaths[pathName] = {};
            }
            taggedPaths[pathName][method] = operation;
          }
        }
      }
    }

    const allSchemas = (apiSpec.components && apiSpec.components.schemas) || {};
    const usedSchemas = collectAllReferencedSchemas(taggedPaths, allSchemas);

    // Return schemas in dependency-optimized order
    return this.simpleDependencySort(usedSchemas);
  }

  getParametersUsedByTag(apiSpec, tag) {
    /**Get all parameters used by a specific tag*/
    // Get all paths for this tag
    const taggedPaths = {};
    const paths = apiSpec.paths || {};
    for (const [pathName, pathItem] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (
          ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(
            method.toUpperCase(),
          )
        ) {
          const operationTags = operation.tags || [];
          if (operationTags.includes(tag)) {
            if (!(pathName in taggedPaths)) {
              taggedPaths[pathName] = {};
            }
            taggedPaths[pathName][method] = operation;
          }
        }
      }
    }

    const allParameters =
      (apiSpec.components && apiSpec.components.parameters) || {};
    return collectAllReferencedParameters(taggedPaths, allParameters);
  }

  resolveSchemaWithSelectiveInlining(
    schemaName,
    allSchemas,
    visited,
    depth = 0,
    inArray = false,
  ) {
    /**Resolve a schema with selective inlining of circular references only*/

    // Check cache first to prevent re-resolving the same schema
    const cacheKey = `${schemaName}_${inArray}_${depth}`;
    if (cacheKey in this.resolvedCache) {
      return this.resolvedCache[cacheKey];
    }

    // Prevent infinite recursion with depth limit
    if (depth > 5) {
      let placeholder;
      if (inArray) {
        placeholder = {
          type: 'object',
          properties: {
            [schemaName]: {
              type: 'object',
              description: `${schemaName} object`, // max depth
            },
          },
        };
      } else {
        placeholder = {
          type: 'object',
          description: `${schemaName} object`,
        };
      }
      this.resolvedCache[cacheKey] = placeholder;
      return placeholder;
    }

    const schema = allSchemas[schemaName];
    if (!schema) {
      let placeholder;
      if (inArray) {
        placeholder = {
          type: 'object',
          properties: {
            [schemaName]: {
              type: 'object',
              description: `Schema ${schemaName} not found`,
            },
          },
        };
      } else {
        placeholder = {
          type: 'object',
          description: `Schema ${schemaName} not found`,
        };
      }
      this.resolvedCache[cacheKey] = placeholder;
      return placeholder;
    }

    // For circular references, we still inline but track to prevent infinite loops
    const isCircular = visited.has(schemaName);

    // Add to visited set to detect circular references
    visited.add(schemaName);

    try {
      const resolved = this.resolveSchemaObjectSelectively(
        schema,
        allSchemas,
        visited,
        depth,
        inArray,
        isCircular,
      );

      // Only remove from visited if this wasn't already a circular reference
      if (!isCircular) {
        visited.delete(schemaName);
      }

      // Cache the resolved schema
      this.resolvedCache[cacheKey] = resolved;
      return resolved;
    } catch (e) {
      // Only remove from visited if this wasn't already a circular reference
      if (!isCircular) {
        visited.delete(schemaName);
      }
      let placeholder;
      if (inArray) {
        placeholder = {
          type: 'object',
          properties: {
            [schemaName]: {
              type: 'object',
              description: `Error resolving ${schemaName}: ${e}`,
            },
          },
        };
      } else {
        placeholder = {
          type: 'object',
          description: `Error resolving ${schemaName}: ${e}`,
        };
      }
      this.resolvedCache[cacheKey] = placeholder;
      return placeholder;
    }
  }

  resolveSchemaObjectSelectively(
    obj,
    allSchemas,
    visited,
    depth = 0,
    inArray = false,
    isCircular = false,
  ) {
    /**Resolve schema object, inlining everything for circular references*/
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    // Handle $ref - inline if it's part of a circular reference
    if ('$ref' in obj && obj['$ref'].startsWith('#/components/schemas/')) {
      const refName = obj['$ref'].replace('#/components/schemas/', '');

      // If this reference is NOT part of a circular chain, keep it as $ref
      if (!this.circularRefs.has(refName)) {
        return obj; // Keep as $ref
      }

      // Otherwise, inline it
      return this.resolveSchemaWithSelectiveInlining(
        refName,
        allSchemas,
        visited,
        depth + 1,
        inArray,
      );
    }

    const resolved = {};

    // Copy primitive properties first - PROCESS IN SORTED ORDER FOR DETERMINISM
    for (const key of Object.keys(obj).sort()) {
      if (!['properties', 'items', 'allOf', 'oneOf', 'anyOf'].includes(key)) {
        resolved[key] = obj[key];
      }
    }

    // Handle arrays
    if (obj.type === 'array' && 'items' in obj) {
      resolved['type'] = 'array';
      const resolvedItems = this.resolveSchemaObjectSelectively(
        obj['items'],
        allSchemas,
        visited,
        depth + 1,
        true,
        isCircular,
      );
      if ('properties' in resolvedItems && !('type' in resolvedItems)) {
        resolvedItems['type'] = 'object';
      }
      resolved['items'] = resolvedItems;
    } else if ('items' in obj) {
      const resolvedItems = this.resolveSchemaObjectSelectively(
        obj['items'],
        allSchemas,
        visited,
        depth + 1,
        true,
        isCircular,
      );
      if ('properties' in resolvedItems && !('type' in resolvedItems)) {
        resolvedItems['type'] = 'object';
      }
      resolved['items'] = resolvedItems;
      if (!('type' in resolved)) {
        resolved['type'] = 'array';
      }
    }

    // Handle properties - PROCESS IN SORTED ORDER FOR DETERMINISM
    if ('properties' in obj) {
      resolved['properties'] = {};
      for (const propName of Object.keys(obj['properties']).sort()) {
        const propDef = obj['properties'][propName];
        try {
          resolved['properties'][propName] =
            this.resolveSchemaObjectSelectively(
              propDef,
              allSchemas,
              visited,
              depth + 1,
              false,
              isCircular,
            );
        } catch (e) {
          console.log(`     Error resolving property ${propName}: ${e}`);
          resolved['properties'][propName] = {
            type: 'object',
            description: `Error resolving property ${propName}`,
          };
        }
      }
    }

    // Handle allOf - merge properties
    if ('allOf' in obj) {
      const mergedProps = {};
      let mergedRequired = [];

      for (let i = 0; i < obj['allOf'].length; i++) {
        const subSchema = obj['allOf'][i];
        try {
          const resolvedSub = this.resolveSchemaObjectSelectively(
            subSchema,
            allSchemas,
            visited,
            depth + 1,
            false,
            isCircular,
          );
          if ('properties' in resolvedSub) {
            Object.assign(mergedProps, resolvedSub['properties']);
          }
          if ('required' in resolvedSub) {
            mergedRequired = mergedRequired.concat(resolvedSub['required']);
          }

          // Copy other properties
          for (const prop of [
            'description',
            'format',
            'example',
            'enum',
            'minimum',
            'maximum',
          ]) {
            if (prop in resolvedSub && !(prop in resolved)) {
              resolved[prop] = resolvedSub[prop];
            }
          }

          if ('type' in resolvedSub && !('type' in resolved)) {
            resolved['type'] = resolvedSub['type'];
          }
        } catch (e) {
          console.log(`     Error resolving allOf[${i}]: ${e}`);
        }
      }

      resolved['properties'] = {
        ...mergedProps,
        ...(resolved['properties'] || {}),
      };
      if (mergedRequired.length > 0) {
        resolved['required'] = Array.from(
          new Set([...mergedRequired, ...(resolved['required'] || [])]),
        );
      }
    }

    // Handle oneOf/anyOf - keep structure but resolve references selectively
    if ('oneOf' in obj) {
      resolved['oneOf'] = [];
      for (let i = 0; i < obj['oneOf'].length; i++) {
        const subSchema = obj['oneOf'][i];
        try {
          resolved['oneOf'].push(
            this.resolveSchemaObjectSelectively(
              subSchema,
              allSchemas,
              visited,
              depth + 1,
              false,
              isCircular,
            ),
          );
        } catch (e) {
          console.log(`     Error resolving oneOf[${i}]: ${e}`);
          resolved['oneOf'].push({
            type: 'object',
            description: `Error resolving oneOf[${i}]`,
          });
        }
      }
    }

    if ('anyOf' in obj) {
      resolved['anyOf'] = [];
      for (let i = 0; i < obj['anyOf'].length; i++) {
        const subSchema = obj['anyOf'][i];
        try {
          resolved['anyOf'].push(
            this.resolveSchemaObjectSelectively(
              subSchema,
              allSchemas,
              visited,
              depth + 1,
              false,
              isCircular,
            ),
          );
        } catch (e) {
          console.log(`     Error resolving anyOf[${i}]: ${e}`);
          resolved['anyOf'].push({
            type: 'object',
            description: `Error resolving anyOf[${i}]`,
          });
        }
      }
    }

    // Ensure schemas with properties have object type
    if (!('type' in resolved) && 'properties' in resolved) {
      resolved['type'] = 'object';
    }

    return resolved;
  }

  resolveCircularReferencesInTag(tagSpec) {
    /**Resolve circular references within a single tag's API spec*/
    const schemas = (tagSpec.components && tagSpec.components.schemas) || {};

    if (Object.keys(schemas).length === 0) {
      console.log(`   No schemas found in this tag`);
      return tagSpec;
    }

    // Detect circular references within this tag's schemas
    this.circularRefs = this.detectCircularReferences(schemas);

    if (this.circularRefs.size === 0) {
      console.log(`   No circular references found in this tag`);
      return tagSpec;
    }

    console.log(
      `   Found ${this.circularRefs.size} circular schemas: ${Array.from(this.circularRefs).sort().join(', ')}`,
    );

    // Clear cache for this tag to ensure fresh resolution
    this.resolvedCache = {};

    // Create a copy to work with
    const resolvedSchemas = JSON.parse(JSON.stringify(schemas));

    // Only resolve schemas that are part of circular references
    for (const schemaName of Array.from(this.circularRefs).sort()) {
      // Process in sorted order for determinism
      try {
        resolvedSchemas[schemaName] = this.resolveSchemaWithSelectiveInlining(
          schemaName,
          schemas,
          new Set(),
        );
      } catch (e) {
        console.log(`   Warning: Failed to resolve schema ${schemaName}: ${e}`);
        resolvedSchemas[schemaName] = {
          type: 'object',
          description: `Failed to resolve ${schemaName}: ${e}`,
        };
      }
    }

    // Update the tag spec with resolved schemas in optimal order
    const result = { ...tagSpec };
    if (!result.components) {
      result.components = {};
    }

    // Apply dependency-aware ordering to resolved schemas too
    result.components.schemas = this.simpleDependencySort(resolvedSchemas);

    return result;
  }

  splitByTagsFirst(apiSpec, outputDir) {
    /**Split API spec by tags first, then resolve circular references per tag*/

    // Collect all tags
    const tags = new Set();
    const paths = apiSpec.paths || {};

    for (const [pathName, pathItem] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (
          ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(
            method.toUpperCase(),
          )
        ) {
          const operationTags = operation.tags || [];
          for (const tag of operationTags) {
            tags.add(tag);
          }
        }
      }
    }

    console.log(
      ` Found ${tags.size} tag(s): ${Array.from(tags).sort().join(', ')}`,
    );

    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Process each tag IN SORTED ORDER for determinism
    for (const tag of Array.from(tags).sort()) {
      const tagFilename = `${tag.toLowerCase()}-api.yaml`;
      console.log(`\n  Processing tag: ${tag}`);

      // Create tag-specific API spec - preserve all original metadata
      const originalInfo = { ...(apiSpec.info || {}) };

      // Only modify the title and description to be tag-specific
      originalInfo.title = `${originalInfo.title || 'API'} - ${tag}`;
      originalInfo.description = `API endpoints for ${tag}`;

      const tagSpec = {
        openapi: apiSpec.openapi || '3.0.0',
        info: originalInfo,
        servers: apiSpec.servers || [],
        security: apiSpec.security || [],
        paths: {},
        components: {
          schemas: {},
          securitySchemes:
            (apiSpec.components && apiSpec.components.securitySchemes) || {},
        },
      };

      // Add paths for this tag
      for (const [pathName, pathItem] of Object.entries(paths)) {
        const tagPathItem = {};
        for (const [method, operation] of Object.entries(pathItem)) {
          if (
            [
              'GET',
              'POST',
              'PUT',
              'DELETE',
              'PATCH',
              'HEAD',
              'OPTIONS',
            ].includes(method.toUpperCase())
          ) {
            const operationTags = operation.tags || [];
            if (operationTags.includes(tag)) {
              // Copy the entire operation including x-codeSamples and all other properties
              tagPathItem[method] = operation;

              // Debug log to confirm x-codeSamples are preserved
              if (operation['x-codeSamples']) {
                console.log(
                  `     ✓ Preserving x-codeSamples for ${method.toUpperCase()} ${pathName}`,
                );
              }
            }
          }
        }

        if (Object.keys(tagPathItem).length > 0) {
          tagSpec.paths[pathName] = tagPathItem;
        }
      }

      // Get schemas used by this tag
      const usedSchemas = this.getSchemasUsedByTag(apiSpec, tag);

      // Get parameters used by this tag
      const usedParameters = this.getParametersUsedByTag(apiSpec, tag);

      // Add only the schemas used by this tag
      tagSpec.components.schemas = usedSchemas;

      // Add only the parameters used by this tag (if any)
      if (Object.keys(usedParameters).length > 0) {
        tagSpec.components.parameters = usedParameters;
      }

      console.log(
        `   Tag uses ${Object.keys(usedSchemas).length} schemas and ${Object.keys(usedParameters).length} parameters`,
      );

      // Resolve circular references within this tag's context
      const resolvedTagSpec = this.resolveCircularReferencesInTag(tagSpec);

      // Write the tag file with deterministic YAML output
      const outputPath = path.join(outputDir, tagFilename);
      const yamlStr = yaml.dump(resolvedTagSpec, {
        flowLevel: -1,
        sortKeys: false,
        lineWidth: -1,
      });
      fs.writeFileSync(outputPath, yamlStr, 'utf-8');

      console.log(
        `  Created ${tagFilename} with ${Object.keys(resolvedTagSpec.paths).length} path(s)`,
      );
    }

    // Create split-info.json index file
    this.createSplitInfoFile(apiSpec, outputDir, tags);
  }

  createSplitInfoFile(apiSpec, outputDir, tags) {
    /**Create split-info.json with metadata about all split files*/

    const splitInfo = {
      tags: [],
    };

    // Process each tag in sorted order for determinism
    for (const tag of Array.from(tags).sort()) {
      // Recreate the tag-specific paths to extract endpoints
      const taggedPaths = {};
      const paths = apiSpec.paths || {};

      for (const [pathName, pathItem] of Object.entries(paths)) {
        for (const [method, operation] of Object.entries(pathItem)) {
          if (
            [
              'GET',
              'POST',
              'PUT',
              'DELETE',
              'PATCH',
              'HEAD',
              'OPTIONS',
            ].includes(method.toUpperCase())
          ) {
            const operationTags = operation.tags || [];
            if (operationTags.includes(tag)) {
              if (!(pathName in taggedPaths)) {
                taggedPaths[pathName] = {};
              }
              taggedPaths[pathName][method] = operation;
            }
          }
        }
      }

      // Extract tag info
      const tagDefinition = (apiSpec.tags || []).find(
        (t) => t.name === tag,
      ) || { name: tag };
      const displayName = tagDefinition.description || tagDefinition.name;
      const filename = `${tag.toLowerCase()}-api.yaml`;

      // Extract endpoints for this tag
      const endpoints = [];
      // Process paths in sorted order for determinism
      for (const [pathName, pathItem] of Object.entries(taggedPaths).sort()) {
        // Process methods in sorted order for determinism
        for (const [method, operation] of Object.entries(pathItem).sort()) {
          endpoints.push({
            method: method.toUpperCase(),
            path: pathName,
            summary: operation.summary || '',
            description: operation.description || '',
            operationId:
              operation.operationId ||
              this.generateOperationId(method, pathName, operation),
          });
        }
      }

      // Get schema count for this tag
      const usedSchemas = this.getSchemasUsedByTag(apiSpec, tag);

      splitInfo.tags.push({
        name: tag,
        displayName: displayName,
        description: tagDefinition.description || '',
        file: filename,
        configId: tag.toLowerCase().replace(/[^a-z0-9]/g, '_'), // Suggested config ID for docusaurus
        paths: Object.keys(taggedPaths).length,
        endpoints: endpoints,
        schemas: Object.keys(usedSchemas).length,
        fullyInlined: false, // This approach uses selective inlining, not full inlining
        circularReferencesFixed: true, // Circular refs are resolved
      });
    }

    // Write split-info.json
    const splitInfoPath = path.join(outputDir, 'split-info.json');
    fs.writeFileSync(splitInfoPath, JSON.stringify(splitInfo, null, 2));

    console.log(
      `\n📄 Created split-info.json with metadata for ${splitInfo.tags.length} tag(s)`,
    );
  }

  generateOperationId(method, pathName, operation) {
    /**Generate a fallback operationId if not provided*/
    if (operation.summary) {
      // Use summary to create operationId
      return operation.summary
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // Fallback to method + path
    return `${method}${pathName.replace(/[^a-zA-Z0-9]/g, '')}`;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.error('Usage: node script.mjs <input_file> <output_dir>');
    process.exit(1);
  }

  const [inputFile, outputDir] = args;

  console.log(
    '  DETERMINISTIC Split-first approach: Tags first, then resolve circular references per-tag',
  );
  console.log(`  Reading file: ${inputFile}...`);

  try {
    // Read the OpenAPI file
    const fileContent = await readContent(inputFile);
    const apiSpec = yaml.load(fileContent);

    const resolver = new DeterministicCircularResolver();
    resolver.splitByTagsFirst(apiSpec, outputDir);

    console.log(`\n  Split complete! Created tag files in ${outputDir}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);
