import React, { type ReactNode, useSyncExternalStore } from 'react';

export const TENANT_PROFILE_STORAGE_KEY =
  'glean:developer:tenant-profile:v1';
export const OPENAPI_SERVER_STORAGE_KEY = 'server';
export const OPENAPI_API_TOKEN_STORAGE_KEY = 'APIToken';
const CONFIG_SEARCH_URL = 'https://app.glean.com/config/search';
const PLACEHOLDER_HOST = 'instance-name-be.glean.com';
const LOOKUP_TIMEOUT_MS = 10_000;

export interface TenantProfile {
  apiUrl: string;
  source: 'discovered' | 'manual';
  updatedAt: number;
}

export type TenantProfileErrorReason =
  | 'invalid-email'
  | 'invalid-url'
  | 'not-found'
  | 'network'
  | 'response'
  | 'unsupported-origin';

export type TenantProfileState =
  | { kind: 'unconfigured' }
  | { kind: 'resolving'; previous?: TenantProfile }
  | {
      kind: 'configured';
      profile: TenantProfile;
      persistence: 'stored' | 'memory-only';
    }
  | {
      kind: 'error';
      reason: TenantProfileErrorReason;
      previous?: TenantProfile;
    };

interface PersistedTenantProfileV1 extends TenantProfile {
  version: 1;
}

interface ConfigSearchResponse {
  search_config?: {
    queryURL?: unknown;
    centralURL?: unknown;
    isMultiTenant?: unknown;
  };
}

interface StorageEventLike {
  key: string | null;
  newValue: string | null;
}

interface TenantProfileDependencies {
  fetch?: typeof fetch;
  storage?: Storage;
  origin?: string;
  allowLocalDiscovery?: boolean;
  now?: () => number;
  addStorageListener?: (
    listener: (event: StorageEventLike) => void,
  ) => () => void;
}

export interface TenantProfileStore {
  getSnapshot(): TenantProfileState;
  getServerSnapshot(): TenantProfileState;
  subscribe(listener: () => void): () => void;
  discover(email: string): Promise<TenantProfileState>;
  setManualApiUrl(apiUrl: string): TenantProfileState;
  clear(): TenantProfileState;
}

const SERVER_SNAPSHOT: TenantProfileState = Object.freeze({
  kind: 'unconfigured',
});

function browserStorage(): Storage | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function browserOrigin(): string {
  return typeof window === 'undefined' ? '' : window.location.origin;
}

function browserFetch(): typeof fetch | undefined {
  return typeof window === 'undefined' ? undefined : window.fetch.bind(window);
}

function normalizeApiUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      (url.pathname && url.pathname !== '/')
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

/** `acme` from `https://acme-be.glean.com`. Undefined for custom or vanity hosts. */
export function instanceNameFromApiUrl(apiUrl: string): string | undefined {
  const origin = normalizeApiUrl(apiUrl);
  if (!origin) return undefined;
  try {
    const match = new URL(origin).hostname.match(/^([a-z0-9-]+)-be\.glean\.com$/i);
    return match?.[1];
  } catch {
    return undefined;
  }
}

function sameOrigin(left: unknown, right: unknown): boolean {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  try {
    return new URL(left).origin === new URL(right).origin;
  } catch {
    return false;
  }
}

function isPlaceholderApiUrl(apiUrl: string): boolean {
  return (
    apiUrl.includes(PLACEHOLDER_HOST) ||
    apiUrl.includes('{') ||
    apiUrl.includes('}')
  );
}

function parsePersistedProfile(raw: string | null): TenantProfile | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<PersistedTenantProfileV1>;
    const apiUrl =
      typeof value.apiUrl === 'string' ? normalizeApiUrl(value.apiUrl) : null;
    if (
      value.version !== 1 ||
      !apiUrl ||
      isPlaceholderApiUrl(apiUrl) ||
      (value.source !== 'discovered' && value.source !== 'manual') ||
      typeof value.updatedAt !== 'number'
    ) {
      return null;
    }
    return {
      apiUrl,
      source: value.source,
      updatedAt: value.updatedAt,
    };
  } catch {
    return null;
  }
}

export function resolveOpenApiServerUrl(server: unknown): string | null {
  if (!server || typeof server !== 'object') return null;
  const value = server as {
    url?: unknown;
    variables?: Record<string, { default?: unknown }>;
  };
  if (typeof value.url !== 'string') return null;
  let url = value.url;
  for (const [key, variable] of Object.entries(value.variables ?? {})) {
    if (typeof variable?.default === 'string') {
      url = url.replace(`{${key}}`, variable.default);
    }
  }
  return normalizeApiUrl(url);
}

export function normalizeOpenApiServerOption(
  server: any,
  apiUrl: string,
): any {
  if (!server?.variables?.instance || typeof server.url !== 'string') {
    return server;
  }

  const instance = server.variables.instance.default ?? 'instance-name';
  const resolved = server.url.replace('{instance}', instance);
  try {
    const { origin } = new URL(resolved);
    return {
      ...server,
      url: `{serverUrl}${resolved.slice(origin.length)}`,
      variables: {
        serverUrl: {
          default: apiUrl,
          description:
            'Your Glean API server URL. Glean-hosted and custom domains are supported.',
        },
      },
    };
  } catch {
    return server;
  }
}

function readLegacyOpenApiServer(storage: Storage): string | null {
  try {
    const raw = storage.getItem(OPENAPI_SERVER_STORAGE_KEY);
    if (!raw) return null;
    const server = JSON.parse(raw);
    const apiUrl = resolveOpenApiServerUrl(server);
    return apiUrl && !isPlaceholderApiUrl(apiUrl) ? apiUrl : null;
  } catch {
    return null;
  }
}

function openApiServerValue(apiUrl: string): string {
  return JSON.stringify({
    url: '{serverUrl}',
    variables: {
      serverUrl: {
        default: apiUrl,
        description: 'Your Glean API server URL.',
      },
    },
  });
}

function isUnsupportedLocalOrigin(origin: string): boolean {
  if (!origin) return false;
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

function browserAllowsLocalDiscovery(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    new URLSearchParams(window.location.search).get(
      'allowLocalTenantDiscovery',
    ) === '1'
  );
}

function emailDomain(email: string): string | null {
  const match = /^[^@\s]+@([^@\s]+\.[^@\s]+)$/.exec(email.trim());
  return match?.[1]?.toLowerCase() ?? null;
}

export function createTenantProfileStore(
  dependencies: TenantProfileDependencies = {},
): TenantProfileStore & { dispose(): void } {
  const listeners = new Set<() => void>();
  let state: TenantProfileState = SERVER_SNAPSHOT;
  let initialized = false;
  let generation = 0;
  let activeController: AbortController | undefined;
  let removeStorageListener: (() => void) | undefined;

  const getStorage = () => dependencies.storage ?? browserStorage();
  const getOrigin = () => dependencies.origin ?? browserOrigin();
  const getFetch = () => dependencies.fetch ?? browserFetch();
  const allowsLocalDiscovery = () =>
    dependencies.allowLocalDiscovery ?? browserAllowsLocalDiscovery();
  const now = dependencies.now ?? Date.now;

  const notify = () => {
    for (const listener of listeners) listener();
  };

  const configuredProfile = (): TenantProfile | undefined =>
    state.kind === 'configured'
      ? state.profile
      : state.kind === 'resolving' || state.kind === 'error'
        ? state.previous
        : undefined;

  const writeAdapters = (profile: TenantProfile): 'stored' | 'memory-only' => {
    const storage = getStorage();
    if (!storage) return 'memory-only';
    try {
      const persisted: PersistedTenantProfileV1 = { version: 1, ...profile };
      storage.setItem(TENANT_PROFILE_STORAGE_KEY, JSON.stringify(persisted));
      storage.setItem(
        OPENAPI_SERVER_STORAGE_KEY,
        openApiServerValue(profile.apiUrl),
      );
      return 'stored';
    } catch {
      return 'memory-only';
    }
  };

  const clearTenantBoundAdapters = () => {
    const storage = getStorage();
    if (!storage) return;
    try {
      storage.removeItem(OPENAPI_API_TOKEN_STORAGE_KEY);
    } catch {
      // Browser storage may be unavailable; the mounted explorer adapter also
      // clears its in-memory token when it observes the profile change.
    }
  };

  const commit = (profile: TenantProfile): TenantProfileState => {
    const previous = configuredProfile();
    if (previous?.apiUrl !== profile.apiUrl) clearTenantBoundAdapters();
    const persistence = writeAdapters(profile);
    state = { kind: 'configured', profile, persistence };
    notify();
    return state;
  };

  const initialize = () => {
    if (initialized) return;
    initialized = true;
    const storage = getStorage();
    if (!storage) return;

    let profile: TenantProfile | null = null;
    try {
      profile = parsePersistedProfile(
        storage.getItem(TENANT_PROFILE_STORAGE_KEY),
      );
    } catch {
      // Continue with in-memory, unconfigured state.
    }

    if (!profile) {
      const migratedUrl = readLegacyOpenApiServer(storage);
      if (migratedUrl) {
        profile = {
          apiUrl: migratedUrl,
          source: 'manual',
          updatedAt: now(),
        };
        writeAdapters(profile);
      }
    }

    if (profile) {
      state = { kind: 'configured', profile, persistence: 'stored' };
    }
  };

  const onStorage = (event: StorageEventLike) => {
    if (event.key !== TENANT_PROFILE_STORAGE_KEY) return;
    generation += 1;
    activeController?.abort();
    const profile = parsePersistedProfile(event.newValue);
    state = profile
      ? { kind: 'configured', profile, persistence: 'stored' }
      : SERVER_SNAPSHOT;
    notify();
  };

  const attachStorageListener = () => {
    if (removeStorageListener) return;
    if (dependencies.addStorageListener) {
      removeStorageListener = dependencies.addStorageListener(onStorage);
    } else if (typeof window !== 'undefined') {
      const listener = (event: StorageEvent) => onStorage(event);
      window.addEventListener('storage', listener);
      removeStorageListener = () =>
        window.removeEventListener('storage', listener);
    }
  };

  return {
    getSnapshot() {
      initialize();
      return state;
    },

    getServerSnapshot() {
      return SERVER_SNAPSHOT;
    },

    subscribe(listener) {
      initialize();
      attachStorageListener();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async discover(email) {
      initialize();
      const previous = configuredProfile();
      const domain = emailDomain(email);
      if (!domain) {
        state = { kind: 'error', reason: 'invalid-email', previous };
        notify();
        return state;
      }
      if (
        isUnsupportedLocalOrigin(getOrigin()) &&
        !allowsLocalDiscovery()
      ) {
        state = { kind: 'error', reason: 'unsupported-origin', previous };
        notify();
        return state;
      }

      const fetchImpl = getFetch();
      if (!fetchImpl) {
        state = { kind: 'error', reason: 'network', previous };
        notify();
        return state;
      }

      generation += 1;
      const requestGeneration = generation;
      activeController?.abort();
      const controller = new AbortController();
      activeController = controller;
      state = previous
        ? { kind: 'resolving', previous }
        : { kind: 'resolving' };
      notify();

      const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);
      try {
        const response = await fetchImpl(CONFIG_SEARCH_URL, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'omit',
          body: JSON.stringify({ emailDomain: domain, isGleanApp: true }),
          signal: controller.signal,
        });
        if (requestGeneration !== generation) return state;
        if (!response.ok) {
          state = { kind: 'error', reason: 'network', previous };
          notify();
          return state;
        }

        let data: ConfigSearchResponse;
        try {
          data = (await response.json()) as ConfigSearchResponse;
        } catch {
          state = { kind: 'error', reason: 'response', previous };
          notify();
          return state;
        }
        if (requestGeneration !== generation) return state;

        const config = data?.search_config;
        const queryUrl = config?.queryURL;
        if (
          typeof queryUrl !== 'string' ||
          (sameOrigin(queryUrl, config?.centralURL) &&
            config?.isMultiTenant !== true)
        ) {
          state = { kind: 'error', reason: 'not-found', previous };
          notify();
          return state;
        }
        const apiUrl = normalizeApiUrl(queryUrl);
        if (!apiUrl) {
          state = { kind: 'error', reason: 'response', previous };
          notify();
          return state;
        }
        return commit({ apiUrl, source: 'discovered', updatedAt: now() });
      } catch {
        if (requestGeneration !== generation) return state;
        state = { kind: 'error', reason: 'network', previous };
        notify();
        return state;
      } finally {
        clearTimeout(timeout);
        if (requestGeneration === generation) activeController = undefined;
      }
    },

    setManualApiUrl(value) {
      initialize();
      generation += 1;
      activeController?.abort();
      const previous = configuredProfile();
      const apiUrl = normalizeApiUrl(value);
      if (!apiUrl) {
        state = { kind: 'error', reason: 'invalid-url', previous };
        notify();
        return state;
      }
      return commit({ apiUrl, source: 'manual', updatedAt: now() });
    },

    clear() {
      initialize();
      generation += 1;
      activeController?.abort();
      const storage = getStorage();
      if (storage) {
        try {
          storage.removeItem(TENANT_PROFILE_STORAGE_KEY);
          storage.removeItem(OPENAPI_SERVER_STORAGE_KEY);
          storage.removeItem(OPENAPI_API_TOKEN_STORAGE_KEY);
        } catch {
          // The in-memory profile is still cleared for this tab.
        }
      }
      state = SERVER_SNAPSHOT;
      notify();
      return state;
    },

    dispose() {
      activeController?.abort();
      removeStorageListener?.();
      removeStorageListener = undefined;
      listeners.clear();
    },
  };
}

export const tenantProfileStore = createTenantProfileStore();

export function tenantApiUrlFromState(
  state: TenantProfileState,
): string | undefined {
  if (state.kind === 'configured') return state.profile.apiUrl;
  if (state.kind === 'resolving' || state.kind === 'error') {
    return state.previous?.apiUrl;
  }
  return undefined;
}

export function tenantApiUrlMatches(
  state: TenantProfileState,
  apiUrl: string,
): boolean {
  const normalized = normalizeApiUrl(apiUrl);
  return Boolean(normalized && tenantApiUrlFromState(state) === normalized);
}

export function useTenantProfile(): TenantProfileState {
  return useSyncExternalStore(
    tenantProfileStore.subscribe,
    tenantProfileStore.getSnapshot,
    tenantProfileStore.getServerSnapshot,
  );
}

export const API_URL_PLACEHOLDERS = [
  '{serverUrl}',
  'https://{instance-name}-be.glean.com',
  'https://instance-name-be.glean.com',
  'https://<instance>-be.glean.com',
  'https://your-instance-be.glean.com',
  'https://your-server-id-be.glean.com',
  'https://your-company-be.glean.com',
  'https://customer-be.glean.com',
  'https://mycompany-be.glean.com',
] as const;

export function personalizeApiUrlPlaceholders(
  source: string,
  apiUrl: string | undefined,
): string {
  const replacement = apiUrl ?? API_URL_PLACEHOLDERS[0];
  return API_URL_PLACEHOLDERS.reduce(
    (result, placeholder) => result.replaceAll(placeholder, replacement),
    source,
  );
}

export function personalizeApiUrlTextChildren(
  children: ReactNode,
  apiUrl: string | undefined,
): ReactNode {
  const parts = React.Children.toArray(children);
  if (!parts.every((part) => typeof part === 'string')) return children;
  return personalizeApiUrlPlaceholders(parts.join(''), apiUrl);
}
