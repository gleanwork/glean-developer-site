import * as fs from 'fs';
import { test, expect } from '@playwright/test';
import { extractSitemapPathnames, pathnameToSnapshotName } from './utils';

const siteUrl = 'http://localhost:3000';
const sitemapPath = './build/sitemap.xml';
const stylesheetPath = './tests/visual-regression/screenshot.css';
const stylesheet = fs.readFileSync(stylesheetPath).toString();

function waitForDocusaurusHydration() {
  return document.documentElement.dataset.hasHydrated === 'true';
}

function screenshotPathname(pathname: string) {
  test(`pathname ${pathname}`, async ({ page }) => {
    const url = siteUrl + pathname;
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForFunction(waitForDocusaurusHydration);
    await page.addStyleTag({ content: stylesheet });
    
    await expect(page).toHaveScreenshot(`${pathnameToSnapshotName(pathname)}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });
}

test.describe('Visual regression tests', () => {
  const pathnames = extractSitemapPathnames(sitemapPath);
  pathnames.forEach(screenshotPathname);
});

