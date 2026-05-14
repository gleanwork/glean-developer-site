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

function statusFor(entry) {
  const s = entry.status ?? {};
  if (s.code) return `${s.code} ${s.text ?? ''}`.trim();
  return s.text ?? 'error';
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
  if (totalErrorLinks > 0) {
    console.log('');
    console.log(
      `❌ ${totalErrorLinks} broken link${totalErrorLinks === 1 ? '' : 's'} across ${sources.length} source page${sources.length === 1 ? '' : 's'}:`,
    );
    for (const src of sources) {
      console.log(`  ${src}`);
      for (const entry of errorMap[src]) {
        console.log(`    └─ ${statusFor(entry)}  ${entry.url}`);
      }
    }
  } else {
    console.log('');
    console.log('✅ No broken links.');
  }
}

// ── Markdown summary (grouped by source) ───────────────────────────────────
if (args['summary-md']) {
  const lines = [];
  lines.push('# Link check results');
  lines.push('');
  lines.push('| Total | OK | Errors | Excluded | Redirects | Duration |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  lines.push(
    `| ${data.total ?? '?'} | ${data.successful ?? '?'} | **${data.errors ?? '?'}** | ${data.excludes ?? '?'} | ${data.redirects ?? '?'} | ${data.duration_secs ?? '?'}s |`,
  );
  lines.push('');

  if (totalErrorLinks === 0) {
    lines.push('✅ No broken links found.');
  } else {
    lines.push(
      `## ❌ ${totalErrorLinks} broken link${totalErrorLinks === 1 ? '' : 's'} across ${sources.length} source page${sources.length === 1 ? '' : 's'}`,
    );
    lines.push('');
    for (const src of sources) {
      const errs = errorMap[src];
      lines.push(`### \`${src}\``);
      lines.push('');
      lines.push('| Status | URL |');
      lines.push('| --- | --- |');
      for (const entry of errs) {
        const url = entry.url.replace(/\|/g, '\\|');
        lines.push(`| \`${statusFor(entry)}\` | ${url} |`);
      }
      lines.push('');
    }
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

  if (totalErrorLinks === 0) {
    lines.push('## Failures');
    lines.push('');
    lines.push('_No broken links — nothing to fix._');
  } else {
    lines.push(
      `## Failures (${totalErrorLinks} broken link${totalErrorLinks === 1 ? '' : 's'} across ${sources.length} source page${sources.length === 1 ? '' : 's'})`,
    );
    lines.push('');
    for (const src of sources) {
      const errs = errorMap[src];
      // Try to derive the .mdx file path. Site URLs map to docs/<path>.mdx
      // (or docs/<path>/index.mdx). The agent should still grep, but this
      // hint helps narrow the search.
      const sourceHint = src.startsWith('http')
        ? src.replace(/^https?:\/\/[^/]+\/?/, '').replace(/\/$/, '') ||
          '<homepage>'
        : src;
      lines.push(`### Source: \`${src}\``);
      lines.push('');
      lines.push(
        `_Likely lives at_ \`docs/${sourceHint}.mdx\` _or_ \`docs/${sourceHint}/index.mdx\``,
      );
      lines.push('');
      for (const entry of errs) {
        lines.push(
          `- **${statusFor(entry)}** \`${category(entry)}\` — \`${entry.url}\``,
        );
      }
      lines.push('');
    }
  }
  fs.writeFileSync(args['fixme-md'], lines.join('\n'), 'utf8');
}
