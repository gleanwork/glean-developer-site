import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const css = fs.readFileSync(
  path.resolve(__dirname, 'form-controls.css'),
  'utf8',
);

describe('shared form controls', () => {
  it('defines the common native select appearance and interaction states', () => {
    expect(css).toMatch(
      /\.gdt-select\s*\{[^}]*appearance:\s*none[^}]*border-radius:\s*9999px/s,
    );
    expect(css).toMatch(
      /\.gdt-select\s*\{[^}]*background-image:[^}]*linear-gradient/s,
    );
    expect(css).toMatch(
      /\.gdt-select:focus-visible\s*\{[^}]*box-shadow:\s*0 0 0 3px var\(--gdt-selected-bg\)/s,
    );
    expect(css).toMatch(/\.gdt-select--active\s*\{/);
    expect(css).toMatch(/@media \(forced-colors: active\)/);
  });
});
