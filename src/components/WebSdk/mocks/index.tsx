import React, { useEffect, useState } from 'react';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import styles from './mocks.module.css';
import {
  DEMO_CHAT,
  DEMO_DATASOURCES,
  DEMO_DOC_SUGGESTIONS,
  DEMO_FILTER_HINTS,
  DEMO_PLACEHOLDER,
  DEMO_QUERY,
  DEMO_RECOMMENDATIONS,
  DEMO_RESULT_CHIPS,
  DEMO_RESULTS,
} from './demoData';
import {
  RecRow,
  ResultRow,
  SearchInput,
  SourceTile,
  usePrefersReducedMotion,
} from './primitives';

function feather(name: string, size = 13): React.ReactNode {
  return getIcon(name, 'feather', {
    width: size,
    height: size,
    color: 'currentColor',
  });
}

/** A focused search box with the demo query typed in. */
export function MockSearchBox(): React.ReactElement {
  return <SearchInput caret focused query={DEMO_QUERY} />;
}

/** Suggestion content shared by the autocomplete card and the modal:
 * document suggestions, then filter-operator hints, then the enter hint —
 * the anatomy the real widget shows. */
function SuggestionList({
  filterHints = 2,
}: {
  filterHints?: number;
}): React.ReactElement {
  return (
    <>
      {DEMO_DOC_SUGGESTIONS.map((doc) => (
        <div key={doc.title} className={styles.suggestDoc}>
          <SourceTile size="sm" source={doc.source} />
          <span className={styles.suggestDocBody}>
            <span className={styles.suggestDocTitle}>{doc.title}</span>
            <span className={styles.suggestDocMeta}>{doc.meta}</span>
          </span>
        </div>
      ))}
      {DEMO_FILTER_HINTS.slice(0, filterHints).map((f) => (
        <div key={f.chip} className={styles.suggestFilter}>
          <span aria-hidden="true" className={styles.suggestFilterIcon}>
            {feather('Filter', 12)}
          </span>
          <span className={styles.filterChip}>{f.chip}</span>
          <span className={styles.suggestFilterHint}>{f.hint}</span>
        </div>
      ))}
      <div className={styles.enterHint}>
        <span className={styles.enterKey}>⏎ Enter</span> Search
      </div>
    </>
  );
}

/** Search box with suggestions — one continuous card, as the real widget
 * renders it (input, divider, doc suggestions, filter hints, enter hint). */
export function MockAutocomplete(): React.ReactElement {
  return (
    <div className={styles.searchCard}>
      <div className={styles.searchCardInput}>
        <span aria-hidden="true" className={styles.searchIcon}>
          {feather('Search', 15)}
        </span>
        payments
        <span aria-hidden="true" className={styles.caret} />
      </div>
      <SuggestionList />
    </div>
  );
}

/** Tabbed search results: filter chips, icon tabs, tiled result rows. */
export function MockSearchResults(): React.ReactElement {
  return (
    <div>
      <div className={styles.chipRow}>
        {DEMO_RESULT_CHIPS.map((chip) => (
          <span key={chip} className={styles.resultChip}>
            {chip}
            {feather('ChevronDown', 11)}
          </span>
        ))}
      </div>
      <div className={styles.tabs}>
        <span className={`${styles.tab} ${styles.tabActive}`}>All</span>
        {(['confluence', 'github', 'slack', 'jira'] as const).map((source) => (
          <span key={source} className={styles.tab}>
            <SourceTile size="sm" source={source} />
          </span>
        ))}
      </div>
      {DEMO_RESULTS.map((result) => (
        <ResultRow key={result.title} result={result} />
      ))}
    </div>
  );
}

/** Modal search dialog floating over a dimmed host page. */
export function MockModalSearch(): React.ReactElement {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalBox}>
        <SearchInput caret focused query={DEMO_QUERY} />
        <div className={styles.modalSuggestions}>
          <SuggestionList filterHints={2} />
        </div>
        <div className={styles.poweredBy}>powered by Glean</div>
      </div>
    </div>
  );
}

/** Assistant-first sidebar panel, as the current widget renders it:
 * Chat | Search toggle up top, prompt heading, input pinned to the bottom. */
export function MockSidebar(): React.ReactElement {
  return (
    <div className={styles.sidebarPanel}>
      <div className={styles.sidebarHeader}>
        {getIcon('glean-logo', 'glean', { width: 44, height: 16 })}
        <span className={styles.sidebarToggle}>
          <span
            className={`${styles.sidebarToggleOpt} ${styles.sidebarToggleActive}`}
          >
            Chat
          </span>
          <span className={styles.sidebarToggleOpt}>Search</span>
        </span>
        <span aria-hidden="true" className={styles.sidebarClose}>
          {feather('X', 13)}
        </span>
      </div>
      <div className={styles.sidebarHeading}>Ask Assistant anything</div>
      <div className={styles.sidebarFooter}>
        <span className={styles.refToggle}>
          <span className={styles.refToggleKnob} />
          Reference current page
        </span>
        <div className={styles.sidebarInput}>
          Ask Assistant anything…
          <span aria-hidden="true" className={styles.sidebarInputIcons}>
            {feather('Mic', 12)}
            <span className={styles.sendCircle}>{feather('ArrowUp', 11)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/** Chat: left rail, centered conversation title, document-style answer with
 * an action-icon row — the real widget's anatomy (no chat bubbles). */
export function MockChat(): React.ReactElement {
  const reducedMotion = usePrefersReducedMotion();
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setTyping(false);
      return;
    }
    setTyping(true);
    const timer = setTimeout(() => setTyping(false), 1600);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  return (
    <div className={styles.chatShell}>
      <div className={styles.chatRail}>
        <span className={`${styles.chatRailItem} ${styles.chatRailItemActive}`}>
          {feather('Edit2', 12)} New chat
        </span>
        <span className={styles.chatRailItem}>
          {feather('BookOpen', 12)} Library
        </span>
        <span className={styles.chatRailItem}>{feather('Zap', 12)} Agents</span>
        <span className={styles.chatRailHeading}>Today</span>
        <span className={styles.chatRailHistory}>Who owns the payments…</span>
        <span className={styles.chatRailHistory}>Canary alarm follow-up</span>
      </div>
      <div className={styles.chatMain}>
        <div className={styles.chatTitleBar}>
          <span className={styles.chatTitle}>{DEMO_CHAT.title}</span>
          <span className={styles.chatShare}>Share</span>
        </div>
        <div className={styles.chatAnswer}>
          {typing ? (
            <span className={styles.typing}>
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
            </span>
          ) : (
            <>
              {DEMO_CHAT.answer.map((line) => (
                <p key={line} className={styles.chatParagraph}>
                  {line}
                </p>
              ))}
              <span aria-hidden="true" className={styles.chatActions}>
                {feather('Copy', 12)}
                {feather('ThumbsUp', 12)}
                {feather('ThumbsDown', 12)}
                {feather('Share2', 12)}
                {feather('RefreshCw', 12)}
              </span>
            </>
          )}
        </div>
        <div className={styles.chatInputRow}>
          {feather('Plus', 13)}
          Ask a follow-up…
          <span aria-hidden="true" className={styles.chatInputIcons}>
            {feather('Mic', 12)}
            <span className={styles.sendCircle}>{feather('ArrowUp', 11)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/** Recommendations widget: search box over contextual suggestions. */
export function MockRecommendations(): React.ReactElement {
  return (
    <div className={styles.recsCard}>
      <SearchInput placeholder={DEMO_PLACEHOLDER} />
      <div>
        <div className={styles.panelHeading}>Recommended for this page</div>
        {DEMO_RECOMMENDATIONS.map((rec) => (
          <RecRow key={rec.title} {...rec} />
        ))}
      </div>
    </div>
  );
}

/** Settings widget: connector-card grid with connect states, as the real
 * widget renders it. */
export function MockSettings(): React.ReactElement {
  return (
    <div className={styles.settingsCard}>
      <SearchInput placeholder="Search connectors" />
      <div className={styles.settingsSection}>
        <div className={styles.settingsTitle}>Connected</div>
        <div className={styles.settingsSub}>
          View and manage the connectors available.
        </div>
      </div>
      <div className={styles.settingsGrid}>
        {DEMO_DATASOURCES.map((ds) => (
          <div key={ds.name} className={styles.connectorCard}>
            <SourceTile size="sm" source={ds.source} />
            <span className={styles.settingsName}>{ds.name}</span>
            {ds.connected ? (
              <span aria-label="Connected" className={styles.connectedCheck}>
                {feather('Check', 14)}
              </span>
            ) : (
              <span className={styles.connectBtn}>Connect</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
