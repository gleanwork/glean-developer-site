import React from 'react';
import styles from './HomeRedesign.module.css';

/** Minimal syntax tinting per the handoff token colors. */
export function tint(code: string): React.ReactNode[] {
  const pattern =
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(from|import|with|as|print|const|await|new|return|async)\b|\b(\d+)\b/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of code.matchAll(pattern)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(code.slice(last, idx));
    if (m[1] !== undefined) {
      out.push(
        <span key={i++} style={{ color: '#d0e26f' }}>
          {m[0]}
        </span>,
      );
    } else if (m[2] !== undefined) {
      out.push(
        <span key={i++} style={{ color: '#8f94fd' }}>
          {m[0]}
        </span>,
      );
    } else {
      out.push(
        <span key={i++} style={{ color: '#ffd4bf' }}>
          {m[0]}
        </span>,
      );
    }
    last = idx + m[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

interface TerminalPanelProps {
  filename: string;
  label?: string;
  code: string;
  className?: string;
}

/** Dark editor/terminal card per the handoff: mac dots, filename, label. */
export default function TerminalPanel({
  filename,
  label,
  code,
  className,
}: TerminalPanelProps): React.ReactElement {
  return (
    <div className={`${styles.terminal} ${className ?? ''}`}>
      <div className={styles.terminalHeader}>
        <span className={styles.dotRed} />
        <span className={styles.dotYellow} />
        <span className={styles.dotGreen} />
        <span className={styles.terminalFile}>{filename}</span>
        {label ? <span className={styles.terminalLabel}>{label}</span> : null}
      </div>
      <pre className={styles.terminalPre}>{tint(code)}</pre>
    </div>
  );
}
