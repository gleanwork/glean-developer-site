import React, { useEffect, useState } from 'react';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import styles from './mocks.module.css';
import {
  DEMO_CHAT,
  DEMO_DATASOURCES,
  DEMO_QUERY,
  DEMO_RECOMMENDATIONS,
  DEMO_RESULTS,
  DEMO_SUGGESTIONS,
  DEMO_TABS,
} from './demoData';
import {
  RecRow,
  ResultRow,
  SearchInput,
  usePrefersReducedMotion,
} from './primitives';

/** A focused search box with the demo query typed in. */
export function MockSearchBox(): React.ReactElement {
  return <SearchInput caret focused query={DEMO_QUERY} />;
}

/** Search box with the autocomplete dropdown open. */
export function MockAutocomplete(): React.ReactElement {
  return (
    <div>
      <SearchInput caret focused query="payments" />
      <div className={styles.dropdown}>
        {DEMO_SUGGESTIONS.map((s, i) => (
          <div
            key={s.text}
            className={`${styles.suggestRow} ${i === 0 ? styles.suggestRowActive : ''}`}
          >
            <span
              aria-hidden="true"
              className={`${styles.suggestIcon} ${s.kind === 'ai' ? styles.suggestIconAi : ''}`}
            >
              {getIcon(
                s.kind === 'ai'
                  ? 'Zap'
                  : s.kind === 'doc'
                    ? 'FileText'
                    : 'Search',
                'feather',
                { width: 13, height: 13 },
              )}
            </span>
            {s.text}
            {s.kind === 'ai' ? (
              <span className={styles.suggestHint}>Ask AI</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Tabbed search results for the demo query. */
export function MockSearchResults(): React.ReactElement {
  return (
    <div>
      <div className={styles.tabs}>
        {DEMO_TABS.map((tab, i) => (
          <span
            key={tab}
            className={`${styles.tab} ${i === 0 ? styles.tabActive : ''}`}
          >
            {tab}
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
        <div className={styles.dropdown}>
          {DEMO_RESULTS.slice(0, 2).map((result) => (
            <ResultRow key={result.title} result={result} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Slide-in sidebar with search plus contextual recommendations. */
export function MockSidebar(): React.ReactElement {
  return (
    <div className={styles.sidebarPanel}>
      <SearchInput placeholder="Search Glean…" />
      <div>
        <div className={styles.panelHeading}>Related to this page</div>
        {DEMO_RECOMMENDATIONS.map((rec) => (
          <RecRow key={rec.title} {...rec} />
        ))}
      </div>
    </div>
  );
}

/** Chat exchange: question, brief typing indicator, cited answer. */
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
    <div className={styles.chat}>
      <div className={styles.chatBubbleUser}>{DEMO_CHAT.question}</div>
      <div className={styles.chatBubbleAssistant}>
        <span className={styles.chatAssistantLabel}>
          {getIcon('Zap', 'feather', { width: 11, height: 11 })}
          Glean Assistant
        </span>
        {typing ? (
          <span className={styles.typing}>
            <span className={styles.typingDot} />
            <span className={styles.typingDot} />
            <span className={styles.typingDot} />
          </span>
        ) : (
          <>
            {DEMO_CHAT.answer.map((line) => (
              <span key={line}>{line}</span>
            ))}
            <span className={styles.citations}>
              {DEMO_CHAT.citations.map((c) => (
                <span key={c.title} className={styles.citationChip}>
                  {c.title}
                </span>
              ))}
            </span>
          </>
        )}
      </div>
      <div className={styles.chatInputRow}>
        Ask a follow-up…
        <span aria-hidden="true" className={styles.chatSend}>
          {getIcon('ArrowRight', 'feather', { width: 14, height: 14 })}
        </span>
      </div>
    </div>
  );
}

/** Recommendations widget: search box over contextual suggestions. */
export function MockRecommendations(): React.ReactElement {
  return (
    <div className={styles.recsCard}>
      <SearchInput placeholder="Search for anything…" />
      <div>
        <div className={styles.panelHeading}>Recommended for this page</div>
        {DEMO_RECOMMENDATIONS.map((rec) => (
          <RecRow key={rec.title} {...rec} />
        ))}
      </div>
    </div>
  );
}

/** Settings widget: per-user datasource connections. */
export function MockSettings(): React.ReactElement {
  return (
    <div className={styles.settingsCard}>
      <div className={styles.settingsTitle}>Connected accounts</div>
      {DEMO_DATASOURCES.map((ds) => (
        <div key={ds.name} className={styles.settingsRow}>
          <span className={styles.settingsText}>
            <span className={styles.settingsName}>{ds.name}</span>
            <span className={styles.settingsDetail}>{ds.detail}</span>
          </span>
          {ds.connected ? (
            <span className={styles.connectedBadge}>
              {getIcon('CheckCircle', 'feather', { width: 13, height: 13 })}
              Connected
            </span>
          ) : (
            <span className={styles.connectBtn}>Connect</span>
          )}
        </div>
      ))}
    </div>
  );
}
