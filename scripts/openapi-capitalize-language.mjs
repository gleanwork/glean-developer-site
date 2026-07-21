#!/usr/bin/env node

/**
 * Capitalize language names in x-codeSamples throughout an OpenAPI spec
 * Usage: node capitalize-code-samples.mjs input.yaml [output.yaml]
 */

import fs from 'fs';
import https from 'https';
import http from 'http';
import yaml from 'js-yaml';
import { dirname } from 'path';

// Capitalization helper
export function capitalizeLanguageName(lang) {
  const languageMap = {
    python: 'Python',
    java: 'Java',
    javascript: 'JavaScript',
    typescript: 'JavaScript',
    go: 'Go',
    ruby: 'Ruby',
    php: 'PHP',
    csharp: 'C#',
    cpp: 'C++',
    c: 'C',
    rust: 'Rust',
    swift: 'Swift',
    kotlin: 'Kotlin',
    scala: 'Scala',
    shell: 'Shell',
    bash: 'Bash',
    curl: 'cURL',
  };
  return (
    languageMap[lang.toLowerCase()] ||
    lang.charAt(0).toUpperCase() + lang.slice(1)
  );
}

const HTTP_METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
];

const EXPERIMENTAL_HEADER_NAME = 'X-Glean-Include-Experimental';
const SKILLS_MULTIPART_OPERATION_IDS = new Set([
  'platform-skills-create',
  'platform-skills-validate',
  'platform-skills-create-version',
]);

/**
 * Inject the `X-Glean-Include-Experimental` header parameter into every
 * operation marked with the `x-glean-experimental` vendor extension.
 *
 * The SDK code samples (x-codeSamples) already opt in to experimental
 * features via `includeExperimental: true`, but the cURL snippet is
 * generated at runtime by docusaurus-theme-openapi-docs from the
 * operation's declared parameters — so without this header parameter the
 * generated cURL command would silently omit the opt-in header and fail
 * against experimental endpoints.
 *
 * The non-standard `value` property is intentional: the theme's snippet
 * generator (ApiExplorer/buildPostmanRequest `setHeaders`) only emits a
 * header parameter when the parameter object carries a truthy `value`, so
 * pre-setting it makes the header appear in the generated cURL example.
 */
export function injectExperimentalHeaders(apiSpec) {
  const paths = apiSpec?.paths;
  if (!paths || typeof paths !== 'object') return;

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (
        !operation ||
        typeof operation !== 'object' ||
        !operation['x-glean-experimental']
      ) {
        continue;
      }

      operation.parameters ??= [];
      const alreadyDeclared = operation.parameters.some(
        (param) =>
          param?.in === 'header' &&
          typeof param?.name === 'string' &&
          param.name.toLowerCase() === EXPERIMENTAL_HEADER_NAME.toLowerCase(),
      );
      if (alreadyDeclared) continue;

      operation.parameters.unshift({
        in: 'header',
        name: EXPERIMENTAL_HEADER_NAME,
        description:
          'This endpoint is experimental, so requests must include this header set to `true`. See [How experimental APIs work](https://developers.glean.com/experimental/overview) for details.',
        required: true,
        schema: {
          type: 'boolean',
          default: true,
        },
        example: true,
        value: 'true',
      });
      console.log(
        `   💉 Injected ${EXPERIMENTAL_HEADER_NAME} header on ${method.toUpperCase()} ${pathKey}`,
      );
    }
  }
}

function resolveServerUrl(apiSpec) {
  const server = apiSpec?.servers?.[0];
  if (!server?.url) return 'https://instance-name-be.glean.com';

  return server.url.replace(/\{([^}]+)\}/g, (_, variableName) => {
    return server.variables?.[variableName]?.default ?? variableName;
  });
}

function responseContentType(operation) {
  for (const [status, response] of Object.entries(operation.responses ?? {})) {
    if (/^2\d\d$/.test(status)) {
      const contentTypes = Object.keys(response?.content ?? {});
      if (contentTypes.length > 0) return contentTypes[0];
    }
  }
  return 'application/json';
}

/**
 * Add copy-pasteable cURL samples for the Skills multipart upload operations.
 * The theme's generic snippet generator cannot seed a browser file input, so
 * its default cURL omits the required form part and sets an unusable multipart
 * Content-Type without a boundary. An explicit sample lets cURL construct the
 * multipart body and boundary from the selected file.
 */
export function injectSkillsMultipartCurlSamples(apiSpec) {
  const paths = apiSpec?.paths;
  if (!paths || typeof paths !== 'object') return;

  const serverUrl = resolveServerUrl(apiSpec);

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (
        !operation ||
        typeof operation !== 'object' ||
        !SKILLS_MULTIPART_OPERATION_IDS.has(operation.operationId) ||
        !operation.requestBody?.content?.['multipart/form-data']
      ) {
        continue;
      }

      operation['x-codeSamples'] ??= [];
      const alreadyDeclared = operation['x-codeSamples'].some(
        (sample) => sample?.lang?.toLowerCase() === 'curl',
      );
      if (alreadyDeclared) continue;

      const requestPath = pathKey.replace(
        /\{([^}]+)\}/g,
        (_, parameterName) => `<${parameterName}>`,
      );
      const lines = [
        `curl -L -X ${method.toUpperCase()} '${serverUrl}${requestPath}' \\`,
        `  -H 'Accept: ${responseContentType(operation)}' \\`,
        `  -H '${EXPERIMENTAL_HEADER_NAME}: true' \\`,
        `  -H 'Authorization: Bearer <token>' \\`,
        `  -F 'file=@./SKILL.md'`,
      ];

      operation['x-codeSamples'].push({
        lang: 'curl',
        label: 'cURL (multipart upload)',
        source: lines.join('\n'),
      });
      console.log(
        `   Injected multipart cURL sample on ${method.toUpperCase()} ${pathKey}`,
      );
    }
  }
}

function processCodeSamples(obj) {
  if (typeof obj !== 'object' || obj === null) return;

  // If this object has x-codeSamples, process them
  if (obj['x-codeSamples'] && Array.isArray(obj['x-codeSamples'])) {
    obj['x-codeSamples'].forEach((sample) => {
      if (sample.lang) {
        const oldLang = sample.lang;
        sample.lang = capitalizeLanguageName(sample.lang);
        if (oldLang !== sample.lang) {
          console.log(`   ${oldLang} → ${sample.lang}`);
        }
      }
    });
  }

  // Recursively process all nested objects and arrays
  Object.values(obj).forEach((value) => {
    if (Array.isArray(value)) {
      value.forEach((item) => processCodeSamples(item));
    } else if (typeof value === 'object') {
      processCodeSamples(value);
    }
  });
}

// Fetch content from URL
async function fetchFromUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;

    client
      .get(url, (res) => {
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
      })
      .on('error', reject);
  });
}

// Read content from file or URL
async function readContent(input) {
  if (input.startsWith('http://') || input.startsWith('https://')) {
    console.log(`📡 Fetching from URL: ${input}...`);
    return await fetchFromUrl(input);
  } else {
    console.log(`📖 Reading local file: ${input}...`);
    return fs.readFileSync(input, 'utf8');
  }
}

export async function capitalizeCodeSamples(inputFile, outputFile) {
  try {
    const fileContent = await readContent(inputFile);
    const apiSpec = yaml.load(fileContent);

    console.log('📦 Injecting Skills multipart cURL samples...');
    injectSkillsMultipartCurlSamples(apiSpec);

    console.log('🔤 Processing x-codeSamples...');
    processCodeSamples(apiSpec);

    console.log('🧪 Injecting experimental opt-in headers...');
    injectExperimentalHeaders(apiSpec);

    let output = outputFile;
    if (!output) {
      if (inputFile.startsWith('http://') || inputFile.startsWith('https://')) {
        output = 'api-capitalized.yaml';
        console.log(
          `💡 No output file specified for URL input, using: ${output}`,
        );
      } else {
        output = inputFile;
      }
    }

    console.log(`💾 Writing to ${output}...`);
    const outputDir = dirname(output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(
      output,
      yaml.dump(apiSpec, {
        noRefs: true,
        lineWidth: -1,
      }),
    );

    console.log('✅ Done! Language names have been capitalized.');
  } catch (error) {
    console.error('❌ Error processing file:', error.message);
    process.exit(1);
  }
}

// CLI usage for ESM
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(
      'Usage: node capitalize-code-samples.mjs <input.yaml|url> [output.yaml]',
    );
    console.log('');
    console.log('Examples:');
    console.log('  node capitalize-code-samples.mjs indexing.yaml');
    console.log(
      '  node capitalize-code-samples.mjs indexing.yaml indexing-capitalized.yaml',
    );
    console.log(
      '  node capitalize-code-samples.mjs https://gleanwork.github.io/open-api/specs/final/indexing.yaml indexing-capitalized.yaml',
    );
    console.log('');
    console.log('If output file is not specified:');
    console.log('  - Local files will be updated in place');
    console.log(
      '  - URLs will create "api-capitalized.yaml" in current directory',
    );
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1];

  if (
    !inputFile.startsWith('http://') &&
    !inputFile.startsWith('https://') &&
    !fs.existsSync(inputFile)
  ) {
    console.error(`❌ Input file not found: ${inputFile}`);
    process.exit(1);
  }

  capitalizeCodeSamples(inputFile, outputFile);
}
