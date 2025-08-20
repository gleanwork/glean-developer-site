import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { FeatureFlagsMap } from '@site/src/lib/featureFlagTypes';
import { flagsSnapshotToBooleans } from '@site/src/lib/featureFlags';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

type FeatureFlagsState = {
  raw: FeatureFlagsMap;
  booleans: Record<string, boolean>;
  refresh: () => void;
  debug: boolean;
};

const initialState: FeatureFlagsState = {
  raw: {},
  booleans: {},
  refresh: () => {},
  debug: false,
};

export const FeatureFlagsContext =
  createContext<FeatureFlagsState>(initialState);

function getLocalVisitorId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const key = 'ff:visitorId';
    let id = window.localStorage.getItem(key) || undefined;
    if (!id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

function readCache(): FeatureFlagsMap | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem('ff:cache');
    if (!raw) return undefined;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > 5 * 60 * 1000) return undefined;
    return data as FeatureFlagsMap;
  } catch {
    return undefined;
  }
}

function writeCache(data: FeatureFlagsMap) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      'ff:cache',
      JSON.stringify({ ts: Date.now(), data }),
    );
  } catch {}
}

async function fetchRuntimeFlags(): Promise<FeatureFlagsMap | undefined> {
  try {
    const res = await fetch('/api/feature-flags', { headers: { 'x-ff': '1' } });
    if (!res.ok) return undefined;
    const json = await res.json();
    return (json && json.flags) || undefined;
  } catch {
    return undefined;
  }
}

export default function Root({ children }: { children: ReactNode }) {
  const { siteConfig } = useDocusaurusContext();
  const debug =
    typeof window !== 'undefined' && (window as any).__FLAGS_DEBUG__;
  const initial =
    ((siteConfig?.customFields as any)?.__BUILD_FLAGS__ as FeatureFlagsMap) ||
    {};
  const [raw, setRaw] = useState<FeatureFlagsMap>(initial);

  const visitorId = getLocalVisitorId();

  // Check for URL parameter overrides
  const urlOverrides = useMemo(() => {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    const overrides: Record<string, boolean> = {};

    // Check for ff_ prefixed params (e.g., ?ff_remote-mcp-docs=true)
    for (const [key, value] of params) {
      if (key.startsWith('ff_')) {
        const flagName = key.slice(3);
        overrides[flagName] = value === 'true' || value === '1';
      }
    }

    return overrides;
  }, []);

  const booleans = useMemo(() => {
    const base = flagsSnapshotToBooleans(raw, { visitorId });
    // Apply URL overrides
    return { ...base, ...urlOverrides };
  }, [raw, visitorId, urlOverrides]);

  const refresh = useCallback(() => {
    const cached = readCache();
    if (cached) {
      setRaw(cached);
      return;
    }
    fetchRuntimeFlags().then((next) => {
      if (next) {
        writeCache(next);
        setRaw(next);
      }
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ raw, booleans, refresh, debug }),
    [raw, booleans, refresh, debug],
  );

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}
