import React, { useState } from 'react';
import Link from '@docusaurus/Link';
import BrowserOnly from '@docusaurus/BrowserOnly';
import LiveWidget, { type LiveKind } from './live/LiveWidget';
import { connect, disconnect, useLiveDemoState } from './live/store';
import styles from './live/live.module.css';

function ConnectCard(): React.ReactElement {
  const [backend, setBackend] = useState('');
  const [invalid, setInvalid] = useState(false);

  const submit = () => {
    const value = backend.trim();
    if (value && !/^https:\/\/[^\s/]+\.glean\.com\/?$/i.test(value)) {
      setInvalid(true);
      return;
    }
    connect(value);
  };

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
            setBackend(e.target.value);
            setInvalid(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              submit();
            }
          }}
          placeholder="https://{company}-be.glean.com/"
          value={backend}
        />
        <button className={styles.connectBtn} onClick={submit} type="button">
          Connect
        </button>
      </div>
      {invalid ? (
        <p className={styles.liveError}>
          That doesn&apos;t look like a Glean backend URL — expected something
          like https://acme-be.glean.com/.
        </p>
      ) : null}
      <p className={styles.connectHint}>
        Find your backend URL at{' '}
        <Link to="https://app.glean.com/admin/about-glean">
          app.glean.com/admin/about-glean
        </Link>{' '}
        under &ldquo;Server instance (QE)&rdquo; — or leave it blank and the
        widget will ask for your work email to locate it. Already signed in to
        Glean in this browser? The widgets reuse that session automatically.
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
      <LiveWidget backend={state.backend} kind={kind} />
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
