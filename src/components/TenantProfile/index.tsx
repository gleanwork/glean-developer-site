import React, { useEffect, useId, useState } from 'react';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import {
  tenantApiUrlFromState,
  tenantProfileStore,
  type TenantProfileErrorReason,
  useTenantProfile,
} from '@site/src/lib/tenantProfile';
import { useTenantApiPersonalizationEnabled } from '@site/src/lib/tenantPersonalizationFlag';
import styles from './styles.module.css';

interface TenantProfileControlProps {
  compact?: boolean;
  onConfigured?: () => void;
}

const ERROR_MESSAGES: Record<TenantProfileErrorReason, string> = {
  'invalid-email': 'Enter a valid work email address.',
  'invalid-url': 'Enter a full HTTPS API URL without a path.',
  'not-found':
    'We could not find a Glean API URL for that email domain. Check the address or enter the URL manually.',
  network:
    'The lookup could not reach Glean. Try again or enter the URL manually.',
  response:
    'Glean returned an unexpected lookup response. Enter the URL manually or try again.',
  'unsupported-origin':
    'Automatic lookup is unavailable in this local preview. Enter the API URL manually.',
};

function TenantProfileControlContent({
  compact = false,
  onConfigured,
}: TenantProfileControlProps): React.ReactElement {
  const state = useTenantProfile();
  const [mode, setMode] = useState<'discover' | 'manual' | null>(null);
  const [email, setEmail] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const emailId = useId();
  const manualId = useId();
  const configuredUrlId = useId();
  const helpId = useId();
  const apiUrl = tenantApiUrlFromState(state);

  useEffect(() => {
    if (state.kind === 'configured') {
      setMode(null);
      setEmail('');
      setManualUrl('');
      onConfigured?.();
    }
  }, [onConfigured, state]);

  const discover = async (event: React.FormEvent) => {
    event.preventDefault();
    await tenantProfileStore.discover(email);
  };

  const saveManual = (event: React.FormEvent) => {
    event.preventDefault();
    tenantProfileStore.setManualApiUrl(manualUrl);
  };

  const copy = async () => {
    if (!apiUrl) return;
    try {
      await navigator.clipboard.writeText(apiUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access may be unavailable; the URL remains selectable.
    }
  };

  if (apiUrl && mode === null) {
    return (
      <div className={`${styles.control} ${compact ? styles.compact : ''}`}>
        <div className={styles.configuredField}>
          <label className={styles.configuredLabel} htmlFor={configuredUrlId}>
            <span className={styles.statusDot} aria-hidden="true" />
            API URL
            {state.kind === 'configured' &&
            state.persistence === 'memory-only' ? (
              <span className={styles.persistenceWarning}>
                Saved for this tab only
              </span>
            ) : null}
          </label>
          <div className={styles.copyField}>
            <input id={configuredUrlId} readOnly type="url" value={apiUrl} />
            <button
              aria-label={copied ? 'API URL copied' : 'Copy API URL'}
              className={styles.copyButton}
              onClick={copy}
              title={copied ? 'Copied' : 'Copy to clipboard'}
              type="button"
            >
              {getIcon(copied ? 'Check' : 'Copy', 'feather', {
                width: 16,
                height: 16,
                color: 'currentColor',
              })}
            </button>
          </div>
        </div>
        <button
          className={styles.secondaryButton}
          onClick={() => setMode('discover')}
          type="button"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.panel} ${compact ? styles.compact : ''}`}>
      <div className={styles.panelHeader}>
        <div>
          <strong>
            {apiUrl ? 'Change your Glean API URL' : 'Personalize API examples'}
          </strong>
          <p>
            {apiUrl
              ? `Your current API URL is ${apiUrl}.`
              : 'Find your API URL once and use it across examples and API reference pages.'}
          </p>
        </div>
        {apiUrl || mode ? (
          <button
            aria-label="Close API URL configuration"
            className={styles.closeButton}
            onClick={() => setMode(null)}
            type="button"
          >
            ×
          </button>
        ) : null}
      </div>

      {mode === null ? (
        <div className={styles.actions}>
          <button
            className={styles.primaryButton}
            onClick={() => setMode('discover')}
            type="button"
          >
            Find my API URL
          </button>
          <button
            className={styles.secondaryButton}
            onClick={() => setMode('manual')}
            type="button"
          >
            Enter URL manually
          </button>
        </div>
      ) : null}

      {mode === 'discover' ? (
        <form className={styles.form} onSubmit={discover}>
          <label htmlFor={emailId}>Work email</label>
          <div className={styles.inputRow}>
            <input
              aria-describedby={helpId}
              autoComplete="email"
              disabled={state.kind === 'resolving'}
              id={emailId}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              type="email"
              value={email}
            />
            <button
              className={styles.primaryButton}
              disabled={state.kind === 'resolving'}
              type="submit"
            >
              {state.kind === 'resolving' ? 'Finding…' : 'Find API URL'}
            </button>
          </div>
          <p className={styles.help} id={helpId}>
            Only your email domain is sent to Glean. Your email address is not
            stored by the developer site.
          </p>
          <button
            className={styles.textButton}
            onClick={() => setMode('manual')}
            type="button"
          >
            Enter the URL manually instead
          </button>
        </form>
      ) : null}

      {mode === 'manual' ? (
        <form className={styles.form} onSubmit={saveManual}>
          <label htmlFor={manualId}>Glean API URL</label>
          <div className={styles.inputRow}>
            <input
              id={manualId}
              onChange={(event) => setManualUrl(event.target.value)}
              placeholder="https://company-be.glean.com"
              type="url"
              value={manualUrl}
            />
            <button className={styles.primaryButton} type="submit">
              Save
            </button>
          </div>
          <p className={styles.help}>
            Use the complete HTTPS origin. Custom and non-Glean-hosted domains
            are supported. API requests and pasted tokens will be sent to this
            origin.
          </p>
          <button
            className={styles.textButton}
            onClick={() => setMode('discover')}
            type="button"
          >
            Find it from my work email instead
          </button>
        </form>
      ) : null}

      {state.kind === 'error' ? (
        <p className={styles.error} role="alert">
          {ERROR_MESSAGES[state.reason]}
        </p>
      ) : null}

      {apiUrl && mode ? (
        <button
          className={styles.clearButton}
          onClick={() => {
            tenantProfileStore.clear();
            setMode(null);
          }}
          type="button"
        >
          Clear saved API URL and API Explorer token
        </button>
      ) : null}
    </div>
  );
}

export default function TenantProfileControl(
  props: TenantProfileControlProps,
): React.ReactElement | null {
  const enabled = useTenantApiPersonalizationEnabled();
  return enabled ? <TenantProfileControlContent {...props} /> : null;
}
