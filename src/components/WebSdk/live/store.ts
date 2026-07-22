/** Optional overrides for the in-page live demos. By default the demos
 * render via https://app.glean.com with no backend — the SDK reuses an
 * existing glean.com session or runs its own email-based discovery, the
 * same zero-config path as a script-tag integration. Overrides exist for
 * custom-subdomain, non-Glean-hosted, and staging deployments, persisted
 * in localStorage so one configuration covers every component page. */

import { useSyncExternalStore } from 'react';

const KEY = 'websdk-live-demo';

export const DEFAULT_WEB_APP_URL = 'https://app.glean.com';

export interface LiveDemoConfig {
  /** Web app URL hosting the widget frames. Empty means the default. */
  webAppUrl: string;
  /** Backend URL override; empty lets the SDK discover it. */
  backend: string;
}

const DEFAULTS: LiveDemoConfig = { webAppUrl: '', backend: '' };

let cached: LiveDemoConfig = DEFAULTS;
let cachedRaw: string | null = null;

const listeners = new Set<() => void>();

function read(): LiveDemoConfig {
  if (typeof window === 'undefined') {
    return DEFAULTS;
  }
  const raw = window.localStorage.getItem(KEY);
  if (raw === cachedRaw) {
    return cached;
  }
  cachedRaw = raw;
  if (!raw) {
    cached = DEFAULTS;
    return cached;
  }
  try {
    const parsed = JSON.parse(raw);
    cached = {
      webAppUrl: typeof parsed.webAppUrl === 'string' ? parsed.webAppUrl : '',
      backend: typeof parsed.backend === 'string' ? parsed.backend : '',
    };
  } catch {
    cached = DEFAULTS;
  }
  return cached;
}

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function setOverrides(config: LiveDemoConfig): void {
  const webAppUrl = config.webAppUrl.trim();
  const backend = config.backend.trim();
  if (!webAppUrl && !backend) {
    window.localStorage.removeItem(KEY);
  } else {
    window.localStorage.setItem(KEY, JSON.stringify({ webAppUrl, backend }));
  }
  notify();
}

export function useLiveDemoConfig(): LiveDemoConfig {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      window.addEventListener('storage', cb);
      return () => {
        listeners.delete(cb);
        window.removeEventListener('storage', cb);
      };
    },
    read,
    () => DEFAULTS,
  );
}
