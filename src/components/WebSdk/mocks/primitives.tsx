import React, { useEffect, useState } from 'react';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import styles from './mocks.module.css';
import { SOURCE_LABELS, type DemoResult, type SourceKey } from './demoData';

const SOURCE_DOT_CLASS: Record<SourceKey, string> = {
  confluence: styles.sourceDotConfluence,
  github: styles.sourceDotGithub,
  slack: styles.sourceDotSlack,
  jira: styles.sourceDotJira,
  people: styles.sourceDotPeople,
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

export function SourceBadge({
  source,
}: {
  source: SourceKey;
}): React.ReactElement {
  return (
    <span className={styles.sourceBadge}>
      <span className={`${styles.sourceDot} ${SOURCE_DOT_CLASS[source]}`} />
      {SOURCE_LABELS[source]}
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

export function ResultRow({
  result,
}: {
  result: DemoResult;
}): React.ReactElement {
  return (
    <div className={styles.resultRow}>
      <div className={styles.resultTitleLine}>
        <span className={styles.resultTitle}>{result.title}</span>
        <SourceBadge source={result.source} />
      </div>
      <span className={styles.resultMeta}>{result.meta}</span>
      <span className={styles.resultSnippet}>
        {result.snippet.pre}
        <span className={styles.snippetMatch}>{result.snippet.match}</span>
        {result.snippet.post}
      </span>
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
      <span className={styles.recTitle}>{title}</span>
      <span className={styles.recMetaLine}>
        <SourceBadge source={source} />
        {meta}
      </span>
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
          Engineering Portal
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

/** Honest-labeling caption rendered under every mock. */
export function MockCaption(): React.ReactElement {
  return (
    <p className={styles.caption}>
      <span className={styles.captionBadge}>Illustrative preview</span>
      <span>
        Rendered with sample data — in your app, this component renders live
        against your organization&apos;s Glean instance.
      </span>
    </p>
  );
}
