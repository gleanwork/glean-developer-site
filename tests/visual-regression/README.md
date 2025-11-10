# Visual Regression Testing

This directory contains visual regression tests using Playwright to detect unintended UI changes.

## Overview

The tests take screenshots of all pages in the sitemap and compare them against baseline snapshots. Any visual differences will fail the tests, helping catch UI regressions before they reach production.

## Running Tests Locally

### Prerequisites

1. Build the site first:

```bash
pnpm build
```

1. Run visual regression tests:

```bash
pnpm test:visual
```

The first run will generate baseline snapshots. Subsequent runs will compare against these baselines.

## Updating Snapshots

When you make intentional UI changes, you'll need to update the baseline snapshots:

```bash
pnpm test:visual:update
```

This will regenerate all snapshots with your new UI changes. Review the changes carefully before committing.

## CI Workflow

### Automatic Runs

Visual regression tests run automatically on all pull requests as part of the CI workflow. The tests are triggered by the CI workflow after the build completes.

### Build Optimization

The workflow intelligently reuses build artifacts from the CI workflow when available, avoiding duplicate builds:

- If CI has already built the site, visual regression downloads and uses that artifact
- If no artifact exists (manual trigger, etc.), it performs its own build

### When Tests Fail

If visual regression tests fail in CI:

1. **Download the test report:**
   - Go to the failed workflow run
   - Scroll to the bottom and download the `playwright-test-results` artifact
   - Extract and open `playwright-report/index.html` in a browser

2. **Review the differences:**
   - The report shows side-by-side comparisons of expected vs actual screenshots
   - Determine if the differences are intentional or bugs

3. **If changes are intentional:**
   - Option A: Run `pnpm test:visual:update` locally and commit the new snapshots
   - Option B: Use the GitHub Actions workflow (see below)

### Updating Snapshots via GitHub Actions

To update snapshots using Linux rendering (matching CI environment):

1. Go to Actions → "Update Visual Snapshots"
2. Click "Run workflow"
3. Wait for it to complete
4. The workflow will automatically commit the updated snapshots

This ensures snapshots match the CI environment exactly.

## Platform Differences

Snapshots must be generated on the same OS as CI (Linux/Ubuntu). If you generate snapshots on macOS or Windows locally, they will fail in CI due to rendering differences.

**Recommended approach:**

- Use the "Update Visual Snapshots" GitHub Action to generate Linux-based snapshots
- Or use Docker locally: `docker run -v (pwd):/work -w /work mcr.microsoft.com/playwright:v1.56.1-jammy /bin/bash -c "npm install -g pnpm@10.13.1 && pnpm install --frozen-lockfile && pnpm test:visual:update"`

## Configuration

### Playwright Config

- Location: `playwright.config.ts`
- Browser: Chromium (Desktop Chrome)
- Viewport: 1280x720
- Workers: 4 parallel workers in CI
- Retries: 2 retries in CI for flaky tests

### Flaky Elements

- Location: `tests/visual-regression/screenshot.css`
- This stylesheet hides elements that cause false positives (avatars, gifs, timestamps, etc.)
- Add new rules here if you encounter flaky tests

## Troubleshooting

### Tests are flaky

Add CSS rules to `screenshot.css` to hide problematic elements:

- Use `visibility: hidden` for inline elements
- Use `display: none` for layout-affecting elements

### Build is slow

The site build can be slow. The workflow caches dependencies and reuses artifacts when possible to minimize build time.

### Manual triggers don't work

Make sure you have the necessary permissions. The "Update Visual Snapshots" workflow requires write access to the repository.
