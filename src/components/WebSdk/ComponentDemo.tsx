import React, { useState } from 'react';
import Link from '@docusaurus/Link';
import BrowserOnly from '@docusaurus/BrowserOnly';
import LiveWidget, { type LiveKind } from './live/LiveWidget';
import {
  DEFAULT_WEB_APP_URL,
  setOverrides,
  useLiveDemoConfig,
} from './live/store';
import styles from './live/live.module.css';

const GLEAN_URL = /^https:\/\/[^\s/]+\.glean\.com\/?$/i;

/** Overrides for custom-subdomain / non-Glean-hosted / staging tenants. */
function ConfigureForm({
  onClose,
}: {
  onClose: () => void;
}): React.ReactElement {
  const config = useLiveDemoConfig();
  const [webAppUrl, setWebAppUrl] = useState(config.webAppUrl);
  const [backend, setBackend] = useState(config.backend);
  const [error, setError] = useState('');

  const save = () => {
    const app = webAppUrl.trim();
    const be = backend.trim();
    if ((app && !GLEAN_URL.test(app)) || (be && !GLEAN_URL.test(be))) {
      setError(
        "That doesn't look like a Glean URL — expected something like https://acme.glean.com or https://acme-be.glean.com/.",
      );
      return;
    }
    setOverrides({ webAppUrl: app, backend: be });
    onClose();
  };

  return (
    <div className={styles.connectCard}>
      <p className={styles.connectBody}>
        The demos default to <code>app.glean.com</code>, which locates your
        tenant automatically. Override only if your team accesses Glean at a
        custom domain, or to pin a specific backend (e.g. staging). Both values
        are shown at{' '}
        <Link to="https://app.glean.com/admin/about-glean">
          app.glean.com/admin/about-glean
        </Link>
        .
      </p>
      <div className={styles.connectRow}>
        <input
          className={styles.connectInput}
          onChange={(e) => {
            setWebAppUrl(e.target.value);
            setError('');
          }}
          placeholder={`Web app URL — ${DEFAULT_WEB_APP_URL}`}
          value={webAppUrl}
        />
      </div>
      <div className={styles.connectRow}>
        <input
          className={styles.connectInput}
          onChange={(e) => {
            setBackend(e.target.value);
            setError('');
          }}
          placeholder="Backend URL (optional) — https://{company}-be.glean.com/"
          value={backend}
        />
        <button className={styles.connectBtn} onClick={save} type="button">
          Save
        </button>
      </div>
      {error ? <p className={styles.liveError}>{error}</p> : null}
    </div>
  );
}

function LivePane({ kind }: { kind: LiveKind }): React.ReactElement {
  const config = useLiveDemoConfig();
  const [configuring, setConfiguring] = useState(false);
  const webAppUrl = config.webAppUrl || DEFAULT_WEB_APP_URL;
  const overridden = Boolean(config.webAppUrl || config.backend);

  return (
    <>
      <LiveWidget backend={config.backend} kind={kind} webAppUrl={webAppUrl} />
      <p className={styles.liveCaption}>
        <span className={styles.liveCaptionBadge}>Live</span>
        <span>
          The real component, rendering against your Glean instance with your
          permissions — sign in inside the widget if prompted (an existing Glean
          session is reused automatically). Data flows only between your browser
          and your tenant.{' '}
          <button
            className={styles.configureLink}
            onClick={() => setConfiguring((c) => !c)}
            type="button"
          >
            {configuring
              ? 'Hide configuration'
              : overridden
                ? `Configured: ${new URL(webAppUrl).host} — change`
                : 'Custom domain or backend?'}
          </button>{' '}
          Trouble signing in? See{' '}
          <Link to="/libraries/web-sdk/3rd-party-cookies">
            Third-Party Cookie Management
          </Link>
          .
        </span>
      </p>
      {configuring ? (
        <ConfigureForm onClose={() => setConfiguring(false)} />
      ) : null}
    </>
  );
}

/** Tabbed demo block for the component pages: the illustrative mock by
 * default, with an opt-in live tab that renders the real component against
 * the reader's own Glean instance — zero-config via app.glean.com, with
 * overrides for custom-domain and non-Glean-hosted deployments. */
export default function ComponentDemo({
  kind,
  children,
}: {
  kind: LiveKind;
  children: React.ReactNode;
}): React.ReactElement {
  const [tab, setTab] = useState<'preview' | 'live'>('preview');

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
