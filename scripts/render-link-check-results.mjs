#!/usr/bin/env node

/**
 * render-link-check-results.mjs
 *
 * Reads lychee's JSON output (link-check-results.json) and produces:
 *   - A human-readable summary on stdout
 *   - A markdown summary grouped by source page (--summary-md FILE)
 *   - An AI-actionable fix-me prompt with full context (--fixme-md FILE)
 *
 * Why all three:
 *   - stdout output keeps `pnpm links:check` useful at the terminal
 *   - The markdown file goes into $GITHUB_STEP_SUMMARY so failing runs show
 *     the broken-link list inline (no clicking through to artifacts)
 *   - The fixme file is a self-contained prompt an agent can be pointed at
 *     to attempt fixes — it includes status codes, source URLs, suggested
 *     remediation categories, and pointers to the project files an agent
 *     would edit
 *
 * Usage:
 *   node scripts/render-link-check-results.mjs <results.json> [options]
 *
 * Options:
 *   --summary-md FILE   Write the grouped-by-source markdown to FILE
 *   --fixme-md FILE     Write the AI-actionable fix-me prompt to FILE
 *   --quiet             Suppress stdout summary
 */

import fs from 'fs';
import path from 'path';
import { parseArgs } from 'node:util';

const { values: args, positionals } = parseArgs({
  options: {
    'summary-md': { type: 'string' },
    'fixme-md': { type: 'string' },
    quiet: { type: 'boolean', default: false },
  },
  allowPositionals: true,
});

const jsonPath = positionals[0];
if (!jsonPath) {
  console.error('Usage: render-link-check-results.mjs <results.json> [opts]');
  process.exit(2);
}
if (!fs.existsSync(jsonPath)) {
  console.error(`Results file not found: ${jsonPath}`);
  process.exit(2);
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// ── Build a unified error list from lychee's source-keyed map ──────────────
// lychee's `error_map` shape: { "<source-path-or-url>": [{ url, status: { text, code? } }, ...] }
// The "source" is whichever input lychee was given that contained the broken
// link — for our deep-mode runs that's a page URL like
// `https://developers.glean.com/foo`; for sitemap-only it's a path on disk.
const errorMap = data.error_map ?? {};
const sources = Object.keys(errorMap).sort();
const totalErrorLinks = sources.reduce(
  (acc, src) => acc + errorMap[src].length,
  0,
);

// ── Build a URL-centric inverted index ────────────────────────────────────
// In practice most failures are footer/nav links repeated on hundreds of
// pages, so the per-source view drowns the actionable signal in repetition.
// Group by URL: each unique broken URL appears once with its status, the
// triage category, and the list of affected source pages.
const urlIndex = new Map(); // url -> { status, code, category, sources: [] }
for (const src of sources) {
  for (const entry of errorMap[src]) {
    let row = urlIndex.get(entry.url);
    if (!row) {
      row = {
        url: entry.url,
        status: entry.status?.text ?? 'error',
        code: entry.status?.code ?? null,
        category: category(entry),
        sources: [],
      };
      urlIndex.set(entry.url, row);
    }
    row.sources.push(src);
  }
}
const uniqueUrls = [...urlIndex.values()].sort(
  (a, b) => b.sources.length - a.sources.length || a.url.localeCompare(b.url),
);

function statusFor(entry) {
  const s = entry.status ?? {};
  if (s.code) return `${s.code} ${s.text ?? ''}`.trim();
  return s.text ?? 'error';
}

function urlStatusLabel(row) {
  return row.code ? `${row.code} ${row.status}` : row.status;
}

// Group status codes into an action category so the fix-me prompt can suggest
// a remediation strategy without an LLM having to infer it from raw codes.
function category(entry) {
  const code = entry.status?.code;
  const text = (entry.status?.text ?? '').toLowerCase();
  if (code === 404 || code === 410) return 'broken'; // page is gone — fix or remove
  if (code === 429) return 'rate-limited'; // transient — usually retry / exclude host
  if (code === 401 || code === 403) return 'auth-required'; // exclude or use a public mirror
  if (code && code >= 500 && code < 600) return 'server-error'; // upstream issue, often transient
  if (text.includes('timeout') || text.includes('connection')) return 'network';
  return 'other';
}

// ── stdout summary ──────────────────────────────────────────────────────────
if (!args.quiet) {
  console.log('');
  console.log('Link check summary');
  console.log('──────────────────');
  console.log(`  Total links checked: ${data.total ?? '?'}`);
  console.log(`  OK:                  ${data.successful ?? '?'}`);
  console.log(`  Errors:              ${data.errors ?? '?'}`);
  console.log(`  Excluded:            ${data.excludes ?? '?'}`);
  console.log(`  Redirects:           ${data.redirects ?? '?'}`);
  console.log(`  Duration:            ${data.duration_secs ?? '?'}s`);
  if (uniqueUrls.length > 0) {
    console.log('');
    console.log(
      `❌ ${uniqueUrls.length} unique broken URL${uniqueUrls.length === 1 ? '' : 's'} (${totalErrorLinks} occurrence${totalErrorLinks === 1 ? '' : 's'} across ${sources.length} source page${sources.length === 1 ? '' : 's'}):`,
    );
    for (const row of uniqueUrls) {
      console.log(
        `  [${urlStatusLabel(row)}] ${row.url}  (${row.sources.length} page${row.sources.length === 1 ? '' : 's'})`,
      );
    }
  } else {
    console.log('');
    console.log('✅ No broken links.');
  }
}

// ── Markdown summary (URL-centric) ─────────────────────────────────────────
// Lead with unique URLs because most failures are footer/nav links repeated
// across hundreds of pages — fixing the URL once collapses dozens of
// "errors" at once. The per-source view is kept as a collapsible details
// section for the case where one page has many distinct broken URLs.
if (args['summary-md']) {
  const lines = [];
  lines.push('# Link check results');
  lines.push('');
  lines.push(
    '| Total | OK | Unique broken URLs | Total occurrences | Excluded | Redirects | Duration |',
  );
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  lines.push(
    `| ${data.total ?? '?'} | ${data.successful ?? '?'} | **${uniqueUrls.length}** | ${totalErrorLinks} | ${data.excludes ?? '?'} | ${data.redirects ?? '?'} | ${data.duration_secs ?? '?'}s |`,
  );
  lines.push('');

  if (uniqueUrls.length === 0) {
    lines.push('✅ No broken links found.');
  } else {
    lines.push(
      `## ❌ ${uniqueUrls.length} unique broken URL${uniqueUrls.length === 1 ? '' : 's'} (${totalErrorLinks} occurrence${totalErrorLinks === 1 ? '' : 's'} across ${sources.length} source page${sources.length === 1 ? '' : 's'})`,
    );
    lines.push('');
    lines.push(
      'Each row is one broken URL. Fixing or excluding a URL once removes every occurrence below.',
    );
    lines.push('');
    lines.push('| Status | Category | Pages | URL |');
    lines.push('| --- | --- | --- | --- |');
    for (const row of uniqueUrls) {
      const url = row.url.replace(/\|/g, '\\|');
      lines.push(
        `| \`${urlStatusLabel(row)}\` | \`${row.category}\` | ${row.sources.length} | ${url} |`,
      );
    }
    lines.push('');

    // Per-URL affected pages (collapsed) — useful when fixing a URL in source
    // content and you need to know which `.mdx` files reference it.
    lines.push('<details><summary>Affected pages per URL</summary>');
    lines.push('');
    for (const row of uniqueUrls) {
      lines.push(`#### \`${row.url}\``);
      lines.push('');
      for (const src of row.sources) {
        lines.push(`- ${src}`);
      }
      lines.push('');
    }
    lines.push('</details>');
    lines.push('');
  }
  fs.writeFileSync(args['summary-md'], lines.join('\n'), 'utf8');
}

// ── AI fix-me prompt ───────────────────────────────────────────────────────
// Self-contained: an agent can be handed this file and have everything it
// needs to investigate and propose fixes. Encodes project-specific knowledge
// (where to add exclusions, how to verify locally) so the agent doesn't have
// to rediscover it.
if (args['fixme-md']) {
  const lines = [];
  lines.push('# Link checker failures — fix request');
  lines.push('');
  lines.push(
    'You are an AI agent looking at the output of the nightly link checker for the Glean developer site. Your job is to triage each broken link and either (a) fix it in the source content, (b) add an exclusion to `scripts/check-links.sh` if it cannot be checked automatically, or (c) flag it as a transient/upstream issue requiring no code change.',
  );
  lines.push('');
  lines.push('## How the checker is wired');
  lines.push('');
  lines.push(
    '- The workflow is `.github/workflows/link-checker.yml`. It runs `scripts/check-links.sh` which invokes `lychee` against the production sitemap.',
  );
  lines.push(
    '- Permanent exclusions (auth-required hosts, example domains, internal-only sites) live in `scripts/check-links.sh` in the `lychee_cmd+=(...)` blocks. Each exclusion has an inline comment explaining why.',
  );
  lines.push(
    '- Temporary exclusions go in the marked `# ── TEMPORARY EXCLUSIONS ──` block in the same script, with a `# REASON: ... (added YYYY-MM-DD)` comment.',
  );
  lines.push(
    '- Local verification: `pnpm links:check:local` (does a production build, serves on port 8888, and runs the checker).',
  );
  lines.push('');
  lines.push('## Triage rubric');
  lines.push('');
  lines.push('| Category | What it means | Suggested action |');
  lines.push('| --- | --- | --- |');
  lines.push(
    '| `broken` (404, 410) | Target page is gone | Find the source `.mdx` file (`grep -rn "<URL>" docs/`), update the link to the new location or remove it. |',
  );
  lines.push(
    '| `rate-limited` (429) | Host blocked us | Usually transient. If the host repeatedly rate-limits, add a permanent exclusion for that host. |',
  );
  lines.push(
    '| `auth-required` (401, 403) | Host requires login | Add a permanent exclusion in `scripts/check-links.sh`. |',
  );
  lines.push(
    '| `server-error` (5xx) | Upstream is broken | Usually transient. If repeated across runs, exclude the host or open an issue with the host. |',
  );
  lines.push(
    '| `network` / `other` | Timeout, DNS, etc. | Re-run the check. If persistent, exclude the host.',
  );
  lines.push('');

  if (uniqueUrls.length === 0) {
    lines.push('## Failures');
    lines.push('');
    lines.push('_No broken links — nothing to fix._');
  } else {
    lines.push(
      `## Failures (${uniqueUrls.length} unique URL${uniqueUrls.length === 1 ? '' : 's'}, ${totalErrorLinks} occurrence${totalErrorLinks === 1 ? '' : 's'} across ${sources.length} source page${sources.length === 1 ? '' : 's'})`,
    );
    lines.push('');
    lines.push(
      'Work URL by URL — fixing or excluding a URL once collapses every occurrence under it. Site URLs map to `docs/<path>.mdx` (or `docs/<path>/index.mdx`); the affected-page list under each URL is the grep target.',
    );
    lines.push('');
    for (const row of uniqueUrls) {
      lines.push(`### \`${row.url}\``);
      lines.push('');
      lines.push(
        `**Status:** ${urlStatusLabel(row)} · **Category:** \`${row.category}\` · **Affected pages:** ${row.sources.length}`,
      );
      lines.push('');
      lines.push('Affected pages:');
      lines.push('');
      for (const src of row.sources) {
        const sourceHint = src.startsWith('http')
          ? src.replace(/^https?:\/\/[^/]+\/?/, '').replace(/\/$/, '') ||
            '<homepage>'
          : src;
        lines.push(`- ${src}  → likely \`docs/${sourceHint}.mdx\``);
      }
      lines.push('');
    }
  }
  fs.writeFileSync(args['fixme-md'], lines.join('\n'), 'utf8');
}
