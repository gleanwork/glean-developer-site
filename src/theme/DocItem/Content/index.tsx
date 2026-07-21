/**
 * Swizzled from @docusaurus/theme-classic DocItem/Content.
 *
 * Adds a wayfinding eyebrow above the doc title — the page's sidebar
 * ancestry rendered in the uppercase Glean-blue section-label style from
 * the homepage/plugin/cookbook surfaces (e.g. "GUIDES / CHAT"). The
 * synthetic-title logic is unchanged from the original.
 */
import React from 'react';
import clsx from 'clsx';
import { ThemeClassNames } from '@docusaurus/theme-common';
import {
  useDoc,
  useSidebarBreadcrumbs,
} from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';
import styles from './styles.module.css';

function useSyntheticTitle(): string | null {
  const { metadata, frontMatter, contentTitle } = useDoc();
  const shouldRender =
    !frontMatter.hide_title && typeof contentTitle === 'undefined';
  if (!shouldRender) {
    return null;
  }
  return metadata.title;
}

/** Sidebar ancestry (all but the current page) as an uppercase eyebrow. */
function DocEyebrow(): React.ReactElement | null {
  const breadcrumbs = useSidebarBreadcrumbs();
  if (!breadcrumbs || breadcrumbs.length < 2) {
    return null;
  }
  const trail = breadcrumbs.slice(0, -1).map((item) => item.label);
  return (
    <div className={styles.eyebrow}>
      {trail.map((label, i) => (
        <React.Fragment key={`${label}-${i}`}>
          {i > 0 ? <span className={styles.eyebrowSep}>/</span> : null}
          {label}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function DocItemContent({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const syntheticTitle = useSyntheticTitle();
  const { frontMatter } = useDoc();
  return (
    <div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown')}>
      {syntheticTitle ? (
        <header>
          <DocEyebrow />
          <Heading as="h1">{syntheticTitle}</Heading>
        </header>
      ) : (
        /* Docs that declare their h1 inline still get the eyebrow; the
         * wrapping <header> keeps it subject to the same per-surface
         * hiding rules (homepage, plugin pages, cookbook). hide_title
         * doubles as the opt-out. */
        !frontMatter.hide_title && (
          <header>
            <DocEyebrow />
          </header>
        )
      )}
      <MDXContent>{children}</MDXContent>
    </div>
  );
}
