#!/usr/bin/env node

/**
 * Syncs registry.json from gleanwork/glean-cookbook into the committed local
 * snapshot at data/cookbook-registry.json — the single source of truth for
 * recipe metadata, consumed by scripts/compile-recipes.ts.
 *
 * Mirrors scripts/openapi-capitalize-language.mjs's fetch-and-write shape:
 * fetched on demand (locally or in CI), never live during a build, and the
 * result is committed to git.
 *
 * Auth: in CI, set GITHUB_TOKEN to a short-lived GitHub App installation
 * token (see .github/workflows/sync-cookbook-registry.yml). Locally, falls
 * back to the invoking user's own `gh` auth so no token needs to be minted
 * by hand.
 *
 * Usage: node scripts/sync-registry.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO = 'gleanwork/glean-cookbook';
const SOURCE_PATH = 'registry.json';
const repoRoot = path.resolve(import.meta.dirname, '..');
const outputFile = path.join(repoRoot, 'data', 'cookbook-registry.json');

async function fetchViaToken(token) {
  const response = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${SOURCE_PATH}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.raw+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );
  if (!response.ok) {
    throw new Error(
      `GitHub API request failed: HTTP ${response.status} ${response.statusText}`,
    );
  }
  return response.text();
}

function fetchViaGhCli() {
  return execFileSync(
    'gh',
    ['api', `repos/${REPO}/contents/${SOURCE_PATH}`, '--jq', '.content'],
    { encoding: 'utf8' },
  )
    .trim()
    .split('\n')
    .join('');
}

async function main() {
  console.log(`📡 Fetching ${SOURCE_PATH} from ${REPO}...`);

  let raw;
  if (process.env.GITHUB_TOKEN) {
    raw = await fetchViaToken(process.env.GITHUB_TOKEN);
  } else {
    console.log(
      '💡 No GITHUB_TOKEN set — falling back to local `gh` CLI auth.',
    );
    const base64 = fetchViaGhCli();
    raw = Buffer.from(base64, 'base64').toString('utf8');
  }

  // Fail loudly on malformed content rather than committing garbage.
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('registry.json must be a JSON array of recipe entries.');
  }

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(parsed, null, 2)}\n`);
  console.log(
    `✅ Wrote ${parsed.length} recipe(s) to ${path.relative(repoRoot, outputFile)}`,
  );
}

main().catch((error) => {
  console.error('❌', error.message);
  process.exit(1);
});
