import React, { useContext, useEffect, useState } from 'react';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import { LiveTabContext } from '../live/LiveTabContext';
import styles from './mocks.module.css';
import { SOURCE_LABELS, type DemoResult, type SourceKey } from './demoData';

const SOURCE_TILE_CLASS: Record<SourceKey, string> = {
  confluence: styles.tileConfluence,
  github: styles.tileGithub,
  slack: styles.tileSlack,
  jira: styles.tileJira,
  people: styles.tilePeople,
};

/** True when the user prefers reduced motion. Defaults to true (no motion)
 * until mounted so SSR output and the first client render agree. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return;
    }
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return reduced;
}

/** Small colored datasource tile (generic stand-in for real app logos). */
export function SourceTile({
  source,
  size = 'md',
}: {
  source: SourceKey;
  size?: 'sm' | 'md';
}): React.ReactElement {
  return (
    <span
      aria-label={SOURCE_LABELS[source]}
      className={`${styles.sourceTile} ${
        size === 'sm' ? styles.sourceTileSm : ''
      } ${SOURCE_TILE_CLASS[source]}`}
    >
      {SOURCE_LABELS[source][0]}
    </span>
  );
}

export function SearchInput({
  query,
  placeholder,
  focused = false,
  caret = false,
}: {
  query?: string;
  placeholder?: string;
  focused?: boolean;
  caret?: boolean;
}): React.ReactElement {
  return (
    <div
      className={`${styles.searchInput} ${focused ? styles.searchInputFocused : ''}`}
    >
      <span aria-hidden="true" className={styles.searchIcon}>
        {getIcon('Search', 'feather', { width: 14, height: 14 })}
      </span>
      {query ? (
        <span>{query}</span>
      ) : (
        <span className={styles.searchPlaceholder}>{placeholder}</span>
      )}
      {caret ? <span aria-hidden="true" className={styles.caret} /> : null}
    </div>
  );
}

/** Result row per the real widget: datasource tile, title, meta, snippet. */
export function ResultRow({
  result,
}: {
  result: DemoResult;
}): React.ReactElement {
  return (
    <div className={styles.resultRow}>
      <SourceTile source={result.source} />
      <div className={styles.resultBody}>
        <span className={styles.resultTitle}>{result.title}</span>
        <span className={styles.resultMeta}>{result.meta}</span>
        <span className={styles.resultSnippet}>
          {result.snippet.pre}
          <span className={styles.snippetMatch}>{result.snippet.match}</span>
          {result.snippet.post}
        </span>
      </div>
    </div>
  );
}

export function RecRow({
  title,
  source,
  meta,
}: {
  title: string;
  source: SourceKey;
  meta: string;
}): React.ReactElement {
  return (
    <div className={styles.recRow}>
      <SourceTile size="sm" source={source} />
      <div className={styles.recBody}>
        <span className={styles.recTitle}>{title}</span>
        <span className={styles.recMetaLine}>{meta}</span>
      </div>
    </div>
  );
}

const BAR_WIDTHS = [styles.barWide, styles.barMid, styles.barNarrow];

/** Fake intranet page used as the backdrop the widgets embed into. */
export function PortalPage({
  children,
  bodyBars = 3,
}: {
  children?: React.ReactNode;
  bodyBars?: number;
}): React.ReactElement {
  return (
    <div className={styles.portal}>
      <div className={styles.portalNav}>
        <span className={styles.portalLogo}>
          <span className={styles.portalLogoMark} />
          Acme Corp
        </span>
        <span className={styles.portalNavLinks}>
          <span
            className={`${styles.portalNavLink} ${styles.portalNavLinkActive}`}
          >
            Services
          </span>
          <span className={styles.portalNavLink}>Runbooks</span>
          <span className={styles.portalNavLink}>On-call</span>
        </span>
      </div>
      <div className={styles.portalBody}>
        {children}
        {Array.from({ length: bodyBars }, (_, i) => (
          <div
            key={i}
            className={`${styles.skeletonBar} ${BAR_WIDTHS[i % BAR_WIDTHS.length]}`}
          />
        ))}
      </div>
    </div>
  );
}

/** Honest-labeling caption rendered under every mock. Inside a demo
 * block it also offers the jump to the Live tab. */
export function MockCaption(): React.ReactElement {
  const goLive = useContext(LiveTabContext);
  return (
    <p className={styles.caption}>
      <span className={styles.captionBadge}>Illustrative preview</span>
      <span>
        Rendered with sample data — in your app, this component renders live
        against your organization&apos;s Glean instance.
        {goLive ? (
          <>
            {' '}
            <button className={styles.tryLive} onClick={goLive} type="button">
              Try it live →
            </button>
          </>
        ) : null}
      </span>
    </p>
  );
}
