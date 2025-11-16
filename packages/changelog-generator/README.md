# Changelog Generator

This package analyzes releases and OpenAPI spec changes and opens PRs with rendered changelog entries.

## OpenAPI diffs (openapi-changes)

- Install the `openapi-changes` binary on your PATH (Linux/macOS):
  - Linux (GitHub Actions): the workflow installs the latest release automatically.
  - macOS: download a release from [pb33f/openapi-changes](https://github.com/pb33f/openapi-changes) and place it in `/usr/local/bin`.
- Optionally override the binary path with `CHANGELOG_OPENAPI_DIFF_BIN`.

## Environment

- Required for GitHub access: `GITHUB_TOKEN`.
- Optional for LLM summaries: `GLEAN_API_TOKEN`, `GLEAN_INSTANCE`, `CHANGELOG_SUMMARIZE=1`.

## Local usage

```bash
pnpm changelog:publish --dry-run
```
This writes preview files under `.changelog-preview-<timestamp>` and logs entries in debug mode when `DEBUG=changelog*`.

## Available Commands

### For Developers
- `pnpm changelog:entry:new` - Manually create a changelog entry (interactive)

### For CI/Automation
- `pnpm changelog:preview` - Analyze GitHub releases → output JSON
- `pnpm changelog:publish --dry-run` - Full preview (saves files + shows content)
- `pnpm changelog:publish` - Publish entries from GitHub (creates PR)

### For Build System
- `pnpm changelog:compile:json` - Compile .md entries → changelog.json
- `pnpm changelog:compile:rss` - Generate RSS feed from JSON


