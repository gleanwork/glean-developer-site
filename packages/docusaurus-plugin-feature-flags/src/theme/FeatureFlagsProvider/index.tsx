import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type {
  FeatureFlagsMap,
  FeatureFlagDefinition,
} from '../../lib/featureFlagTypes';
import { flagsSnapshotToBooleans } from '../../lib/featureFlags';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { usePluginData } from '@docusaurus/useGlobalData';
import { FeatureFlagsContext } from './context';
import type { FeatureFlagPluginOptions } from '../../types';

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

function readCache(cacheTtlMs: number): FeatureFlagsMap | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem('ff:cache');
    if (!raw) return undefined;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > cacheTtlMs) return undefined;
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

async function fetchRuntimeFlags(apiEndpoint: string): Promise<FeatureFlagsMap | undefined> {
  try {
    const res = await fetch(apiEndpoint, { headers: { 'x-ff': '1' } });
    if (!res.ok) return undefined;
    const json = await res.json();
    return (json && json.flags) || undefined;
  } catch {
    return undefined;
  }
}

type Props = {
  children: ReactNode;
};

export default function FeatureFlagsProvider({ children }: Props) {
  const { siteConfig } = useDocusaurusContext();
  const pluginData = usePluginData('docusaurus-plugin-feature-flags') as FeatureFlagPluginOptions;
  const apiEndpoint = pluginData?.apiEndpoint ?? '/api/feature-flags';
  const cacheTtlMs = pluginData?.cacheTtlMs ?? 300_000;

  const debug =
    typeof window !== 'undefined' && (window as any).__FLAGS_DEBUG__;
  const initial =
    ((siteConfig?.customFields as any)?.__BUILD_FLAGS__ as FeatureFlagsMap) ||
    {};
  const [flagConfigs, setFlagConfigs] = useState<FeatureFlagsMap>(initial);

  const visitorId = getLocalVisitorId();

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

    for (const [key, value] of params) {
      if (key === 'ff_time') {
        timeOverride = value;
      } else if (key.startsWith('ff_')) {
        const flagPart = key.slice(3);

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

  const mergedFlagConfigs = useMemo(() => {
    const merged = { ...flagConfigs };

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
    return { ...base, ...urlOverrides };
  }, [mergedFlagConfigs, visitorId, urlOverrides, timeOverride]);

  const isEnabled = useCallback(
    (flag: string) => flags[flag] || false,
    [flags],
  );

  const refresh = useCallback(() => {
    const cached = readCache(cacheTtlMs);
    if (cached) {
      setFlagConfigs(cached);
      return;
    }
    fetchRuntimeFlags(apiEndpoint).then((next) => {
      if (next) {
        writeCache(next);
        setFlagConfigs(next);
      }
    });
  }, [apiEndpoint, cacheTtlMs]);

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
      {children}
    </FeatureFlagsContext.Provider>
  );
}
