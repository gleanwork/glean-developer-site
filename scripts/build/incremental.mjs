#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..', '..');

export function parseOpenAPISpec(specPath) {
  if (!fs.existsSync(specPath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(specPath, 'utf8');
    return yaml.load(content);
  } catch (error) {
    console.error(`Failed to parse OpenAPI spec: ${error.message}`);
    return null;
  }
}

export function extractOperations(spec) {
  if (!spec || !spec.paths) {
    return [];
  }
  
  const operations = [];
  
  for (const [pathKey, pathItem] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) {
        operations.push({
          path: pathKey,
          method,
          operationId: operation.operationId,
          operation
        });
      }
    }
  }
  
  return operations;
}

export function hashOperation(operation) {
  const content = JSON.stringify({
    path: operation.path,
    method: operation.method,
    operationId: operation.operationId,
    summary: operation.operation.summary,
    description: operation.operation.description,
    parameters: operation.operation.parameters,
    requestBody: operation.operation.requestBody,
    responses: operation.operation.responses
  });
  
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function buildOperationIndex(specPath) {
  const spec = parseOpenAPISpec(specPath);
  if (!spec) {
    return null;
  }
  
  const operations = extractOperations(spec);
  const index = {};
  
  for (const operation of operations) {
    const hash = hashOperation(operation);
    index[operation.operationId || `${operation.method}-${operation.path}`] = {
      path: operation.path,
      method: operation.method,
      hash
    };
  }
  
  return index;
}

export function compareOperationIndexes(oldIndex, newIndex) {
  if (!oldIndex) {
    return {
      added: Object.keys(newIndex),
      removed: [],
      changed: []
    };
  }
  
  if (!newIndex) {
    return {
      added: [],
      removed: Object.keys(oldIndex),
      changed: []
    };
  }
  
  const added = [];
  const removed = [];
  const changed = [];
  
  for (const opId of Object.keys(newIndex)) {
    if (!oldIndex[opId]) {
      added.push(opId);
    } else if (oldIndex[opId].hash !== newIndex[opId].hash) {
      changed.push(opId);
    }
  }
  
  for (const opId of Object.keys(oldIndex)) {
    if (!newIndex[opId]) {
      removed.push(opId);
    }
  }
  
  return { added, removed, changed };
}

export function getAffectedOperations(specPath, cache, apiName) {
  const target = `openapi:operations:${apiName}`;
  const currentIndex = buildOperationIndex(specPath);
  
  if (!currentIndex) {
    return { all: true, operations: [] };
  }
  
  const cachedTarget = cache.lockfile?.targets?.[target];
  const previousIndex = cachedTarget?.metadata?.operationIndex;
  
  if (!previousIndex) {
    return { all: true, operations: Object.keys(currentIndex) };
  }
  
  const diff = compareOperationIndexes(previousIndex, currentIndex);
  
  if (diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0) {
    return { all: false, operations: [] };
  }
  
  return {
    all: false,
    operations: [...diff.added, ...diff.changed],
    diff
  };
}

export function saveOperationIndex(cache, apiName, specPath) {
  const target = `openapi:operations:${apiName}`;
  const index = buildOperationIndex(specPath);
  
  if (!index) {
    return;
  }
  
  if (!cache.lockfile.targets[target]) {
    cache.lockfile.targets[target] = {
      inputs: {},
      outputs: [],
      status: 'valid',
      lastBuilt: new Date().toISOString()
    };
  }
  
  if (!cache.lockfile.targets[target].metadata) {
    cache.lockfile.targets[target].metadata = {};
  }
  
  cache.lockfile.targets[target].metadata.operationIndex = index;
  cache.saveLockfile();
}

export async function rebuildAffectedOperations(apiName, specPath, cache) {
  const affected = getAffectedOperations(specPath, cache, apiName);
  
  if (affected.all) {
    cache.log(`All operations need rebuild for ${apiName}`, 'info');
    return { requiresFullRebuild: true };
  }
  
  if (affected.operations.length === 0) {
    cache.log(`No operations changed for ${apiName}`, 'info');
    return { requiresFullRebuild: false, rebuilt: [] };
  }
  
  cache.log(`${affected.operations.length} operations changed for ${apiName}:`, 'info');
  if (affected.diff) {
    if (affected.diff.added.length > 0) {
      cache.log(`  Added: ${affected.diff.added.join(', ')}`, 'info');
    }
    if (affected.diff.changed.length > 0) {
      cache.log(`  Changed: ${affected.diff.changed.join(', ')}`, 'info');
    }
    if (affected.diff.removed.length > 0) {
      cache.log(`  Removed: ${affected.diff.removed.join(', ')}`, 'info');
    }
  }
  
  cache.log('Note: Currently requires full API rebuild (per-operation rebuild not yet implemented)', 'info');
  
  return {
    requiresFullRebuild: true,
    operations: affected.operations,
    diff: affected.diff
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const specPath = process.argv[3];
  
  switch (command) {
    case 'index':
      if (!specPath) {
        console.error('Usage: incremental.mjs index <specPath>');
        process.exit(1);
      }
      const index = buildOperationIndex(specPath);
      console.log(JSON.stringify(index, null, 2));
      break;
      
    case 'diff':
      const oldPath = process.argv[3];
      const newPath = process.argv[4];
      if (!oldPath || !newPath) {
        console.error('Usage: incremental.mjs diff <oldSpecPath> <newSpecPath>');
        process.exit(1);
      }
      const oldIdx = buildOperationIndex(oldPath);
      const newIdx = buildOperationIndex(newPath);
      const diff = compareOperationIndexes(oldIdx, newIdx);
      console.log(JSON.stringify(diff, null, 2));
      break;
      
    default:
      console.log('Usage: incremental.mjs [index <specPath>|diff <oldPath> <newPath>]');
      break;
  }
}

