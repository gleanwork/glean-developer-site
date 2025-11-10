#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { BuildCache } from './cache.mjs';
import { hashFile, hashPackageVersion, hashString } from './hash.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..', '..');

const CLIENT_APIS = [
  'activity', 'announcements', 'answers', 'authentication',
  'chat', 'agents', 'collections', 'documents', 'insights',
  'messages', 'pins', 'search', 'entities', 'shortcuts',
  'summarize', 'verification', 'tools', 'governance'
];

export async function buildTransformationsIfNeeded(cache) {
  let anyTransformed = false;
  
  anyTransformed = await buildClientTransformIfNeeded(cache) || anyTransformed;
  anyTransformed = await buildIndexingTransformIfNeeded(cache) || anyTransformed;
  
  return anyTransformed;
}

async function buildClientTransformIfNeeded(cache) {
  const capitalizeTarget = 'openapi:transform:client:capitalize';
  const splitTarget = 'openapi:transform:client:split';
  
  const sourceUrl = 'https://gleanwork.github.io/open-api/specs/final/client_rest.yaml';
  const capitalizedPath = path.join(ROOT_DIR, 'openapi', 'client', 'client-capitalized.yaml');
  const splitOutputDir = path.join(ROOT_DIR, 'openapi', 'client', 'split-apis');
  
  const capitalizeInputs = {
    sourceUrl: hashString(sourceUrl),
    capitalizeScript: hashFile(path.join(ROOT_DIR, 'scripts', 'openapi-capitalize-language.mjs'))
  };
  
  const capitalizeOutputs = ['openapi/client/client-capitalized.yaml'];
  
  const capitalizeCheck = cache.shouldRebuild(capitalizeTarget, capitalizeInputs);
  let needsCapitalize = capitalizeCheck.shouldRebuild;
  
  if (needsCapitalize) {
    cache.log('Capitalizing client OpenAPI spec...', 'info');
    
    try {
      execSync(`node scripts/openapi-capitalize-language.mjs ${sourceUrl} ${capitalizedPath}`, {
        cwd: ROOT_DIR,
        stdio: cache.verbose ? 'inherit' : 'pipe'
      });
      
      cache.markBuilt(capitalizeTarget, capitalizeInputs, capitalizeOutputs);
      cache.log('Client spec capitalization complete', 'info');
    } catch (error) {
      cache.log(`Client spec capitalization failed: ${error.message}`, 'error');
      return false;
    }
  } else {
    cache.log('Client spec capitalization is up to date (cache hit)', 'info');
  }
  
  const splitInputs = {
    capitalizedSpec: hashFile(capitalizedPath),
    splitScript: hashFile(path.join(ROOT_DIR, 'scripts', 'openapi-split-break-circular.mjs'))
  };
  
  const splitCheck = cache.shouldRebuild(splitTarget, splitInputs);
  let needsSplit = splitCheck.shouldRebuild || needsCapitalize;
  
  if (needsSplit) {
    cache.log('Splitting client OpenAPI spec...', 'info');
    
    try {
      execSync(`node scripts/openapi-split-break-circular.mjs ${capitalizedPath} ${splitOutputDir}`, {
        cwd: ROOT_DIR,
        stdio: cache.verbose ? 'inherit' : 'pipe'
      });
      
      const splitOutputs = fs.readdirSync(splitOutputDir)
        .filter(f => f.endsWith('.yaml'))
        .map(f => `openapi/client/split-apis/${f}`);
      
      cache.markBuilt(splitTarget, splitInputs, splitOutputs);
      cache.log('Client spec splitting complete', 'info');
    } catch (error) {
      cache.log(`Client spec splitting failed: ${error.message}`, 'error');
      return false;
    }
  } else {
    cache.log('Client spec splitting is up to date (cache hit)', 'info');
  }
  
  return needsCapitalize || needsSplit;
}

async function buildIndexingTransformIfNeeded(cache) {
  const target = 'openapi:transform:indexing';
  
  const sourceUrl = 'https://gleanwork.github.io/open-api/specs/final/indexing.yaml';
  const outputPath = path.join(ROOT_DIR, 'openapi', 'indexing', 'indexing-capitalized.yaml');
  
  const inputs = {
    sourceUrl: hashString(sourceUrl),
    capitalizeScript: hashFile(path.join(ROOT_DIR, 'scripts', 'openapi-capitalize-language.mjs'))
  };
  
  const outputs = ['openapi/indexing/indexing-capitalized.yaml'];
  
  const cacheCheck = cache.shouldRebuild(target, inputs);
  
  if (cacheCheck.shouldRebuild) {
    cache.log('Capitalizing indexing OpenAPI spec...', 'info');
    
    try {
      execSync(`node scripts/openapi-capitalize-language.mjs ${sourceUrl} ${outputPath}`, {
        cwd: ROOT_DIR,
        stdio: cache.verbose ? 'inherit' : 'pipe'
      });
      
      cache.markBuilt(target, inputs, outputs);
      cache.log('Indexing spec capitalization complete', 'info');
      return true;
    } catch (error) {
      cache.log(`Indexing spec capitalization failed: ${error.message}`, 'error');
      return false;
    }
  } else {
    cache.log('Indexing spec capitalization is up to date (cache hit)', 'info');
    return false;
  }
}

export async function buildAPIIfNeeded(apiName, cache) {
  const isIndexing = apiName === 'indexing';
  const target = isIndexing ? 'openapi:indexing' : `openapi:client:${apiName}`;
  
  const specPath = isIndexing
    ? path.join(ROOT_DIR, 'openapi', 'indexing', 'indexing-capitalized.yaml')
    : path.join(ROOT_DIR, 'openapi', 'client', 'split-apis', `${apiName}-api.yaml`);
  
  const outputDir = isIndexing
    ? path.join(ROOT_DIR, 'docs', 'api', 'indexing-api')
    : path.join(ROOT_DIR, 'docs', 'api', 'client-api', apiName);
  
  const inputs = {
    spec: hashFile(specPath),
    generator: hashFile(path.join(ROOT_DIR, 'scripts', 'generator', 'customMdGenerators.ts')),
    pluginVersion: hashPackageVersion('docusaurus-plugin-openapi-docs'),
    configSnippet: hashFile(path.join(ROOT_DIR, 'docusaurus.config.ts'))
  };
  
  const overviewPattern = isIndexing ? '*-overview.mdx' : 'overview.mdx';
  
  const cacheCheck = cache.shouldRebuild(target, inputs);
  
  if (cacheCheck.shouldRebuild) {
    cache.log(`Generating ${apiName} API documentation...`, 'info');
    
    preserveOverviewFiles(outputDir, overviewPattern);
    
    try {
      execSync(`docusaurus gen-api-docs ${apiName}`, {
        cwd: ROOT_DIR,
        stdio: cache.verbose ? 'inherit' : 'pipe'
      });
      
      restoreOverviewFiles(outputDir, overviewPattern);
      cleanUnwantedArtifacts(outputDir);
      
      const outputs = getApiOutputFiles(outputDir);
      cache.markBuilt(target, inputs, outputs);
      cache.log(`${apiName} API documentation generation complete`, 'info');
      return true;
    } catch (error) {
      cache.log(`${apiName} API documentation generation failed: ${error.message}`, 'error');
      restoreOverviewFiles(outputDir, overviewPattern);
      return false;
    }
  } else {
    cache.log(`${apiName} API documentation is up to date (cache hit)`, 'info');
    return false;
  }
}

const preservedFiles = new Map();

function preserveOverviewFiles(outputDir, pattern) {
  if (!fs.existsSync(outputDir)) {
    return;
  }
  
  const files = fs.readdirSync(outputDir);
  for (const file of files) {
    if (file === pattern || file.endsWith(pattern)) {
      const filePath = path.join(outputDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      preservedFiles.set(filePath, content);
    }
  }
}

function restoreOverviewFiles(outputDir, pattern) {
  for (const [filePath, content] of preservedFiles.entries()) {
    if (filePath.startsWith(outputDir)) {
      fs.writeFileSync(filePath, content);
    }
  }
  preservedFiles.clear();
}

function cleanUnwantedArtifacts(outputDir) {
  if (!fs.existsSync(outputDir)) {
    return;
  }
  
  const unwantedPatterns = ['sidebar.ts', '.info.mdx', '.tag.mdx'];
  
  function cleanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        cleanDir(fullPath);
      } else if (unwantedPatterns.some(pattern => entry.name.endsWith(pattern))) {
        fs.unlinkSync(fullPath);
      }
    }
  }
  
  cleanDir(outputDir);
}

function getApiOutputFiles(outputDir) {
  const files = [];
  
  function scanDir(dir) {
    if (!fs.existsSync(dir)) {
      return;
    }
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(ROOT_DIR, fullPath);
      
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
        files.push(relativePath);
      }
    }
  }
  
  scanDir(outputDir);
  return files;
}

export async function buildAllAPIsIfNeeded(cache) {
  let anyGenerated = false;
  
  anyGenerated = await buildAPIIfNeeded('indexing', cache) || anyGenerated;
  
  for (const apiName of CLIENT_APIS) {
    anyGenerated = await buildAPIIfNeeded(apiName, cache) || anyGenerated;
  }
  
  return anyGenerated;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const apiName = process.argv[3];
  
  const cache = new BuildCache({ verbose: true });
  cache.initialize();
  
  (async () => {
    let success = false;
    
    switch (command) {
      case 'transform':
        success = await buildTransformationsIfNeeded(cache);
        break;
      case 'generate':
        if (apiName) {
          success = await buildAPIIfNeeded(apiName, cache);
        } else {
          success = await buildAllAPIsIfNeeded(cache);
        }
        break;
      case 'all':
        await buildTransformationsIfNeeded(cache);
        success = await buildAllAPIsIfNeeded(cache);
        break;
      default:
        console.log('Usage: openapi.mjs [transform|generate [apiName]|all]');
        process.exit(1);
    }
    
    process.exit(success ? 0 : 1);
  })();
}

