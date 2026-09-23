import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { recolorSvg } from './recolorSvg';

const icons = path.resolve(__dirname, '../../../../../static/img/glean/icons');

function parse(svg: string): Document {
  return new DOMParser().parseFromString(svg, 'image/svg+xml');
}

describe('recolorSvg', () => {
  it('keeps a stroke-only circle outlined instead of filled', () => {
    const doc = parse(
      recolorSvg(fs.readFileSync(path.join(icons, 'search-2.svg'), 'utf8')),
    );

    expect(doc.querySelector('parsererror')).toBeNull();
    expect(doc.querySelector('circle')?.getAttribute('fill')).toBe('none');
    expect(doc.querySelector('circle')?.getAttribute('stroke')).toBe(
      'currentColor',
    );
  });

  it('adds attributes to self-closing shapes where the browser reads them', () => {
    const doc = parse(
      recolorSvg(
        '<svg width="16" height="16" fill="none"><path d="M1 1" stroke="#000"/><path d="M2 2"/></svg>',
      ),
    );
    const [stroked, unstyled] = Array.from(doc.querySelectorAll('path'));

    expect(doc.querySelector('parsererror')).toBeNull();
    expect(stroked.getAttribute('fill')).toBe('none');
    expect(unstyled.getAttribute('fill')).toBe('currentColor');
  });

  it('recolors explicit colors and drops the fixed size', () => {
    const svg = recolorSvg(
      '<svg width="16" height="16" viewBox="0 0 16 16"><rect fill="#1B1B1B" stroke="#1B1B1B"/></svg>',
    );
    const root = parse(svg).documentElement;

    expect(root.getAttribute('width')).toBeNull();
    expect(root.getAttribute('viewBox')).toBe('0 0 16 16');
    expect(root.querySelector('rect')?.getAttribute('fill')).toBe(
      'currentColor',
    );
  });
});
