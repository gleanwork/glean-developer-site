import { describe, expect, it, vi } from 'vitest';
import {
  createTenantProfileStore,
  OPENAPI_API_TOKEN_STORAGE_KEY,
  OPENAPI_SERVER_STORAGE_KEY,
  normalizeOpenApiServerOption,
  personalizeApiUrlPlaceholders,
  personalizeApiUrlTextChildren,
  resolveOpenApiServerUrl,
  tenantApiUrlMatches,
  TENANT_PROFILE_STORAGE_KEY,
} from './tenantProfile';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  readonly failures = new Set<'get' | 'set' | 'remove'>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    if (this.failures.has('get')) throw new Error('get unavailable');
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    if (this.failures.has('remove')) throw new Error('remove unavailable');
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    if (this.failures.has('set')) throw new Error('set unavailable');
    this.values.set(key, value);
  }
}

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function knownTenant(queryURL = 'https://acme-be.glean.com/') {
  return {
    search_config: {
      queryURL,
      centralURL: 'https://apps-be.glean.com/',
      isMultiTenant: false,
    },
  };
}

describe('tenant profile discovery', () => {
  it('sends only the normalized email domain and persists the authoritative queryURL', async () => {
    const storage = new MemoryStorage();
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(knownTenant()));
    const store = createTenantProfileStore({
      fetch: fetchImpl,
      storage,
      origin: 'https://developers.glean.com',
      now: () => 123,
    });

    const result = await store.discover('  Person@Acme.COM ');

    expect(result).toEqual({
      kind: 'configured',
      profile: {
        apiUrl: 'https://acme-be.glean.com',
        source: 'discovered',
        updatedAt: 123,
      },
      persistence: 'stored',
    });
    const [, init] = fetchImpl.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      emailDomain: 'acme.com',
      isGleanApp: true,
    });
    expect(init.credentials).toBe('omit');
    expect(storage.getItem(TENANT_PROFILE_STORAGE_KEY)).not.toContain(
      'Person',
    );
    expect(storage.getItem(TENANT_PROFILE_STORAGE_KEY)).not.toContain(
      'acme.com',
    );
    expect(
      resolveOpenApiServerUrl(
        JSON.parse(storage.getItem(OPENAPI_SERVER_STORAGE_KEY)!),
      ),
    ).toBe('https://acme-be.glean.com');
  });

  it('uses a returned custom domain without deriving a Glean hostname', async () => {
    const store = createTenantProfileStore({
      fetch: vi
        .fn()
        .mockResolvedValue(
          jsonResponse(knownTenant('https://knowledge.example.org/')),
        ),
      storage: new MemoryStorage(),
      origin: 'https://developers.glean.com',
    });

    const result = await store.discover('person@example.org');

    expect(result.kind).toBe('configured');
    if (result.kind === 'configured') {
      expect(result.profile.apiUrl).toBe('https://knowledge.example.org');
    }
  });

  it('rejects the unknown-domain central fallback', async () => {
    const store = createTenantProfileStore({
      fetch: vi.fn().mockResolvedValue(
        jsonResponse({
          search_config: {
            queryURL: 'https://apps-be.glean.com/',
            centralURL: 'https://apps-be.glean.com/',
            isMultiTenant: false,
          },
        }),
      ),
      storage: new MemoryStorage(),
      origin: 'https://developers.glean.com',
    });

    expect(await store.discover('person@unknown.invalid')).toEqual({
      kind: 'error',
      reason: 'not-found',
      previous: undefined,
    });
  });

  it('accepts a real multi-tenant result on the central origin', async () => {
    const store = createTenantProfileStore({
      fetch: vi.fn().mockResolvedValue(
        jsonResponse({
          search_config: {
            queryURL: 'https://apps-be.glean.com/',
            centralURL: 'https://apps-be.glean.com/',
            isMultiTenant: true,
          },
        }),
      ),
      storage: new MemoryStorage(),
      origin: 'https://developers.glean.com',
    });

    const result = await store.discover('person@shared.example');
    expect(result.kind).toBe('configured');
    if (result.kind === 'configured') {
      expect(result.profile.apiUrl).toBe('https://apps-be.glean.com');
    }
  });

  it('rejects malformed email locally and skips known unsupported localhost', async () => {
    const fetchImpl = vi.fn();
    const invalidStore = createTenantProfileStore({
      fetch: fetchImpl,
      storage: new MemoryStorage(),
      origin: 'https://developers.glean.com',
    });
    expect(await invalidStore.discover('not-an-email')).toMatchObject({
      kind: 'error',
      reason: 'invalid-email',
    });

    const localStore = createTenantProfileStore({
      fetch: fetchImpl,
      storage: new MemoryStorage(),
      origin: 'http://localhost:3000',
    });
    expect(await localStore.discover('person@acme.com')).toMatchObject({
      kind: 'error',
      reason: 'unsupported-origin',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('allows an explicitly opted-in local discovery harness', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(knownTenant()));
    const store = createTenantProfileStore({
      fetch: fetchImpl,
      storage: new MemoryStorage(),
      origin: 'http://localhost:8891',
      allowLocalDiscovery: true,
    });

    expect(await store.discover('person@acme.com')).toMatchObject({
      kind: 'configured',
      profile: { apiUrl: 'https://acme-be.glean.com' },
    });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('preserves a configured profile when a replacement lookup fails', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(knownTenant()))
      .mockResolvedValueOnce(jsonResponse({}, false));
    const store = createTenantProfileStore({
      fetch: fetchImpl,
      storage: new MemoryStorage(),
      origin: 'https://developers.glean.com',
    });
    await store.discover('person@acme.com');

    const result = await store.discover('person@other.com');

    expect(result).toMatchObject({
      kind: 'error',
      reason: 'network',
      previous: { apiUrl: 'https://acme-be.glean.com' },
    });
  });

  it('discards an older lookup response after a newer manual configuration', async () => {
    let resolveFetch!: (response: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const store = createTenantProfileStore({
      fetch: vi.fn().mockReturnValue(pending),
      storage: new MemoryStorage(),
      origin: 'https://developers.glean.com',
      now: () => 10,
    });

    const lookup = store.discover('person@acme.com');
    store.setManualApiUrl('https://manual.example.com');
    resolveFetch(jsonResponse(knownTenant()));
    await lookup;

    expect(store.getSnapshot()).toMatchObject({
      kind: 'configured',
      profile: { apiUrl: 'https://manual.example.com', source: 'manual' },
    });
  });
});

describe('tenant profile persistence', () => {
  it('migrates a valid existing OpenAPI server value', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      OPENAPI_SERVER_STORAGE_KEY,
      JSON.stringify({
        url: '{serverUrl}',
        variables: {
          serverUrl: { default: 'https://legacy.example.com/' },
        },
      }),
    );
    const store = createTenantProfileStore({
      storage,
      origin: 'https://developers.glean.com',
      now: () => 55,
    });

    expect(store.getSnapshot()).toEqual({
      kind: 'configured',
      profile: {
        apiUrl: 'https://legacy.example.com',
        source: 'manual',
        updatedAt: 55,
      },
      persistence: 'stored',
    });
  });

  it('does not migrate a placeholder OpenAPI server value', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      OPENAPI_SERVER_STORAGE_KEY,
      JSON.stringify({
        url: '{serverUrl}',
        variables: {
          serverUrl: {
            default: 'https://instance-name-be.glean.com',
          },
        },
      }),
    );
    const store = createTenantProfileStore({ storage });

    expect(store.getSnapshot()).toEqual({ kind: 'unconfigured' });
  });

  it('clears tenant-bound tokens when the URL changes or is cleared', () => {
    const storage = new MemoryStorage();
    const store = createTenantProfileStore({ storage, now: () => 1 });
    store.setManualApiUrl('https://one.example.com');
    storage.setItem(
      OPENAPI_API_TOKEN_STORAGE_KEY,
      JSON.stringify({ token: 'secret' }),
    );

    store.setManualApiUrl('https://two.example.com');
    expect(storage.getItem(OPENAPI_API_TOKEN_STORAGE_KEY)).toBeNull();

    storage.setItem(
      OPENAPI_API_TOKEN_STORAGE_KEY,
      JSON.stringify({ token: 'secret' }),
    );
    store.clear();
    expect(storage.getItem(OPENAPI_API_TOKEN_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(TENANT_PROFILE_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(OPENAPI_SERVER_STORAGE_KEY)).toBeNull();
  });

  it('degrades to a memory-only profile when persistence fails', () => {
    const storage = new MemoryStorage();
    storage.failures.add('set');
    const store = createTenantProfileStore({ storage, now: () => 1 });

    expect(store.setManualApiUrl('https://acme.example.com')).toEqual({
      kind: 'configured',
      profile: {
        apiUrl: 'https://acme.example.com',
        source: 'manual',
        updatedAt: 1,
      },
      persistence: 'memory-only',
    });
  });

  it('synchronizes relevant cross-tab profile updates only', () => {
    const storage = new MemoryStorage();
    let onStorage!: (event: { key: string | null; newValue: string | null }) => void;
    const store = createTenantProfileStore({
      storage,
      addStorageListener(listener) {
        onStorage = listener;
        return () => {};
      },
    });
    const listener = vi.fn();
    store.subscribe(listener);

    onStorage({ key: 'unrelated', newValue: null });
    expect(listener).not.toHaveBeenCalled();

    onStorage({
      key: TENANT_PROFILE_STORAGE_KEY,
      newValue: JSON.stringify({
        version: 1,
        apiUrl: 'https://other.example.com',
        source: 'discovered',
        updatedAt: 99,
      }),
    });
    expect(store.getSnapshot()).toMatchObject({
      kind: 'configured',
      profile: { apiUrl: 'https://other.example.com' },
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('OpenAPI server personalization', () => {
  it('normalizes legacy instance variables only for the enabled adapter', () => {
    expect(
      normalizeOpenApiServerOption(
        {
          url: 'https://{instance}-be.glean.com',
          variables: {
            instance: {
              default: 'instance-name',
              description: 'Legacy instance name',
            },
          },
        },
        'https://custom.example.com',
      ),
    ).toMatchObject({
      url: '{serverUrl}',
      variables: {
        serverUrl: { default: 'https://custom.example.com' },
      },
    });
  });

  it('preserves already canonical server options', () => {
    const server = {
      url: '{serverUrl}',
      variables: { serverUrl: { default: 'https://existing.example.com' } },
    };
    expect(
      normalizeOpenApiServerOption(server, 'https://custom.example.com'),
    ).toBe(server);
  });
});

describe('API URL placeholder personalization', () => {
  it('replaces approved origins while preserving paths and unrelated URLs', () => {
    const source = [
      'curl https://instance-name-be.glean.com/api/search',
      'curl https://<instance>-be.glean.com/rest/api/v1/search',
      'docs https://example.com/instance-name-be.glean.com',
    ].join('\n');

    expect(
      personalizeApiUrlPlaceholders(source, 'https://custom.example.org'),
    ).toBe(
      [
        'curl https://custom.example.org/api/search',
        'curl https://custom.example.org/rest/api/v1/search',
        'docs https://example.com/instance-name-be.glean.com',
      ].join('\n'),
    );
  });

  it('personalizes arrays of textual children used by code renderers', () => {
    expect(
      personalizeApiUrlTextChildren(
        ['curl ', 'https://instance-name-be.glean.com/api/search'],
        'https://custom.example.org',
      ),
    ).toBe('curl https://custom.example.org/api/search');
  });

  it('detects stale OAuth completion after the configured tenant changes', () => {
    const tenantA = {
      kind: 'configured' as const,
      profile: {
        apiUrl: 'https://tenant-a.example.com',
        source: 'manual' as const,
        updatedAt: 1,
      },
      persistence: 'stored' as const,
    };
    expect(tenantApiUrlMatches(tenantA, 'https://tenant-a.example.com/')).toBe(
      true,
    );
    expect(tenantApiUrlMatches(tenantA, 'https://tenant-b.example.com')).toBe(
      false,
    );
    expect(
      tenantApiUrlMatches({ kind: 'unconfigured' }, 'https://tenant-a.example.com'),
    ).toBe(false);
  });

  it('leaves placeholders intact when no profile is configured', () => {
    const source = 'https://instance-name-be.glean.com/api/search';
    expect(personalizeApiUrlPlaceholders(source, undefined)).toBe(source);
  });
});
