#!/usr/bin/env tsx
/**
 * Syncs custom Glean icons from the monorepo into the developer site.
 *
 * Reads GlyphType.ts (semantic name -> filename mapping) and Glyph.tsx
 * (baseGlyphsWithoutIconSet list) from the Glean monorepo, copies the
 * matching SVGs into static/img/glean/icons/, removes overlapping
 * dev-site icons, and generates a type-safe manifest.
 *
 * Usage: pnpm icons:sync
 *
 * Requires the monorepo at SCIO_PATH (default: ../scio relative to repo root).
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const DEFAULT_SCIO_PATH = path.resolve(REPO_ROOT, '../scio');
const SCIO_PATH = process.env.SCIO_PATH || DEFAULT_SCIO_PATH;

const GLYPH_TYPE_PATH = path.join(
  SCIO_PATH,
  'typescript/elements/Glyph/GlyphType.ts',
);
const GLYPH_PATH = path.join(SCIO_PATH, 'typescript/elements/Glyph/Glyph.tsx');
const IMAGES_DIR = path.join(SCIO_PATH, 'typescript/web/public/images');

const ICONS_OUTPUT_DIR = path.join(REPO_ROOT, 'static/img/glean/icons');
const DEV_SITE_GLEAN_DIR = path.join(REPO_ROOT, 'static/img/glean');
const MANIFEST_PATH = path.join(
  REPO_ROOT,
  'packages/docusaurus-theme-glean/src/theme/Icons/glean-icon-manifest.ts',
);

// ---------------------------------------------------------------------------
// 1. Parse GlyphType.ts to get glyphName mapping (KEY -> filename)
// ---------------------------------------------------------------------------

function parseGlyphNameMap(source: string): Record<string, string> {
  const map: Record<string, string> = {};
  const re = /^\s+(\w+):\s*'([^']+)'/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    map[match[1]] = match[2];
  }
  return map;
}

// ---------------------------------------------------------------------------
// 2. Parse Glyph.tsx to get baseGlyphsWithoutIconSet entries
// ---------------------------------------------------------------------------

function parseBaseGlyphs(source: string): string[] {
  // Find the start of baseGlyphsWithoutIconSet, then use bracket-counting
  // to locate the array body (simple regex fails because GlyphType[] has brackets)
  const marker = 'const baseGlyphsWithoutIconSet';
  const startIdx = source.indexOf(marker);
  if (startIdx === -1) {
    throw new Error('Could not find baseGlyphsWithoutIconSet in Glyph.tsx');
  }
  const equalsIdx = source.indexOf('=', startIdx);
  const openBracket = source.indexOf('[', equalsIdx);
  let depth = 0;
  let closeBracket = -1;
  for (let i = openBracket; i < source.length; i++) {
    if (source[i] === '[') depth++;
    if (source[i] === ']') {
      depth--;
      if (depth === 0) {
        closeBracket = i;
        break;
      }
    }
  }
  if (closeBracket === -1) {
    throw new Error(
      'Could not find closing bracket for baseGlyphsWithoutIconSet',
    );
  }
  const body = source.substring(openBracket + 1, closeBracket);
  const keys: string[] = [];
  const re = /glyphName\.(\w+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    keys.push(match[1]);
  }
  return keys;
}

// ---------------------------------------------------------------------------
// 3. Convert glyphName KEY to semantic kebab-case name
// ---------------------------------------------------------------------------

function toSemanticName(key: string): string {
  return key.toLowerCase().replace(/_/g, '-');
}

// ---------------------------------------------------------------------------
// 4. Detect dev-site-only icons
// ---------------------------------------------------------------------------

function getDevSiteOnlyIcons(
  monoRepoSemanticNames: Set<string>,
): Array<{ name: string; file: string }> {
  const devSiteIcons: Array<{ name: string; file: string }> = [];
  if (!fs.existsSync(DEV_SITE_GLEAN_DIR)) return devSiteIcons;

  const files = fs.readdirSync(DEV_SITE_GLEAN_DIR);
  for (const file of files) {
    if (!file.endsWith('.svg')) continue;
    const name = file.replace('.svg', '');
    if (name.endsWith('-darkmode')) continue;
    if (!monoRepoSemanticNames.has(name)) {
      devSiteIcons.push({ name, file });
    }
  }
  return devSiteIcons;
}

// ---------------------------------------------------------------------------
// 5. Main
// ---------------------------------------------------------------------------

function main() {
  for (const p of [GLYPH_TYPE_PATH, GLYPH_PATH, IMAGES_DIR]) {
    if (!fs.existsSync(p)) {
      console.error(`Missing: ${p}`);
      console.error('Set SCIO_PATH to the root of the Glean monorepo.');
      process.exit(1);
    }
  }

  const glyphTypeSource = fs.readFileSync(GLYPH_TYPE_PATH, 'utf-8');
  const glyphSource = fs.readFileSync(GLYPH_PATH, 'utf-8');

  const glyphNameMap = parseGlyphNameMap(glyphTypeSource);
  const baseGlyphKeys = parseBaseGlyphs(glyphSource);

  console.log(`Parsed ${Object.keys(glyphNameMap).length} glyphName entries`);
  console.log(
    `Found ${baseGlyphKeys.length} entries in baseGlyphsWithoutIconSet`,
  );

  fs.mkdirSync(ICONS_OUTPUT_DIR, { recursive: true });

  const monoRepoEntries: Array<{
    semanticName: string;
    filename: string;
    key: string;
  }> = [];
  const skipped: string[] = [];

  for (const key of baseGlyphKeys) {
    const filename = glyphNameMap[key];
    if (!filename) {
      console.warn(`  WARN: No glyphName entry for key "${key}", skipping`);
      skipped.push(key);
      continue;
    }
    const svgFile = `${filename}.svg`;
    const srcPath = path.join(IMAGES_DIR, svgFile);
    if (!fs.existsSync(srcPath)) {
      console.warn(`  WARN: SVG not found: ${srcPath}, skipping`);
      skipped.push(key);
      continue;
    }

    const semanticName = toSemanticName(key);
    monoRepoEntries.push({ semanticName, filename, key });
  }

  // Deduplicate by semantic name (last entry wins)
  const deduped = new Map<
    string,
    { semanticName: string; filename: string; key: string }
  >();
  for (const entry of monoRepoEntries) {
    deduped.set(entry.semanticName, entry);
  }

  // Copy SVGs
  let copied = 0;
  for (const entry of deduped.values()) {
    const svgFile = `${entry.filename}.svg`;
    const src = path.join(IMAGES_DIR, svgFile);
    const dest = path.join(ICONS_OUTPUT_DIR, svgFile);
    fs.copyFileSync(src, dest);
    copied++;
  }
  console.log(`Copied ${copied} SVGs to ${ICONS_OUTPUT_DIR}`);

  // Build set for overlap detection
  const monoSemanticNames = new Set(deduped.keys());

  // Remove overlapping dev-site icons
  const overlapping: string[] = [];
  if (fs.existsSync(DEV_SITE_GLEAN_DIR)) {
    const devFiles = fs.readdirSync(DEV_SITE_GLEAN_DIR);
    for (const file of devFiles) {
      if (!file.endsWith('.svg')) continue;
      const name = file.replace('.svg', '');
      if (name.endsWith('-darkmode')) continue;
      if (monoSemanticNames.has(name)) {
        const filePath = path.join(DEV_SITE_GLEAN_DIR, file);
        fs.unlinkSync(filePath);
        overlapping.push(name);
        const darkmodeFile = `${name}-darkmode.svg`;
        const darkmodePath = path.join(DEV_SITE_GLEAN_DIR, darkmodeFile);
        if (fs.existsSync(darkmodePath)) {
          fs.unlinkSync(darkmodePath);
          console.log(`  Removed darkmode variant: ${darkmodeFile}`);
        }
      }
    }
  }
  if (overlapping.length > 0) {
    console.log(
      `Removed ${overlapping.length} overlapping dev-site icons: ${overlapping.join(', ')}`,
    );
  }

  // Collect dev-site-only icons
  const devSiteOnly = getDevSiteOnlyIcons(monoSemanticNames);
  console.log(`Found ${devSiteOnly.length} dev-site-only icons`);

  // Generate manifest
  const monoLines: string[] = [];
  const sortedEntries = [...deduped.values()].sort((a, b) =>
    a.semanticName.localeCompare(b.semanticName),
  );
  for (const entry of sortedEntries) {
    monoLines.push(
      `  '${entry.semanticName}': { file: '${entry.filename}.svg', path: '/img/glean/icons/' },`,
    );
  }

  const devLines: string[] = [];
  const sortedDevSite = [...devSiteOnly].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  for (const icon of sortedDevSite) {
    devLines.push(
      `  '${icon.name}': { file: '${icon.file}', path: '/img/glean/' },`,
    );
  }

  const manifest = `// AUTO-GENERATED by scripts/sync-glean-icons.mts -- DO NOT EDIT
export const GLEAN_ICON_MAP = {
  // Synced from monorepo
${monoLines.join('\n')}

  // Dev-site-only icons
${devLines.join('\n')}
} as const;

export type GleanIconName = keyof typeof GLEAN_ICON_MAP;
export const AVAILABLE_GLEAN_ICONS = Object.keys(
  GLEAN_ICON_MAP,
) as GleanIconName[];
`;

  fs.writeFileSync(MANIFEST_PATH, manifest, 'utf-8');
  console.log(`Generated manifest: ${MANIFEST_PATH}`);
  console.log(
    `Total icons: ${deduped.size} (monorepo) + ${devSiteOnly.length} (dev-site) = ${deduped.size + devSiteOnly.length}`,
  );

  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length}: ${skipped.join(', ')}`);
  }
}

main();
