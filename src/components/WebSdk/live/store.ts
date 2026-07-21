/** Shared connect-state for the in-page live demos: the reader's Glean
 * backend URL (optional — the SDK falls back to email-based discovery),
 * persisted in localStorage so one connect powers every component page. */

import { useSyncExternalStore } from 'react';

const KEY = 'websdk-live-demo';

export interface LiveDemoState {
  connected: boolean;
  /** Backend URL like https://acme-be.glean.com/ — may be empty, in which
   * case the widget prompts for the user's email to discover it. */
  backend: string;
  /** Web app URL like https://app.glean.com — required by the npm build to
   * know where the widget iframes are hosted (the script tag derives this
   * from its own src; the npm bundle cannot). */
  webAppUrl: string;
}

const DISCONNECTED: LiveDemoState = {
  connected: false,
  backend: '',
  webAppUrl: '',
};

let cached: LiveDemoState = DISCONNECTED;
let cachedRaw: string | null = null;

const listeners = new Set<() => void>();

function read(): LiveDemoState {
  if (typeof window === 'undefined') {
    return DISCONNECTED;
  }
  const raw = window.localStorage.getItem(KEY);
  if (raw === cachedRaw) {
    return cached;
  }
  cachedRaw = raw;
  if (!raw) {
    cached = DISCONNECTED;
    return cached;
  }
  try {
    const parsed = JSON.parse(raw);
    cached = {
      connected: parsed.connected === true,
      backend: typeof parsed.backend === 'string' ? parsed.backend : '',
      webAppUrl: typeof parsed.webAppUrl === 'string' ? parsed.webAppUrl : '',
    };
  } catch {
    cached = DISCONNECTED;
  }
  return cached;
}

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function connect(backend: string, webAppUrl: string): void {
  window.localStorage.setItem(
    KEY,
    JSON.stringify({
      connected: true,
      backend: backend.trim(),
      webAppUrl: webAppUrl.trim(),
    }),
  );
  notify();
}

export function disconnect(): void {
  window.localStorage.removeItem(KEY);
  notify();
}

export function useLiveDemoState(): LiveDemoState {
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
    () => DISCONNECTED,
  );
}
