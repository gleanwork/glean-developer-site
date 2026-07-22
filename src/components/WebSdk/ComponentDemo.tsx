import React, { useState } from 'react';
import Link from '@docusaurus/Link';
import BrowserOnly from '@docusaurus/BrowserOnly';
import LiveWidget, { type LiveKind } from './live/LiveWidget';
import { connect, disconnect, useLiveDemoState } from './live/store';
import styles from './live/live.module.css';

const GLEAN_URL = /^https:\/\/[^\s/]+\.glean\.com\/?$/i;

function ConnectCard(): React.ReactElement {
  const [webAppUrl, setWebAppUrl] = useState('');
  const [backend, setBackend] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    let app = webAppUrl.trim();
    const be = backend.trim();
    if ((app && !GLEAN_URL.test(app)) || (be && !GLEAN_URL.test(be))) {
      setError(
        "That doesn't look like a Glean URL — expected something like https://app.glean.com or https://acme-be.glean.com/.",
      );
      return;
    }
    if (!app && be) {
      // Derive the web app URL from a conventional {x}-be.glean.com backend.
      const derived = be.replace(/-be\.glean\.com\/?$/i, '.glean.com');
      if (derived === be) {
        setError(
          'Enter your web app URL too — it cannot be derived from this backend URL.',
        );
        return;
      }
      app = derived;
    }
    if (!app) {
      setError(
        'Enter at least your web app URL — the address where you normally access Glean.',
      );
      return;
    }
    connect(be, app);
  };

  const clearError = () => setError('');

  return (
    <div className={styles.connectCard}>
      <p className={styles.connectTitle}>Connect your Glean instance</p>
      <p className={styles.connectBody}>
        Live demos render the real components against your own Glean instance —
        you sign in with your normal SSO inside the widget, and every result
        respects your permissions. Data flows only between your browser and your
        Glean tenant; nothing touches this site&apos;s servers.
      </p>
      <div className={styles.connectRow}>
        <input
          className={styles.connectInput}
          onChange={(e) => {
            setWebAppUrl(e.target.value);
            clearError();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              submit();
            }
          }}
          placeholder="Web app URL — https://app.glean.com"
          value={webAppUrl}
        />
      </div>
      <div className={styles.connectRow}>
        <input
          className={styles.connectInput}
          onChange={(e) => {
            setBackend(e.target.value);
            clearError();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              submit();
            }
          }}
          placeholder="Backend URL (optional) — https://{company}-be.glean.com/"
          value={backend}
        />
        <button className={styles.connectBtn} onClick={submit} type="button">
          Connect
        </button>
      </div>
      {error ? <p className={styles.liveError}>{error}</p> : null}
      <p className={styles.connectHint}>
        The web app URL is where you normally access Glean (often{' '}
        <code>app.glean.com</code>). Both values are shown at{' '}
        <Link to="https://app.glean.com/admin/about-glean">
          app.glean.com/admin/about-glean
        </Link>
        ; leave the backend blank and the widget will ask for your work email to
        locate it. Already signed in to Glean in this browser? The widgets reuse
        that session automatically.
      </p>
    </div>
  );
}

function LivePane({ kind }: { kind: LiveKind }): React.ReactElement {
  const state = useLiveDemoState();

  if (!state.connected) {
    return <ConnectCard />;
  }

  return (
    <>
      <LiveWidget
        backend={state.backend}
        kind={kind}
        webAppUrl={state.webAppUrl}
      />
      <p className={styles.liveCaption}>
        <span className={styles.liveCaptionBadge}>Live</span>
        <span>
          Rendering against your Glean instance with your permissions. Having
          trouble signing in? See{' '}
          <Link to="/libraries/web-sdk/3rd-party-cookies">
            Third-Party Cookie Management
          </Link>
          .
        </span>
      </p>
    </>
  );
}

/** Tabbed demo block for the component pages: the illustrative mock by
 * default, with an opt-in live tab that renders the real component against
 * the reader's own Glean instance. */
export default function ComponentDemo({
  kind,
  children,
}: {
  kind: LiveKind;
  children: React.ReactNode;
}): React.ReactElement {
  const [tab, setTab] = useState<'preview' | 'live'>('preview');
  const state = useLiveDemoState();

  return (
    <div className={styles.demo}>
      <div className={styles.tabRow}>
        <button
          className={`${styles.tab} ${tab === 'preview' ? styles.tabActive : ''}`}
          onClick={() => setTab('preview')}
          type="button"
        >
          Preview
        </button>
        <button
          className={`${styles.tab} ${tab === 'live' ? styles.tabActive : ''}`}
          onClick={() => setTab('live')}
          type="button"
        >
          Live — your instance
        </button>
        {tab === 'live' && state.connected ? (
          <button
            className={styles.disconnect}
            onClick={disconnect}
            type="button"
          >
            Disconnect
          </button>
        ) : null}
      </div>
      {tab === 'preview' ? (
        children
      ) : (
        <BrowserOnly fallback={<div />}>
          {() => <LivePane kind={kind} />}
        </BrowserOnly>
      )}
    </div>
  );
}
