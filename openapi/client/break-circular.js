#!/usr/bin/env node

/**
 * Split OpenAPI spec by tags into separate complete API files with circular reference breaking
 * Usage: node split-by-tags.js input.yaml output-directory [--break-circular]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const yaml = require('js-yaml');

// Add this function near the top of the file, after the imports
function capitalizeLanguageName(lang) {
  // Common programming languages and their proper capitalization
  const languageMap = {
    'python': 'Python',
    'java': 'Java',
    'javascript': 'JavaScript',
    'typescript': 'JavaScript',
    'go': 'Go',
    'ruby': 'Ruby',
    'php': 'PHP',
    'csharp': 'C#',
    'cpp': 'C++',
    'c': 'C',
    'rust': 'Rust',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
    'scala': 'Scala'
  };
  
  return languageMap[lang.toLowerCase()] || lang;
}

// Function to fetch content from URL
function fetchFromUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Function to read content from file or URL
async function readContent(input) {
  if (input.startsWith('http://') || input.startsWith('https://')) {
    console.log(`📡 Fetching from URL: ${input}...`);
    return await fetchFromUrl(input);
  } else {
    console.log(`📖 Reading local file: ${input}...`);
    return fs.readFileSync(input, 'utf8');
  }
}

// Circular reference detection and breaking strategies
class CircularReferenceBreaker {
  constructor() {
    this.circularPaths = new Set();
    this.schemaGraph = new Map();
    this.breakingStrategies = {
      'id_reference': this.applyIdReferenceStrategy.bind(this),
      'lazy_loading': this.applyLazyLoadingStrategy.bind(this),
      'composition': this.applyCompositionStrategy.bind(this),
      'nullable': this.applyNullableStrategy.bind(this)
    };
  }

  // Build dependency graph of schemas
  buildSchemaGraph(schemas) {
    this.schemaGraph.clear();
    
    Object.entries(schemas).forEach(([schemaName, schema]) => {
      this.schemaGraph.set(schemaName, this.extractSchemaReferences(schema));
    });
  }

  // Extract all $ref references from a schema
  extractSchemaReferences(schema, refs = new Set()) {
    if (typeof schema !== 'object' || schema === null) return refs;
    
    if (schema.$ref && schema.$ref.startsWith('#/components/schemas/')) {
      const refName = schema.$ref.replace('#/components/schemas/', '');
      refs.add(refName);
    }
    
    Object.values(schema).forEach(value => {
      if (Array.isArray(value)) {
        value.forEach(item => this.extractSchemaReferences(item, refs));
      } else if (typeof value === 'object') {
        this.extractSchemaReferences(value, refs);
      }
    });
    
    return refs;
  }

  // Detect circular references using DFS
  detectCircularReferences(schemas) {
    this.buildSchemaGraph(schemas);
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];

    console.log('🔍 Schema dependency graph:');
    this.schemaGraph.forEach((deps, schema) => {
      if (deps.size > 0) {
        console.log(`   ${schema} -> [${Array.from(deps).join(', ')}]`);
      }
    });

    const dfs = (node, path = []) => {
      if (recursionStack.has(node)) {
        // Found a cycle
        const cycleStart = path.indexOf(node);
        const cycle = [...path.slice(cycleStart), node];
        cycles.push(cycle);
        console.log(`   Found cycle: ${cycle.join(' -> ')}`);
        return;
      }

      if (visited.has(node)) return;

      visited.add(node);
      recursionStack.add(node);

      const dependencies = this.schemaGraph.get(node) || new Set();
      dependencies.forEach(dep => {
        if (this.schemaGraph.has(dep)) {
          dfs(dep, [...path, node]);
        }
      });

      recursionStack.delete(node);
    };

    Object.keys(schemas).forEach(schemaName => {
      if (!visited.has(schemaName)) {
        dfs(schemaName);
      }
    });

    // Also check for self-references (schema referencing itself)
    Object.entries(schemas).forEach(([schemaName, schema]) => {
      const refs = this.extractSchemaReferences(schema);
      if (refs.has(schemaName)) {
        cycles.push([schemaName, schemaName]);
        console.log(`   Found self-reference: ${schemaName} -> ${schemaName}`);
      }
    });

    return cycles;
  }

  // Choose best strategy for breaking a circular reference
  chooseBestStrategy(cycle, schemas) {
    // Analyze the cycle to determine best breaking strategy
    const cycleInfo = this.analyzeCycle(cycle, schemas);
    
    if (cycleInfo.hasSimpleRelations) {
      return 'id_reference'; // Best for simple parent-child relationships
    } else if (cycleInfo.hasArrayReferences) {
      return 'lazy_loading'; // Good for collection references
    } else if (cycleInfo.hasComplexInheritance) {
      return 'composition'; // Better for complex inheritance chains
    } else {
      return 'nullable'; // Default fallback
    }
  }

  // Analyze cycle characteristics
  analyzeCycle(cycle, schemas) {
    let hasSimpleRelations = false;
    let hasArrayReferences = false;
    let hasComplexInheritance = false;

    cycle.forEach(schemaName => {
      const schema = schemas[schemaName];
      if (!schema) return;

      // Check for array references
      if (this.hasArrayReferences(schema)) {
        hasArrayReferences = true;
      }

      // Check for inheritance patterns (allOf, oneOf, anyOf)
      if (schema.allOf || schema.oneOf || schema.anyOf) {
        hasComplexInheritance = true;
      }

      // Check for simple property references
      if (schema.properties && Object.keys(schema.properties).length <= 5) {
        hasSimpleRelations = true;
      }
    });

    return { hasSimpleRelations, hasArrayReferences, hasComplexInheritance };
  }

  // Check if schema has array references
  hasArrayReferences(schema) {
    if (schema.type === 'array' && schema.items?.$ref) return true;
    
    if (schema.properties) {
      return Object.values(schema.properties).some(prop => 
        prop.type === 'array' && prop.items?.$ref
      );
    }
    
    return false;
  }

  // Strategy 1: Inline schema at break point (not just ID reference)
  applyIdReferenceStrategy(cycle, schemas) {
    console.log(`🔧 Applying inline strategy for cycle: ${cycle.join(' -> ')}`);
    
    const modifiedSchemas = { ...schemas };
    
    // Find the best place to break the cycle (usually the "weakest" reference)
    const breakPoint = this.findBestBreakPoint(cycle, schemas);
    const breakIndex = cycle.indexOf(breakPoint);
    
    if (breakIndex !== -1) {
      const parentSchema = cycle[breakIndex];
      const childSchema = cycle[(breakIndex + 1) % cycle.length];
      
      // Inline the child schema content, but exclude the circular reference back
      modifiedSchemas[parentSchema] = this.inlineSchemaExcludingCircular(
        modifiedSchemas[parentSchema], 
        childSchema,
        modifiedSchemas[childSchema],
        cycle
      );
      
      console.log(`   Inlined ${childSchema} content into ${parentSchema}, excluding circular refs`);
    }
    
    return modifiedSchemas;
  }

  // Strategy 2: Create flattened objects with inline content
  applyLazyLoadingStrategy(cycle, schemas) {
    console.log(`🔧 Applying inline flattening strategy for cycle: ${cycle.join(' -> ')}`);
    
    const modifiedSchemas = { ...schemas };
    const breakPoint = this.findBestBreakPoint(cycle, schemas);
    const childSchema = cycle[(cycle.indexOf(breakPoint) + 1) % cycle.length];
    
    // Instead of creating a reference object, inline the child schema content
    // but exclude properties that would create the circular reference
    modifiedSchemas[breakPoint] = this.inlineSchemaExcludingCircular(
      modifiedSchemas[breakPoint],
      childSchema,
      modifiedSchemas[childSchema],
      cycle
    );
    
    console.log(`   Inlined ${childSchema} content into ${breakPoint}, excluding circular properties`);
    return modifiedSchemas;
  }

  // Strategy 3: Create fully merged composite objects with all content inlined
  applyCompositionStrategy(cycle, schemas) {
    console.log(`🔧 Applying full composition strategy for cycle: ${cycle.join(' -> ')}`);
    
    const modifiedSchemas = { ...schemas };
    
    // For each schema in the cycle, create a fully flattened version
    cycle.forEach(schemaName => {
      const flattenedSchema = this.createFlattenedSchema(schemaName, schemas, cycle);
      modifiedSchemas[schemaName] = flattenedSchema;
    });
    
    console.log(`   Created fully flattened versions of: ${cycle.join(', ')}`);
    return modifiedSchemas;
  }

  // Strategy 4: Inline content but make the circular part optional
  applyNullableStrategy(cycle, schemas) {
    console.log(`🔧 Applying nullable inline strategy for cycle: ${cycle.join(' -> ')}`);
    
    const modifiedSchemas = { ...schemas };
    const breakPoint = this.findBestBreakPoint(cycle, schemas);
    const childSchema = cycle[(cycle.indexOf(breakPoint) + 1) % cycle.length];
    
    // Inline the content but make the circular reference optional/nullable
    modifiedSchemas[breakPoint] = this.inlineSchemaWithNullableCircular(
      modifiedSchemas[breakPoint],
      childSchema,
      modifiedSchemas[childSchema],
      cycle
    );
    
    console.log(`   Inlined ${childSchema} into ${breakPoint} with nullable circular references`);
    return modifiedSchemas;
  }

  // Find the best point to break the cycle
  findBestBreakPoint(cycle, schemas) {
    // Prefer breaking at array references or optional properties
    for (const schemaName of cycle) {
      const schema = schemas[schemaName];
      if (this.hasArrayReferences(schema)) {
        return schemaName;
      }
    }
    
    // Otherwise, break at the first schema in the cycle
    return cycle[0];
  }

  // Helper: Inline schema content but exclude circular references
  inlineSchemaExcludingCircular(parentSchema, childSchemaName, childSchema, cycle) {
    const modified = JSON.parse(JSON.stringify(parentSchema));
    
    const inlineRef = (obj, path = [], depth = 0) => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      // Prevent excessive depth even for non-circular references
      if (depth > 15) {
        return {
          type: 'object',
          description: `${childSchemaName} object`,
          // additionalProperties: true
        };
      }
      
      // If we find a reference to the child schema, inline its content
      if (obj.$ref === `#/components/schemas/${childSchemaName}`) {
        console.log(`     Inlining reference to ${childSchemaName} at depth ${depth}`);
        
        // For circular references at depth > 0, just create a reference placeholder
        if (cycle.includes(childSchemaName) && depth > 0) {
          return {
            type: 'object',
            description: `${childSchemaName} object`,
            // additionalProperties: true
          };
        }
        
        const inlinedChild = JSON.parse(JSON.stringify(childSchema));
        
        // Remove any properties that would create circular references
        if (inlinedChild.properties) {
          Object.keys(inlinedChild.properties).forEach(propName => {
            const prop = inlinedChild.properties[propName];
            if (prop.$ref) {
              const refName = prop.$ref.replace('#/components/schemas/', '');
              if (cycle.includes(refName)) {
                console.log(`       Replacing circular property '${propName}' (${refName}) with reference placeholder`);
                inlinedChild.properties[propName] = {
                  type: 'object',
                  description: `${refName} object`,
                  // additionalProperties: true
                };
              }
            } else if (prop.type === 'array' && prop.items && prop.items.$ref) {
              const itemRefName = prop.items.$ref.replace('#/components/schemas/', '');
              if (cycle.includes(itemRefName)) {
                console.log(`       Replacing circular array items '${propName}' (${itemRefName}) with reference placeholder`);
                inlinedChild.properties[propName] = {
                  type: 'array',
                  description: `Array of ${itemRefName} objects`,
                  items: {
                    type: 'object',
                    description: `${itemRefName} object`,
                    // additionalProperties: true
                  }
                };
              }
            }
          });
        }
        
        return inlinedChild;
      }
      
      // Also handle array items that might be circular
      if (obj.type === 'array' && obj.items && obj.items.$ref === `#/components/schemas/${childSchemaName}`) {
        console.log(`     Inlining array items reference to ${childSchemaName} at depth ${depth}`);
        
        // For circular array items, create a reference placeholder
        if (cycle.includes(childSchemaName) && depth > 0) {
          return {
            type: 'array',
            description: obj.description || `Array of ${childSchemaName} objects`,
            items: {
              type: 'object',
              description: `${childSchemaName} object`,
              // additionalProperties: true
            }
          };
        }
        
        const inlinedChild = JSON.parse(JSON.stringify(childSchema));
        
        // Process circular references in the inlined child
        if (inlinedChild.properties) {
          Object.keys(inlinedChild.properties).forEach(propName => {
            const prop = inlinedChild.properties[propName];
            if (prop.$ref) {
              const refName = prop.$ref.replace('#/components/schemas/', '');
              if (cycle.includes(refName)) {
                inlinedChild.properties[propName] = {
                  type: 'object',
                  description: `${refName} object`,
                  // additionalProperties: true
                };
              }
            }
          });
        }
        
        return {
          type: 'array',
          description: obj.description || `Array of ${childSchemaName} objects`,
          items: inlinedChild
        };
      }
      
      // Recursively process nested objects
      Object.keys(obj).forEach(key => {
        if (path.length < 20) { // Prevent infinite recursion
          obj[key] = inlineRef(obj[key], [...path, key], depth + 1);
        }
      });
      
      return obj;
    };
    
    return inlineRef(modified);
  }

  // Helper: Create a completely flattened schema with all references resolved
  createFlattenedSchema(schemaName, allSchemas, cycle, visited = new Set()) {
    if (visited.has(schemaName)) {
      return {
        type: 'object',
        description: `Circular reference to ${schemaName} resolved`,
          // additionalProperties: true
      };
    }
    
    visited.add(schemaName);
    const schema = allSchemas[schemaName];
    if (!schema) return null;
    
    const flattened = {
      type: schema.type || 'object',
      description: schema.description || `Flattened ${schemaName}`,
      properties: {}
    };
    
    // Copy basic properties
    ['format', 'example', 'enum', 'minimum', 'maximum'].forEach(prop => {
      if (schema[prop] !== undefined) {
        flattened[prop] = schema[prop];
      }
    });
    
    // Flatten properties
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([propName, propDef]) => {
        if (propDef.$ref) {
          const refName = propDef.$ref.replace('#/components/schemas/', '');
          if (cycle.includes(refName) && refName !== schemaName) {
            // For circular references, create a simplified version
            flattened.properties[propName] = {
              type: 'object',
              description: `Inlined ${refName} content`,
              // additionalProperties: true,
              ...this.getBasicPropertiesFromSchema(allSchemas[refName])
            };
          } else if (allSchemas[refName]) {
            // For non-circular references, fully inline
            flattened.properties[propName] = this.createFlattenedSchema(refName, allSchemas, cycle, new Set(visited));
          }
        } else {
          flattened.properties[propName] = propDef;
        }
      });
    }
    
    // Handle allOf, oneOf, anyOf
    if (schema.allOf) {
      schema.allOf.forEach(subSchema => {
        if (subSchema.$ref) {
          const refName = subSchema.$ref.replace('#/components/schemas/', '');
          if (allSchemas[refName] && !cycle.includes(refName)) {
            const subProps = this.createFlattenedSchema(refName, allSchemas, cycle, new Set(visited));
            if (subProps?.properties) {
              Object.assign(flattened.properties, subProps.properties);
            }
          }
        } else if (subSchema.properties) {
          Object.assign(flattened.properties, subSchema.properties);
        }
      });
    }
    
    visited.delete(schemaName);
    return flattened;
  }

  // Helper: Extract basic properties from schema for simplified circular refs
  getBasicPropertiesFromSchema(schema) {
    if (!schema || !schema.properties) return {};
    
    const basicProps = {};
    Object.entries(schema.properties).forEach(([propName, propDef]) => {
      if (!propDef.$ref) {
        // Only include simple, non-reference properties
        if (propDef.type && ['string', 'number', 'integer', 'boolean'].includes(propDef.type)) {
          basicProps[propName] = propDef;
        }
      }
    });
    
    return { properties: basicProps };
  }

  // Helper: Inline schema with nullable circular references
  inlineSchemaWithNullableCircular(parentSchema, childSchemaName, childSchema, cycle) {
    const modified = this.inlineSchemaExcludingCircular(parentSchema, childSchemaName, childSchema, cycle);
    
    // Make any remaining circular references nullable
    const makeCircularNullable = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      Object.keys(obj).forEach(key => {
        if (obj[key] && typeof obj[key] === 'object') {
          if (obj[key].description && typeof obj[key].description === 'string' && obj[key].description.includes('circular reference resolved')) {
            obj[key].nullable = true;
          }
          makeCircularNullable(obj[key]);
        }
      });
      
      return obj;
    };
    
    return makeCircularNullable(modified);
  }

  // Main method to break all circular references
  breakCircularReferences(schemas) {
    const cycles = this.detectCircularReferences(schemas);
    
    if (cycles.length === 0) {
      console.log('✅ No circular references detected');
      return schemas;
    }
    
    console.log(`🔍 Found ${cycles.length} circular reference(s):`);
    cycles.forEach((cycle, index) => {
      console.log(`   ${index + 1}. ${cycle.join(' -> ')}`);
    });
    
    let modifiedSchemas = { ...schemas };
    
    // Process cycles in order of complexity (simple self-references first)
    const sortedCycles = cycles.sort((a, b) => a.length - b.length);
    
    sortedCycles.forEach((cycle, index) => {
      console.log(`\n🛠️  Breaking cycle ${index + 1}: ${cycle.join(' -> ')}`);
      const strategy = this.chooseBestStrategy(cycle, modifiedSchemas);
      console.log(`   Using strategy: ${strategy}`);
      modifiedSchemas = this.breakingStrategies[strategy](cycle, modifiedSchemas);
    });
    
    // Verify no circular references remain
    console.log('\n🔍 Verifying circular references are resolved...');
    const remainingCycles = this.detectCircularReferences(modifiedSchemas);
    if (remainingCycles.length > 0) {
      console.log(`⚠️  Warning: ${remainingCycles.length} circular references still remain:`);
      remainingCycles.forEach((cycle, index) => {
        console.log(`   ${index + 1}. ${cycle.join(' -> ')}`);
      });
    } else {
      console.log('✅ All circular references have been resolved');
    }
    
    return modifiedSchemas;
  }
}

async function splitOpenAPIByTags(inputFile, outputDir, breakCircular = false) {
  try {
    // Read and parse the OpenAPI file (now supports URLs)
    const fileContent = await readContent(inputFile);
    const apiSpec = yaml.load(fileContent);

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Initialize circular reference breaker if requested
    let circularBreaker = null;
    if (breakCircular) {
      circularBreaker = new CircularReferenceBreaker();
      console.log('🔍 Circular reference breaking enabled');
    }

    // Extract tag information from OpenAPI spec
    const tagInfo = {};
    if (apiSpec.tags) {
      apiSpec.tags.forEach(tag => {
        tagInfo[tag.name] = {
          name: tag.name,
          description: tag.description || tag.name,
          externalDocs: tag.externalDocs
        };
      });
    }

    // Extract all unique tags from paths
    const tags = new Set();
    const taggedPaths = {};
    const usedSchemas = new Set();

    // Group paths by tags and clean up operations
    Object.entries(apiSpec.paths || {}).forEach(([pathName, pathItem]) => {
      Object.entries(pathItem).forEach(([method, operation]) => {
        
        if (operation.tags && operation.tags.length > 0) {
          operation.tags.forEach(tag => {
            tags.add(tag);
            
            // If tag info not found in spec, create default
            if (!tagInfo[tag]) {
              tagInfo[tag] = {
                name: tag,
                description: tag,
                externalDocs: null
              };
            }
            
            if (!taggedPaths[tag]) {
              taggedPaths[tag] = {};
            }
            
            if (!taggedPaths[tag][pathName]) {
              taggedPaths[tag][pathName] = {};
            }
            
            taggedPaths[tag][pathName][method] = operation;

            // Track used schemas for this tag
            collectUsedSchemas(operation, usedSchemas, tag);
          });
        }
      });
    });

    // Create separate API files for each tag
    tags.forEach(tag => {
      const currentTagInfo = tagInfo[tag];
      
      // Process x-codeSamples for this specific tag's paths
      Object.values(taggedPaths[tag] || {}).forEach(pathItem => {
        Object.values(pathItem).forEach(operation => {
          if (operation['x-codeSamples']) {
            operation['x-codeSamples'].forEach(sample => {
              if (sample.lang) {
                sample.lang = capitalizeLanguageName(sample.lang);
              }
            });
          }
        });
      });
      
      let components = filterComponentsByTag(apiSpec.components, tag, taggedPaths[tag]);
      
      // Process schemas for this tag
      if (components.schemas) {
        console.log(`\n📦 Processing schemas for tag: ${tag}`);
        console.log(`   Found ${Object.keys(components.schemas).length} schemas`);
        
        // ALWAYS break circular references first, regardless of flag
        // This prevents infinite expansion during inlining
        const hasCircularRefs = circularBreaker ? true : new CircularReferenceBreaker().detectCircularReferences(components.schemas).length > 0;
        
        if (hasCircularRefs) {
          console.log(`🔄 Breaking circular references (required for inlining)...`);
          if (!circularBreaker) {
            circularBreaker = new CircularReferenceBreaker();
          }
          components.schemas = circularBreaker.breakCircularReferences(components.schemas);
        }
        
        // Now safely inline all schemas
        console.log(`🔗 Inlining all schema references...`);
        // Use global max tracking only for messages API to prevent exponential expansion
        const useGlobalMax = tag.toLowerCase() === 'messages';
        if (useGlobalMax) {
          console.log(`   Using global max tracking for messages API`);
        }
        components.schemas = fullyInlineAllSchemas(components.schemas, useGlobalMax);
        console.log(`   Processed ${Object.keys(components.schemas).length} schemas`);
      }
      
      const taggedAPI = {
        openapi: apiSpec.openapi,
        info: {
          ...apiSpec.info,
          title: currentTagInfo.description || currentTagInfo.name,
          description: `${currentTagInfo.description || tag} operations for ${apiSpec.info.title}`
        },
        servers: apiSpec.servers || [],
        security: apiSpec.security || [],
        // Include the tag definition in the new API
        tags: [{
          name: currentTagInfo.name,
          description: currentTagInfo.description,
          ...(currentTagInfo.externalDocs && { externalDocs: currentTagInfo.externalDocs })
        }],
        paths: taggedPaths[tag] || {},
        components: components
      };

      // Add security definitions if they exist
      if (apiSpec.components?.securitySchemes) {
        taggedAPI.components.securitySchemes = apiSpec.components.securitySchemes;
      }

      // Create filename from tag description/summary, fallback to tag name
      const displayName = currentTagInfo.description || currentTagInfo.name;
      const filename = displayName.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special chars except spaces
        .replace(/\s+/g, '-')        // Replace spaces with hyphens
        .replace(/-+/g, '-')         // Replace multiple hyphens with single
        .replace(/^-|-$/g, '');      // Remove leading/trailing hyphens
      
      const outputPath = path.join(outputDir, `${filename}-api.yaml`);
      
      fs.writeFileSync(outputPath, yaml.dump(taggedAPI, {
        noRefs: true,
        lineWidth: -1
      }));

      console.log(`✅ Created: ${outputPath}`);
      console.log(`   Title: "${displayName}"`);
      console.log(`   Paths: ${Object.keys(taggedPaths[tag] || {}).length}`);
      console.log(`   Schemas: ${Object.keys(components.schemas || {}).length} (fully inlined)`);
      console.log('');
    });

    // Create index file with all tags info
    const indexFile = {
      tags: Array.from(tags).map(tag => {
        const currentTagInfo = tagInfo[tag];
        const displayName = currentTagInfo.description || currentTagInfo.name;
        const filename = displayName.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        
        // Extract endpoints for this tag
        const endpoints = [];
        Object.entries(taggedPaths[tag] || {}).forEach(([pathName, pathItem]) => {
          Object.entries(pathItem).forEach(([method, operation]) => {
            endpoints.push({
              method: method.toUpperCase(),
              path: pathName,
              summary: operation.summary || '',
              description: operation.description || '',
              operationId: operation.operationId || 
                           (operation.summary && operation.summary.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')) ||
                           `${method}${pathName.replace(/[^a-zA-Z0-9]/g, '')}`
            });
          });
        });
        
        return {
          name: tag,
          displayName: displayName,
          description: currentTagInfo.description,
          file: `${filename}-api.yaml`,
          configId: filename.replace(/-/g, '_'), // Suggested config ID for docusaurus
          paths: Object.keys(taggedPaths[tag] || {}).length,
          endpoints: endpoints, // Add the endpoints data
          fullyInlined: true,
          circularReferencesFixed: breakCircular
        };
      })
    };

    fs.writeFileSync(
      path.join(outputDir, 'split-info.json'), 
      JSON.stringify(indexFile, null, 2)
    );

    console.log(`🎉 Split complete! Created ${tags.size} API files in ${outputDir}`);
    console.log(`🔗 All schemas have been fully inlined for self-contained files`);
    if (breakCircular) {
      console.log(`🔧 Circular references have been automatically resolved`);
    }
    console.log(`📋 See split-info.json for configuration details`);

  } catch (error) {
    console.error('❌ Error splitting OpenAPI file:', error.message);
    process.exit(1);
  }
}

// [Rest of the helper functions remain the same...]
function collectUsedSchemas(operation, usedSchemas, tag) {
  // Collect schemas from parameters
  if (operation.parameters) {
    operation.parameters.forEach(param => {
      if (param.schema?.$ref) {
        const schemaName = param.schema.$ref.replace('#/components/schemas/', '');
        usedSchemas.add(`${tag}:${schemaName}`);
      }
    });
  }

  // Collect schemas from request body
  if (operation.requestBody?.content) {
    Object.values(operation.requestBody.content).forEach(mediaType => {
      if (mediaType.schema?.$ref) {
        const schemaName = mediaType.schema.$ref.replace('#/components/schemas/', '');
        usedSchemas.add(`${tag}:${schemaName}`);
      }
    });
  }

  // Collect schemas from responses
  if (operation.responses) {
    Object.values(operation.responses).forEach(response => {
      if (response.content) {
        Object.values(response.content).forEach(mediaType => {
          if (mediaType.schema?.$ref) {
            const schemaName = mediaType.schema.$ref.replace('#/components/schemas/', '');
            usedSchemas.add(`${tag}:${schemaName}`);
          }
        });
      }
    });
  }
}

function filterComponentsByTag(components, tag, taggedPaths) {
  if (!components) return {};

  const filteredComponents = {};
  
  // Get all schema references used in this tag's operations
  const usedSchemaRefs = new Set();
  
  Object.values(taggedPaths).forEach(pathItem => {
    Object.values(pathItem).forEach(operation => {
      collectSchemaRefs(operation, usedSchemaRefs);
    });
  });

  // Include only schemas that are referenced
  if (components.schemas && usedSchemaRefs.size > 0) {
    filteredComponents.schemas = {};
    
    // Add directly referenced schemas
    usedSchemaRefs.forEach(ref => {
      const schemaName = ref.replace('#/components/schemas/', '');
      if (components.schemas[schemaName]) {
        filteredComponents.schemas[schemaName] = components.schemas[schemaName];
      }
    });

    // Add nested schema dependencies
    addNestedSchemas(filteredComponents.schemas, components.schemas);
    
    // Remove any unused schemas that got pulled in but aren't actually needed
    const actuallyUsed = new Set();
    usedSchemaRefs.forEach(ref => {
      const schemaName = ref.replace('#/components/schemas/', '');
      actuallyUsed.add(schemaName);
    });
    
    // Recursively find all schemas that are actually used
    let foundNew = true;
    while (foundNew) {
      foundNew = false;
      const currentUsed = new Set(actuallyUsed);
      
      currentUsed.forEach(schemaName => {
        if (filteredComponents.schemas[schemaName]) {
          const nestedRefs = new Set();
          collectSchemaRefs(filteredComponents.schemas[schemaName], nestedRefs);
          nestedRefs.forEach(ref => {
            const refName = ref.replace('#/components/schemas/', '');
            if (!actuallyUsed.has(refName)) {
              actuallyUsed.add(refName);
              foundNew = true;
            }
          });
        }
      });
    }
    
    // Filter out unused schemas
    Object.keys(filteredComponents.schemas).forEach(schemaName => {
      if (!actuallyUsed.has(schemaName)) {
        console.log(`   Removing unused schema: ${schemaName}`);
        delete filteredComponents.schemas[schemaName];
      }
    });
  }

  // Copy other components that might be needed
  ['parameters', 'responses', 'headers', 'examples', 'requestBodies'].forEach(componentType => {
    if (components[componentType]) {
      filteredComponents[componentType] = components[componentType];
    }
  });

  return filteredComponents;
}

function collectSchemaRefs(obj, refs) {
  if (typeof obj !== 'object' || obj === null) return;
  
  if (obj.$ref && obj.$ref.startsWith('#/components/schemas/')) {
    refs.add(obj.$ref);
  }
  
  Object.values(obj).forEach(value => {
    collectSchemaRefs(value, refs);
  });
}

function addNestedSchemas(filteredSchemas, allSchemas) {
  let foundNew = true;
  
  while (foundNew) {
    foundNew = false;
    const currentSchemas = { ...filteredSchemas };
    
    Object.values(currentSchemas).forEach(schema => {
      const nestedRefs = new Set();
      collectSchemaRefs(schema, nestedRefs);
      
      nestedRefs.forEach(ref => {
        const schemaName = ref.replace('#/components/schemas/', '');
        if (allSchemas[schemaName] && !filteredSchemas[schemaName]) {
          filteredSchemas[schemaName] = allSchemas[schemaName];
          foundNew = true;
        }
      });
    });
  }
}

// Function to fully inline all schemas - no $ref left behind
function fullyInlineAllSchemas(schemas, useGlobalMax = false) {
  const inlinedSchemas = {};
  const resolutionPath = []; // Track the exact path to detect circular references
  const globalOccurrences = useGlobalMax ? {} : null; // Track how many times each schema has been inlined globally (only for messages)
  
  // Function to fully resolve a single schema
  function resolveSchema(schemaName, pathDepth = 0) {
    // Track global occurrences to prevent exponential expansion (only for messages API)
    if (useGlobalMax) {
      globalOccurrences[schemaName] = (globalOccurrences[schemaName] || 0) + 1;
      
      // If a schema has been inlined too many times globally, stop
      if (globalOccurrences[schemaName] > 10) {
        console.log(`     Schema ${schemaName} inlined too many times (${globalOccurrences[schemaName]}), using placeholder`);
        return {
          type: 'object',
          description: `${schemaName} object`,
          // additionalProperties: true
        };
      }
    }
    
    // Check if we're in a circular reference loop (same schema in current path)
    if (resolutionPath.includes(schemaName)) {
      console.log(`     Circular reference detected: ${resolutionPath.join(' -> ')} -> ${schemaName}`);
      return {
        type: 'object',
        description: `${schemaName} object (circular reference)`,
        // additionalProperties: true
      };
    }
    
    // Only limit depth if we're going EXTREMELY deep (prevents stack overflow)
    if (pathDepth > 50) {
      console.log(`     Extreme depth reached for ${schemaName} at depth ${pathDepth}`);
      return {
        type: 'object',
        description: `${schemaName} object (max depth)`,
        // additionalProperties: true
      };
    }
    
    const schema = schemas[schemaName];
    if (!schema) {
      return {
        type: 'object',
        description: `Schema ${schemaName} not found`,
        // additionalProperties: true
      };
    }
    
    // Add to resolution path to track circular references
    resolutionPath.push(schemaName);
    
    try {
      const resolved = resolveSchemaObject(schema, pathDepth);
      resolutionPath.pop();
      return resolved;
    } catch (error) {
      console.warn(`     Error resolving ${schemaName}: ${error.message}`);
      resolutionPath.pop();
      
      return {
        type: 'object',
        description: `Error resolving ${schemaName}: ${error.message}`,
        // additionalProperties: true
      };
    }
  }
  
  // Function to resolve any schema object (handles $ref, properties, etc.)
  function resolveSchemaObject(obj, pathDepth = 0) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    // Handle $ref - inline the referenced schema
    if (obj.$ref && obj.$ref.startsWith('#/components/schemas/')) {
      const refName = obj.$ref.replace('#/components/schemas/', '');
      return resolveSchema(refName, pathDepth + 1);
    }
    
    // Create a new object to avoid mutations
    const resolved = {};
    
    // Copy primitive properties first - but preserve type
    Object.keys(obj).forEach(key => {
      if (!['properties', 'items', 'allOf', 'oneOf', 'anyOf'].includes(key)) {
        resolved[key] = obj[key];
      }
    });
    
    // Handle arrays - ALWAYS expand array items fully but preserve array type
    if (obj.type === 'array' && obj.items) {
      resolved.type = 'array'; // Explicitly preserve array type
      const resolvedItems = resolveSchemaObject(obj.items, pathDepth + 1);
      // Ensure array items have explicit type for better rendering
      if (resolvedItems.properties && !resolvedItems.type) {
        resolvedItems.type = 'object';
      }
      resolved.items = resolvedItems;
    } else if (obj.items) {
      // Handle items even if type isn't explicitly array
      const resolvedItems = resolveSchemaObject(obj.items, pathDepth + 1);
      if (resolvedItems.properties && !resolvedItems.type) {
        resolvedItems.type = 'object';
      }
      resolved.items = resolvedItems;
      // If we have items but no type, assume it's an array
      if (!resolved.type) {
        resolved.type = 'array';
      }
    }
    
    // Handle properties - ALWAYS expand properties fully
    if (obj.properties) {
      resolved.properties = {};
      Object.entries(obj.properties).forEach(([propName, propDef]) => {
        try {
          resolved.properties[propName] = resolveSchemaObject(propDef, pathDepth + 1);
        } catch (error) {
          console.warn(`     Error resolving property ${propName}: ${error.message}`);
          resolved.properties[propName] = {
            type: 'object',
            description: `Error resolving property ${propName}`,
            // additionalProperties: true
          };
        }
      });
    }
    
    // Handle allOf - merge properties
    if (obj.allOf) {
      const mergedProps = {};
      const mergedRequired = [];
      
      obj.allOf.forEach((subSchema, index) => {
        try {
          const resolvedSub = resolveSchemaObject(subSchema, pathDepth + 1);
          if (resolvedSub.properties) {
            Object.assign(mergedProps, resolvedSub.properties);
          }
          if (resolvedSub.required) {
            mergedRequired.push(...resolvedSub.required);
          }
          // Copy other properties from allOf items, but don't override type
          ['description', 'format', 'example', 'enum', 'minimum', 'maximum'].forEach(prop => {
            if (resolvedSub[prop] && !resolved[prop]) {
              resolved[prop] = resolvedSub[prop];
            }
          });
          // Only copy type if we don't have one
          if (resolvedSub.type && !resolved.type) {
            resolved.type = resolvedSub.type;
          }
        } catch (error) {
          console.warn(`     Error resolving allOf[${index}]: ${error.message}`);
        }
      });
      
      resolved.properties = { ...mergedProps, ...resolved.properties };
      if (mergedRequired.length > 0) {
        resolved.required = [...new Set([...mergedRequired, ...(resolved.required || [])])];
      }
    }
    
    // Handle oneOf/anyOf - keep structure but resolve references
    if (obj.oneOf) {
      resolved.oneOf = obj.oneOf.map((subSchema, index) => {
        try {
          return resolveSchemaObject(subSchema, pathDepth + 1);
        } catch (error) {
          console.warn(`     Error resolving oneOf[${index}]: ${error.message}`);
          return {
            type: 'object',
            description: `Error resolving oneOf[${index}]`,
            // additionalProperties: true
          };
        }
      });
    }
    
    if (obj.anyOf) {
      resolved.anyOf = obj.anyOf.map((subSchema, index) => {
        try {
          return resolveSchemaObject(subSchema, pathDepth + 1);
        } catch (error) {
          console.warn(`     Error resolving anyOf[${index}]: ${error.message}`);
          return {
            type: 'object',
            description: `Error resolving anyOf[${index}]`,
              // additionalProperties: true
          };
        }
      });
    }
    
    // Ensure schemas that ended up with properties but no explicit type are marked as objects
    if (!resolved.type && resolved.properties) {
      resolved.type = 'object';
    }
    
    return resolved;
  }
  
  // Resolve all schemas
  Object.keys(schemas).forEach(schemaName => {
    try {
      inlinedSchemas[schemaName] = resolveSchema(schemaName, 0);
    } catch (error) {
      console.warn(`   Warning: Failed to resolve schema ${schemaName}: ${error.message}`);
      inlinedSchemas[schemaName] = {
        type: 'object',
        description: `Failed to resolve ${schemaName}: ${error.message}`,
        // additionalProperties: true
      };
    }
  });
  
  return inlinedSchemas;
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  console.log('Debug: args =', args);
  
  if (args.length < 2) {
    console.log('Usage: node break-circular.js <input-openapi.yaml|url> <output-directory> [--break-circular]');
    console.log('');
    console.log('Options:');
    console.log('  --break-circular    Detect and fix circular references in schemas');
    console.log('');
    console.log('Example:');
    console.log('  node break-circular.js client_rest.yaml ./split-apis/');
    console.log('  node break-circular.js https://gleanwork.github.io/open-api/specs/final/client_rest.yaml ./split-apis/');
    console.log('  node break-circular.js client_rest.yaml ./split-apis/ --break-circular');
    process.exit(1);
  }

  let inputFile, outputDir, breakCircular = false;
  
  // Parse arguments
  if (args.length >= 2) {
    inputFile = args[0];
    outputDir = args[1];
    
    // Check for --break-circular flag
    if (args.length >= 3 && args[2] === '--break-circular') {
      breakCircular = true;
    } else if (args.includes('--break-circular')) {
      breakCircular = true;
    }
  }
  
  console.log('Debug: inputFile =', inputFile);
  console.log('Debug: outputDir =', outputDir);
  console.log('Debug: breakCircular =', breakCircular);
  
  if (breakCircular) {
    console.log('🔧 Circular reference breaking enabled');
  }
  
  // For local files, check if they exist
  if (!inputFile.startsWith('http://') && !inputFile.startsWith('https://') && !fs.existsSync(inputFile)) {
    console.error(`❌ Input file not found: ${inputFile}`);
    process.exit(1);
  }

  splitOpenAPIByTags(inputFile, outputDir, breakCircular);
}

module.exports = { splitOpenAPIByTags, CircularReferenceBreaker };