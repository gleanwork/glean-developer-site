import React from 'react';
import { getClientIcon, type ClientId } from '@gleanwork/mcp-config-schema/browser';

interface McpHostIconProps {
  /** Registry client id — renders the icon shipped in @gleanwork/mcp-config-schema. */
  clientId?: string;
  /** Explicit image source (for hosts without a packaged icon). */
  imgSrc?: string;
  /** Accessible label / monogram source. */
  alt: string;
  size?: number;
}

/** All hex colors referenced anywhere in the SVG (attributes, `<style>` blocks, stops). */
function hexColors(svg: string): string[] {
  return (svg.match(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g) ?? []).map((h) => h.toLowerCase());
}

/** A hex is "dark" when every channel is low — i.e. a near-black mark that vanishes in dark mode. */
function isDark(hex: string): boolean {
  const h = hex.slice(1);
  const full = h.length === 3 ? h.replace(/(.)/g, '$1$1') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return Math.max(r, g, b) < 0x60;
}

/**
 * Decide whether a mark should adapt to the theme via `currentColor`.
 * Preserve gradients and brand-colored marks; recolor only genuinely dark or
 * color-less marks (which would otherwise disappear in dark mode).
 */
function shouldRecolor(svg: string): boolean {
  if (/gradient|url\(#/i.test(svg)) return false;
  const colors = hexColors(svg).filter((h) => h !== '#fff' && h !== '#ffffff');
  if (colors.length === 0) return true;
  return colors.every(isDark);
}

/** Rewrite dark/absent fills+strokes to `currentColor` (attributes, styles, and fill-less paths). */
function recolor(svg: string): string {
  return svg
    .replace(/fill="(?!none")[^"]*"/gi, 'fill="currentColor"')
    .replace(/stroke="(?!none")[^"]*"/gi, 'stroke="currentColor"')
    .replace(/fill:\s*[^;"}]+/gi, 'fill:currentColor')
    .replace(/stroke:\s*[^;"}]+/gi, 'stroke:currentColor')
    .replace(/<path\b(?![^>]*\bfill=)/gi, '<path fill="currentColor"');
}

/** Make the root <svg> fill its (sized) container, merging into any existing root style. */
function fitToBox(svg: string): string {
  const sizing = 'width:100%;height:100%;display:block';
  if (/<svg\b[^>]*\bstyle="/i.test(svg)) {
    return svg.replace(/(<svg\b[^>]*\bstyle=")/i, `$1${sizing};`);
  }
  return svg.replace(/<svg\b/i, `<svg style="${sizing}"`);
}

export default function McpHostIcon({ clientId, imgSrc, alt, size = 24 }: McpHostIconProps) {
  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        alt={alt}
        width={size}
        height={size}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    );
  }

  const raw = clientId ? getClientIcon(clientId as ClientId) : undefined;

  if (!raw) {
    return (
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          borderRadius: 6,
          background: 'var(--ifm-color-emphasis-200)',
          fontWeight: 600,
        }}
      >
        {alt.charAt(0)}
      </span>
    );
  }

  const svg = fitToBox(shouldRecolor(raw) ? recolor(raw) : raw);

  return (
    <span
      aria-hidden
      style={{ display: 'inline-flex', width: '100%', height: '100%' }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
