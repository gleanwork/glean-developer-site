import React from 'react';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import styles from './BrowserFrame.module.css';

interface BrowserFrameProps {
  /** Address shown in the URL pill, e.g. "portal.internal/runbooks". */
  url: string;
  children: React.ReactNode;
  className?: string;
}

/** Browser-window chrome (mac dots + URL pill) — the light counterpart to
 * TerminalPanel, used to frame embedded-widget previews. */
export default function BrowserFrame({
  url,
  children,
  className,
}: BrowserFrameProps): React.ReactElement {
  return (
    <div className={`${styles.frame} ${className ?? ''}`}>
      <div className={styles.header}>
        <span className={styles.dotRed} />
        <span className={styles.dotYellow} />
        <span className={styles.dotGreen} />
        <span className={styles.urlBar}>
          <span aria-hidden="true" className={styles.lock}>
            {getIcon('Lock', 'feather', { width: 11, height: 11 })}
          </span>
          {url}
        </span>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
