import React from 'react';

/**
 * Tints a terminal *session* rather than source code.
 *
 * The shared `tint` in home/TerminalPanel is a Python/JS syntax tinter — run
 * over a transcript it colours prose, so "REST API with cursor pagination"
 * highlighted `with` as a keyword and split "12,400" into two numerals. Here
 * only the line markers carry colour, which is what a real terminal does:
 *
 *   $  shell prompt        >  what you typed        ●  agent step
 *   ✔  succeeded           ✗  failed
 *
 * Everything after the marker keeps the panel's base text colour.
 */

const SIGIL = /^(\s*)([$>●✔✗])(\s)/;

const SIGIL_COLOR: Record<string, string> = {
  $: '#8f94fd', // periwinkle — shell prompt
  '>': '#d0e26f', // lime — your input
  '●': '#8f94fd', // periwinkle — agent step
  '✔': '#28c840', // green — succeeded
  '✗': '#ff5f57', // red — failed
};

export function tintSession(code: string): React.ReactNode[] {
  return code.split('\n').flatMap((line, i) => {
    const nl = i > 0 ? ['\n'] : [];
    const m = SIGIL.exec(line);
    if (!m) return [...nl, line];
    const [, indent, sigil, gap] = m;
    return [
      ...nl,
      indent,
      <span key={i} style={{ color: SIGIL_COLOR[sigil] }}>
        {sigil}
      </span>,
      gap + line.slice(m[0].length),
    ];
  });
}
