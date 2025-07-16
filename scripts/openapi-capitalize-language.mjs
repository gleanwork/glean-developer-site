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
    'scala': 'Scala',
    'shell': 'Shell',
    'bash': 'Bash',
    'curl': 'cURL'
  };
  return languageMap[lang.toLowerCase()] || lang.charAt(0).toUpperCase() + lang.slice(1);
}

function processCodeSamples(obj) {
  if (typeof obj !== 'object' || obj === null) return;

  // If this object has x-codeSamples, process them
  if (obj['x-codeSamples'] && Array.isArray(obj['x-codeSamples'])) {
    obj['x-codeSamples'].forEach(sample => {
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
  Object.values(obj).forEach(value => {
    if (Array.isArray(value)) {
      value.forEach(item => processCodeSamples(item));
    } else if (typeof value === 'object') {
      processCodeSamples(value);
    }
  });
}

// Fetch content from URL
async function fetchFromUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;

    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    }).on('error', reject);
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

    console.log('🔤 Processing x-codeSamples...');
    processCodeSamples(apiSpec);

    let output = outputFile;
    if (!output) {
      if (inputFile.startsWith('http://') || inputFile.startsWith('https://')) {
        output = 'api-capitalized.yaml';
        console.log(`💡 No output file specified for URL input, using: ${output}`);
      } else {
        output = inputFile;
      }
    }

    console.log(`💾 Writing to ${output}...`);
    const outputDir = dirname(output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(output, yaml.dump(apiSpec, {
      noRefs: true,
      lineWidth: -1
    }));

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
    console.log('Usage: node capitalize-code-samples.mjs <input.yaml|url> [output.yaml]');
    console.log('');
    console.log('Examples:');
    console.log('  node capitalize-code-samples.mjs indexing.yaml');
    console.log('  node capitalize-code-samples.mjs indexing.yaml indexing-capitalized.yaml');
    console.log('  node capitalize-code-samples.mjs https://gleanwork.github.io/open-api/specs/final/indexing.yaml indexing-capitalized.yaml');
    console.log('');
    console.log('If output file is not specified:');
    console.log('  - Local files will be updated in place');
    console.log('  - URLs will create "api-capitalized.yaml" in current directory');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1];

  if (!inputFile.startsWith('http://') && !inputFile.startsWith('https://') && !fs.existsSync(inputFile)) {
    console.error(`❌ Input file not found: ${inputFile}`);
    process.exit(1);
  }

  capitalizeCodeSamples(inputFile, outputFile);
}

