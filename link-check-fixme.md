# Link checker failures — fix request

You are an AI agent looking at the output of the nightly link checker for the Glean developer site. Your job is to triage each broken link and either (a) fix it in the source content, (b) add an exclusion to `scripts/check-links.sh` if it cannot be checked automatically, or (c) flag it as a transient/upstream issue requiring no code change.

## How the checker is wired

- The workflow is `.github/workflows/link-checker.yml`. It runs `scripts/check-links.sh` which invokes `lychee` against the production sitemap.
- Permanent exclusions (auth-required hosts, example domains, internal-only sites) live in `scripts/check-links.sh` in the `lychee_cmd+=(...)` blocks. Each exclusion has an inline comment explaining why.
- Temporary exclusions go in the marked `# ── TEMPORARY EXCLUSIONS ──` block in the same script, with a `# REASON: ... (added YYYY-MM-DD)` comment.
- Local verification: `pnpm links:check:local` (does a production build, serves on port 8888, and runs the checker).

## Triage rubric

| Category | What it means | Suggested action |
| --- | --- | --- |
| `broken` (404, 410) | Target page is gone | Find the source `.mdx` file (`grep -rn "<URL>" docs/`), update the link to the new location or remove it. |
| `rate-limited` (429) | Host blocked us | Usually transient. If the host repeatedly rate-limits, add a permanent exclusion for that host. |
| `auth-required` (401, 403) | Host requires login | Add a permanent exclusion in `scripts/check-links.sh`. |
| `server-error` (5xx) | Upstream is broken | Usually transient. If repeated across runs, exclude the host or open an issue with the host. |
| `network` / `other` | Timeout, DNS, etc. | Re-run the check. If persistent, exclude the host.

## Failures (1 unique URL, 1 occurrence across 1 source page)

Work URL by URL — fixing or excluding a URL once collapses every occurrence under it. Site URLs map to `docs/<path>.mdx` (or `docs/<path>/index.mdx`); the affected-page list under each URL is the grep target.

### `https://docs.glean.com/administration/actions/setup-actions/jira-actions-setup#creating-a-custom-oauth-app`

**Status:** Cannot find fragment · **Category:** `other` · **Affected pages:** 1

Affected pages:

- https://developers.glean.com/guides/actions/faq  → likely `docs/guides/actions/faq.mdx`
