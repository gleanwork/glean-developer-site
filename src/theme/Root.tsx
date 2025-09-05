import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type {
  FeatureFlagsMap,
  FeatureFlagDefinition,
} from '@site/src/lib/featureFlagTypes';
import { flagsSnapshotToBooleans } from '@site/src/lib/featureFlags';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import KeyboardShortcuts from './KeyboardShortcuts';

type FeatureFlagsState = {
  flagConfigs: FeatureFlagsMap;
  flags: Record<string, boolean>;
  isEnabled: (flag: string) => boolean;
  refresh: () => void;
  debug: boolean;
};

const initialState: FeatureFlagsState = {
  flagConfigs: {},
  flags: {},
  isEnabled: () => false,
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
  const [flagConfigs, setFlagConfigs] = useState<FeatureFlagsMap>(initial);

  const visitorId = getLocalVisitorId();

  // Check for URL parameter overrides
  const { urlOverrides, flagConfigOverrides, timeOverride } = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        urlOverrides: {},
        flagConfigOverrides: {},
        timeOverride: undefined,
      };
    }

    const params = new URLSearchParams(window.location.search);
    const overrides: Record<string, boolean> = {};
    const configOverrides: Record<string, Partial<FeatureFlagDefinition>> = {};
    let timeOverride: string | undefined;

    // Check for ff_ prefixed params (e.g., ?ff_remote-mcp-docs=true)
    // Also check for ff_time for testing date-based flags (e.g., ?ff_time=2025-01-01T00:00:00Z)
    // Also check for ff_flagname_metadatakey=value for metadata (e.g., ?ff_mcp-cli-version_version=beta)
    for (const [key, value] of params) {
      if (key === 'ff_time') {
        timeOverride = value;
      } else if (key.startsWith('ff_')) {
        const flagPart = key.slice(3);

        // Check if this is a metadata parameter (contains underscore)
        if (flagPart.includes('_')) {
          const [flagName, metadataKey] = flagPart.split('_', 2);
          if (!configOverrides[flagName]) {
            configOverrides[flagName] = { enabled: true, metadata: {} };
          }
          if (!configOverrides[flagName].metadata) {
            configOverrides[flagName].metadata = {};
          }
          configOverrides[flagName].metadata![metadataKey] = value;
        } else {
          // Regular boolean flag
          const flagName = flagPart;
          overrides[flagName] = value === 'true' || value === '1';
        }
      }
    }

    return {
      urlOverrides: overrides,
      flagConfigOverrides: configOverrides,
      timeOverride,
    };
  }, []);

  // Merge flagConfigs with URL parameter overrides
  const mergedFlagConfigs = useMemo(() => {
    const merged = { ...flagConfigs };

    // Apply URL parameter config overrides
    for (const [flagName, override] of Object.entries(flagConfigOverrides)) {
      merged[flagName] = {
        ...merged[flagName],
        ...override,
        metadata: {
          ...merged[flagName]?.metadata,
          ...override.metadata,
        },
      };
    }

    return merged;
  }, [flagConfigs, flagConfigOverrides]);

  const flags = useMemo(() => {
    const context = {
      visitorId,
      ...(timeOverride ? { currentTime: timeOverride } : {}),
    };
    const base = flagsSnapshotToBooleans(mergedFlagConfigs, context);
    // Apply URL overrides
    return { ...base, ...urlOverrides };
  }, [mergedFlagConfigs, visitorId, urlOverrides, timeOverride]);

  const isEnabled = useCallback(
    (flag: string) => flags[flag] || false,
    [flags],
  );

  const refresh = useCallback(() => {
    const cached = readCache();
    if (cached) {
      setFlagConfigs(cached);
      return;
    }
    fetchRuntimeFlags().then((next) => {
      if (next) {
        writeCache(next);
        setFlagConfigs(next);
      }
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      flagConfigs: mergedFlagConfigs,
      flags,
      isEnabled,
      refresh,
      debug,
    }),
    [mergedFlagConfigs, flags, isEnabled, refresh, debug],
  );

  return (
    <FeatureFlagsContext.Provider value={value}>
      <KeyboardShortcuts />
      {children}
    </FeatureFlagsContext.Provider>
  );
}
