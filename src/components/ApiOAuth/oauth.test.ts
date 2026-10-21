import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  allSupportedScopes,
  forgetSignIn,
  isOAuthEligiblePath,
  isPlaceholderServerUrl,
  refreshSignIn as refreshSignInWithId,
  rememberSignedIn,
  signInState,
  signInWithGlean,
  type SignInResult,
} from './oauth';

const SESSION_STORE = 'api-explorer-oauth-signed-in';
const CLIENT_ID_STORE = 'api-explorer-oauth-clients';
const SERVER = 'https://acme-be.glean.com';
const TOKEN_ENDPOINT = `${SERVER}/oauth/token`;

const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: vi.fn().mockResolvedValue(body),
});

const signIn = (overrides: Partial<SignInResult> = {}): SignInResult => ({
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  expiresAt: Date.now() + 60 * 60 * 1000,
  clientId: 'explorer-client',
  tokenEndpoint: TOKEN_ENDPOINT,
  ...overrides,
});

const storedSession = () =>
  JSON.parse(localStorage.getItem(SESSION_STORE) ?? 'null');

/** Refresh as a tab holding `token` from the sign-in stored right now,
 * unless the test names another sign-in. */
const refreshSignIn = (
  serverUrl: string,
  token: string,
  sessionId: string = storedSession()?.id ?? 'no-sign-in',
) => refreshSignInWithId(serverUrl, token, sessionId);

/** Store a session as it looks after a refresh replaced `access-1`. */
const storeRefreshedSession = (overrides: Partial<SignInResult> = {}) =>
  localStorage.setItem(
    SESSION_STORE,
    JSON.stringify({
      ...signIn({
        accessToken: 'access-2',
        refreshToken: 'refresh-2',
        ...overrides,
      }),
      serverUrl: SERVER,
      id: 'sign-in-1',
      generation: 1,
      previousAccessToken: 'access-1',
    }),
  );

/** A promise the test resolves when it chooses. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

/** A Web Locks stand-in: runs callbacks for the same name one at a time. */
function stubLocks() {
  const queues = new Map<string, Promise<unknown>>();
  vi.stubGlobal('navigator', {
    ...navigator,
    locks: {
      request: (name: string, callback: () => Promise<unknown>) => {
        const run = (queues.get(name) ?? Promise.resolve()).then(callback);
        queues.set(
          name,
          run.catch(() => undefined),
        );
        return run;
      },
    },
  });
}

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('API Explorer OAuth helpers', () => {
  it('offers OAuth on Client and Platform API pages, not Indexing', () => {
    expect(isOAuthEligiblePath('/api/client-api/search/search')).toBe(true);
    expect(
      isOAuthEligiblePath('/api/platform-api/platform-agents-create-run'),
    ).toBe(true);
    expect(isOAuthEligiblePath('/api/indexing-api/index-document')).toBe(false);
    expect(isOAuthEligiblePath('/libraries/web-sdk/overview')).toBe(false);
  });

  it('requests every scope advertised by the authorization server', () => {
    expect(allSupportedScopes(['openid', 'search', 'chat', 'agents'])).toBe(
      'openid search chat agents',
    );
  });

  it('fails rather than silently requesting an under-scoped token', () => {
    expect(() => allSupportedScopes(undefined)).toThrow(
      'This server does not advertise any supported OAuth scopes.',
    );
    expect(() => allSupportedScopes([])).toThrow(
      'This server does not advertise any supported OAuth scopes.',
    );
  });

  it('treats the explorer default host as a placeholder, including braces', () => {
    expect(isPlaceholderServerUrl('https://instance-name-be.glean.com')).toBe(
      true,
    );
    expect(isPlaceholderServerUrl('https://{instance-name}-be.glean.com')).toBe(
      true,
    );
    expect(isPlaceholderServerUrl('https://acme-be.glean.com')).toBe(false);
  });
});

describe('signInWithGlean', () => {
  const scopes = ['openid', 'search', 'chat', 'offline_access'];
  const metadata = {
    issuer: 'https://example-be.glean.com',
    authorization_endpoint: 'https://example-be.glean.com/oauth/authorize',
    token_endpoint: 'https://example-be.glean.com/oauth/token',
    registration_endpoint: 'https://example-be.glean.com/oauth/register',
    scopes_supported: scopes,
  };

  /** Run the flow, answering each request in order with `bodies`. */
  async function runSignIn(bodies: unknown[]) {
    const fetchMock = vi.fn();
    for (const body of bodies) {
      fetchMock.mockResolvedValueOnce(response(body));
    }
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('crypto', {
      getRandomValues: (bytes: Uint8Array) => bytes.fill(1),
      subtle: {
        digest: async () => new Uint8Array(32).fill(2).buffer,
      },
    });
    Object.defineProperty(window.location, 'origin', {
      configurable: true,
      value: 'https://developers.glean.com',
    });
    const popup = { closed: false } as Window;
    const open = vi.spyOn(window, 'open').mockReturnValue(popup);
    open.mockClear();

    const resultPromise = signInWithGlean('https://example-be.glean.com');

    await vi.waitFor(() => expect(open).toHaveBeenCalledOnce());
    const authorizationUrl = new URL(`${open.mock.calls[0][0]}`);
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          type: 'glean-oauth-callback',
          code: 'authorization-code',
          state: authorizationUrl.searchParams.get('state'),
        },
        origin: window.location.origin,
      }),
    );
    return { result: await resultPromise, fetchMock, authorizationUrl };
  }

  it('registers and authorizes with every advertised scope', async () => {
    const { result, fetchMock, authorizationUrl } = await runSignIn([
      metadata,
      { client_id: 'explorer-client' },
      { access_token: 'access-token' },
    ]);

    const requestedScope = scopes.join(' ');
    const registration = JSON.parse(`${fetchMock.mock.calls[1][1]?.body}`);
    expect(registration.scope).toBe(requestedScope);
    expect(authorizationUrl.searchParams.get('scope')).toBe(requestedScope);
    expect(result.accessToken).toBe('access-token');
  });

  it('registers for the refresh_token grant and returns the refresh token', async () => {
    const before = Date.now();
    const { result, fetchMock } = await runSignIn([
      metadata,
      { client_id: 'explorer-client' },
      {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
      },
    ]);

    const registration = JSON.parse(`${fetchMock.mock.calls[1][1]?.body}`);
    expect(registration.grant_types).toEqual([
      'authorization_code',
      'refresh_token',
    ]);
    expect(result).toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      clientId: 'explorer-client',
      tokenEndpoint: metadata.token_endpoint,
    });
    expect(result.expiresAt).toBeGreaterThanOrEqual(before + 3600 * 1000);
  });

  it('registers again when the cached client lacks the refresh_token grant', async () => {
    localStorage.setItem(
      CLIENT_ID_STORE,
      JSON.stringify({
        [metadata.issuer]: { clientId: 'old-client', scope: scopes.join(' ') },
      }),
    );

    const { result, fetchMock } = await runSignIn([
      metadata,
      { client_id: 'new-client' },
      { access_token: 'access-token' },
    ]);

    expect(fetchMock.mock.calls[1][0]).toBe(metadata.registration_endpoint);
    expect(result.clientId).toBe('new-client');
  });

  it('reuses a cached client that has the refresh_token grant', async () => {
    localStorage.setItem(
      CLIENT_ID_STORE,
      JSON.stringify({
        [metadata.issuer]: {
          clientId: 'cached-client',
          scope: scopes.join(' '),
          grantTypes: ['authorization_code', 'refresh_token'],
        },
      }),
    );

    const { result, fetchMock } = await runSignIn([
      metadata,
      { access_token: 'access-token' },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.clientId).toBe('cached-client');
  });
});

describe('signInState', () => {
  it('recognizes the signed-in token from what is in localStorage', async () => {
    rememberSignedIn(`${SERVER}/`, signIn());

    expect(storedSession()).toMatchObject({
      serverUrl: SERVER,
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
    });
    // A fresh module instance stands in for a reload.
    vi.resetModules();
    const reloaded = await import('./oauth');
    expect(reloaded.signInState(SERVER, 'access-1')).toBe('signed-in');
  });

  it('drops the signed-in state for a pasted token or a different server', () => {
    rememberSignedIn(SERVER, signIn());

    expect(signInState(SERVER, 'pasted-token')).toBe('signed-out');
    expect(signInState('https://other-be.glean.com', 'access-1')).toBe(
      'signed-out',
    );
    expect(signInState(SERVER, undefined)).toBe('signed-out');
  });

  it('reports an expired token as expired, not signed in', () => {
    const expiresAt = Date.now() + 1000;
    rememberSignedIn(SERVER, signIn({ expiresAt }));

    expect(signInState(SERVER, 'access-1', expiresAt - 1)).toBe('signed-in');
    expect(signInState(SERVER, 'access-1', expiresAt)).toBe('expired');
  });

  it('ignores a record written before refresh support', () => {
    localStorage.setItem(
      SESSION_STORE,
      JSON.stringify({ serverUrl: SERVER, tokenFingerprint: 'abc123' }),
    );

    expect(signInState(SERVER, 'access-1')).toBe('signed-out');
  });
});

describe('forgetSignIn', () => {
  it('deletes the stored sign-in and its refresh token', () => {
    rememberSignedIn(SERVER, signIn());

    forgetSignIn('access-1');

    expect(localStorage.getItem(SESSION_STORE)).toBeNull();
  });

  it('keeps a newer sign-in made in another tab', () => {
    rememberSignedIn(SERVER, signIn());
    rememberSignedIn(SERVER, signIn({ accessToken: 'access-9' }));

    forgetSignIn('access-1');

    expect(signInState(SERVER, 'access-9')).toBe('signed-in');
  });
});

describe('refreshSignIn', () => {
  it('exchanges the refresh token and stores the rotated tokens', async () => {
    rememberSignedIn(SERVER, signIn());
    const fetchMock = vi.fn().mockResolvedValue(
      response({
        access_token: 'access-2',
        refresh_token: 'refresh-2',
        expires_in: 3600,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(refreshSignIn(SERVER, 'access-1')).resolves.toBe('access-2');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(TOKEN_ENDPOINT);
    expect(Object.fromEntries(init.body as URLSearchParams)).toEqual({
      grant_type: 'refresh_token',
      client_id: 'explorer-client',
      refresh_token: 'refresh-1',
    });
    expect(storedSession()).toMatchObject({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
    });
    expect(signInState(SERVER, 'access-2')).toBe('signed-in');
  });

  it('keeps the refresh token when the server does not rotate it', async () => {
    rememberSignedIn(SERVER, signIn());
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response({ access_token: 'access-2' })),
    );

    await refreshSignIn(SERVER, 'access-1');

    expect(storedSession().refreshToken).toBe('refresh-1');
  });

  it('forgets a refresh token the server rejects', async () => {
    rememberSignedIn(SERVER, signIn());
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response({ error: 'invalid_grant' }, 400));
    vi.stubGlobal('fetch', fetchMock);

    await expect(refreshSignIn(SERVER, 'access-1')).resolves.toBeNull();
    expect(storedSession().refreshToken).toBeUndefined();
    await expect(refreshSignIn(SERVER, 'access-1')).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('keeps the refresh token after a network error', async () => {
    rememberSignedIn(SERVER, signIn());
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    await expect(refreshSignIn(SERVER, 'access-1')).rejects.toThrow('offline');
    expect(storedSession().refreshToken).toBe('refresh-1');
  });

  it('does not refresh a token it did not issue for this server', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(refreshSignIn(SERVER, 'pasted-token')).resolves.toBeNull();
    rememberSignedIn(SERVER, signIn());
    await expect(
      refreshSignIn('https://other-be.glean.com', 'access-1'),
    ).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('records the token a refresh replaced', async () => {
    rememberSignedIn(SERVER, signIn());
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response({ access_token: 'access-2' })),
    );

    await refreshSignIn(SERVER, 'access-1');

    expect(storedSession().previousAccessToken).toBe('access-1');
    // A page that closed mid-refresh still holds the old token.
    expect(signInState(SERVER, 'access-1')).toBe('signed-in');
  });

  it('picks up the token another tab already refreshed', async () => {
    storeRefreshedSession();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(refreshSignIn(SERVER, 'access-1')).resolves.toBe('access-2');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refreshes again when the token another tab stored has expired', async () => {
    storeRefreshedSession({ expiresAt: Date.now() - 1000 });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response({ access_token: 'access-3' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(refreshSignIn(SERVER, 'access-1')).resolves.toBe('access-3');
    expect(
      Object.fromEntries(fetchMock.mock.calls[0][1].body as URLSearchParams)
        .refresh_token,
    ).toBe('refresh-2');
  });

  it('does not hand a token from an older sign-in the newer one', async () => {
    rememberSignedIn(SERVER, signIn({ accessToken: 'access-9' }));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      refreshSignIn(SERVER, 'access-1', 'older-sign-in'),
    ).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('catches up a tab that missed several refreshes', async () => {
    rememberSignedIn(SERVER, signIn());
    const sessionId = storedSession().id;
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          response({ access_token: 'access-2', refresh_token: 'refresh-2' }),
        )
        .mockResolvedValueOnce(
          response({ access_token: 'access-3', refresh_token: 'refresh-3' }),
        ),
    );
    await refreshSignIn(SERVER, 'access-1');
    await refreshSignIn(SERVER, 'access-2');

    await expect(refreshSignIn(SERVER, 'access-1', sessionId)).resolves.toBe(
      'access-3',
    );
  });

  it('does not overwrite a sign-in that finished during the refresh', async () => {
    rememberSignedIn(SERVER, signIn());
    const pending = deferred<unknown>();
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pending.promise));

    const result = refreshSignIn(SERVER, 'access-1');
    await Promise.resolve();
    rememberSignedIn(
      SERVER,
      signIn({ accessToken: 'access-9', refreshToken: 'refresh-9' }),
    );
    pending.resolve(response({ access_token: 'access-2' }));

    await expect(result).resolves.toBeNull();
    expect(storedSession()).toMatchObject({
      accessToken: 'access-9',
      refreshToken: 'refresh-9',
    });
  });

  it('without Web Locks, a rejected duplicate refresh keeps the rotated token', async () => {
    rememberSignedIn(SERVER, signIn());
    const first = deferred<unknown>();
    const second = deferred<unknown>();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise),
    );

    const tabA = refreshSignIn(SERVER, 'access-1');
    const tabB = refreshSignIn(SERVER, 'access-1');
    first.resolve(
      response({ access_token: 'access-2', refresh_token: 'refresh-2' }),
    );
    await expect(tabA).resolves.toBe('access-2');
    second.resolve(response({ error: 'invalid_grant' }, 400));

    await expect(tabB).resolves.toBe('access-2');
    expect(storedSession()).toMatchObject({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
    });
  });

  it('without Web Locks, a rejection arriving first does not lose the rotated token', async () => {
    rememberSignedIn(SERVER, signIn());
    const first = deferred<unknown>();
    const second = deferred<unknown>();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise),
    );

    const tabA = refreshSignIn(SERVER, 'access-1');
    const tabB = refreshSignIn(SERVER, 'access-1');
    second.resolve(response({ error: 'invalid_grant' }, 400));
    await expect(tabB).resolves.toBeNull();
    first.resolve(
      response({ access_token: 'access-2', refresh_token: 'refresh-2' }),
    );

    await expect(tabA).resolves.toBe('access-2');
    expect(storedSession()).toMatchObject({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
    });
  });

  it('spends the refresh token once when two tabs refresh together', async () => {
    stubLocks();
    rememberSignedIn(SERVER, signIn());
    const fetchMock = vi.fn().mockResolvedValue(
      response({
        access_token: 'access-2',
        refresh_token: 'refresh-2',
        expires_in: 3600,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const results = await Promise.all([
      refreshSignIn(SERVER, 'access-1'),
      refreshSignIn(SERVER, 'access-1'),
    ]);

    expect(results).toEqual(['access-2', 'access-2']);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
