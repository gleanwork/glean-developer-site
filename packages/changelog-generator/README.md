# Changelog Generator

This package analyzes releases and OpenAPI spec changes and opens PRs with rendered changelog entries.

## OpenAPI diffs (pb33f/openapi-changes)

- Install the `openapi-changes` binary on your PATH (Linux/macOS):
  - Linux (GitHub Actions): the workflow installs version 0.0.80 (pinned for stability).
  - macOS: download version 0.0.80 from `pb33f/openapi-changes` releases and place it in `/usr/local/bin`.
- Optionally override the binary path with `CHANGELOG_OPENAPI_DIFF_BIN`.
- For debugging openapi-changes issues, set `DEBUG=changelog:openapi-changes` to see detailed error output.

## Environment

- Required for GitHub access: `GITHUB_TOKEN`.
- Optional for LLM summaries: `GLEAN_API_TOKEN`, `GLEAN_INSTANCE`, `CHANGELOG_SUMMARIZE=1`.

## Local usage

```bash
pnpm -C packages/changelog-generator run run -- --dry-run
```

This writes preview files under `.changelog-preview-<timestamp>` and logs entries in debug mode when `DEBUG=changelog*`.

