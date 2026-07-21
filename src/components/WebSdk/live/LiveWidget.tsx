import React, { useEffect, useRef, useState } from 'react';
import styles from './live.module.css';

export type LiveKind =
  'search' | 'modal' | 'chat' | 'recommendations' | 'settings' | 'sidebar';

const WIDGET_KEYS: Record<LiveKind, string> = {
  search: 'docs-live-search',
  modal: 'docs-live-modal',
  chat: 'docs-live-chat',
  recommendations: 'docs-live-recs',
  settings: 'docs-live-settings',
  sidebar: 'docs-live-sidebar',
};

/** Renders the real Web SDK component (npm build, no script tag) against
 * the reader's own instance. Auth is the SDK's normal SSO flow: an active
 * glean.com session is reused silently; otherwise the widget shows its
 * sign-in button. */
export default function LiveWidget({
  kind,
  backend,
}: {
  kind: LiveKind;
  backend: string;
}): React.ReactElement {
  const stageRef = useRef<HTMLDivElement>(null);
  const secondaryRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const sdk = await import('@gleanwork/web-sdk');
        if (cancelled) {
          return;
        }
        const base = {
          ...(backend ? { backend } : {}),
          key: WIDGET_KEYS[kind],
        };

        switch (kind) {
          case 'search': {
            let currentQuery = '';
            const render = () => {
              if (cancelled || !stageRef.current || !secondaryRef.current) {
                return;
              }
              sdk.renderSearchBox(stageRef.current, {
                ...base,
                key: `${WIDGET_KEYS.search}-box`,
                query: currentQuery,
                searchBoxCustomizations: {
                  verticalMargin: 8,
                  horizontalMargin: 8,
                },
                onSearch: (query: string) => {
                  currentQuery = query;
                  render();
                },
              });
              sdk.renderSearchResults(secondaryRef.current, {
                ...base,
                key: `${WIDGET_KEYS.search}-results`,
                query: currentQuery,
                showHomePageContent: true,
                onSearch: (query: string) => {
                  currentQuery = query;
                  render();
                },
              });
            };
            render();
            break;
          }
          case 'modal': {
            if (inputRef.current) {
              sdk.attach(inputRef.current, { ...base });
            }
            break;
          }
          case 'chat': {
            if (stageRef.current) {
              sdk.renderChat(stageRef.current, { ...base });
            }
            break;
          }
          case 'recommendations': {
            if (stageRef.current) {
              sdk.renderRecommendations(stageRef.current, { ...base });
            }
            break;
          }
          case 'settings': {
            if (stageRef.current) {
              sdk.default.renderSettings(stageRef.current, { ...base });
            }
            break;
          }
          case 'sidebar':
            // Rendered on demand from the button below.
            break;
        }
      } catch {
        if (!cancelled) {
          setError(
            'The Web SDK failed to load in this browser. See the third-party cookie guide if widgets cannot sign in.',
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [kind, backend]);

  const openSidebar = async () => {
    try {
      const sdk = await import('@gleanwork/web-sdk');
      await sdk.openSidebar(backend ? { backend } : {});
    } catch {
      setError('The Web SDK failed to load in this browser.');
    }
  };

  if (error) {
    return <p className={styles.liveError}>{error}</p>;
  }

  if (kind === 'sidebar') {
    return (
      <div className={styles.liveStage}>
        <button
          className={styles.sidebarTrigger}
          onClick={openSidebar}
          type="button"
        >
          Open the live sidebar
        </button>
      </div>
    );
  }

  if (kind === 'modal') {
    return (
      <div className={styles.liveStage}>
        <input
          className={styles.modalTrigger}
          placeholder="Click to open live modal search"
          readOnly
          ref={inputRef}
        />
      </div>
    );
  }

  if (kind === 'search') {
    return (
      <div className={styles.liveStage}>
        <div className={styles.liveSearchBox} ref={stageRef} />
        <div className={styles.liveSearchResults} ref={secondaryRef} />
      </div>
    );
  }

  return (
    <div className={styles.liveStage}>
      <div
        className={`${styles.liveContainer} ${
          kind === 'chat' ? styles.liveChat : ''
        } ${kind === 'settings' ? styles.liveSettings : ''} ${
          kind === 'recommendations' ? styles.liveRecs : ''
        }`}
        ref={stageRef}
      />
    </div>
  );
}
