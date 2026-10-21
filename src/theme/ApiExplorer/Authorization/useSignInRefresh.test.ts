import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import {
  getSignInSession,
  refreshSignIn,
  rememberSignedIn,
} from '@site/src/components/ApiOAuth/oauth';
import { RETRY_MIN_MS, useSignInRefresh } from './useSignInRefresh';

const SERVER = 'https://acme-be.glean.com';
const SESSION_STORE = 'api-explorer-oauth-signed-in';
const WEEK_S = 7 * 24 * 60 * 60;

const response = (body: unknown, status = 200) => ({
  ok: status === 200,
  status,
  json: async () => body,
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

/** One tab: the explorer token plus the refresh hook that updates it. */
function useTab() {
  const [token, setToken] = useState('access-1');
  useSignInRefresh(SERVER, token, setToken);
  return token;
}

function signIn(expiresAt: number) {
  rememberSignedIn(SERVER, {
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    expiresAt,
    clientId: 'explorer-client',
    tokenEndpoint: `${SERVER}/oauth/token`,
  });
}

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('picks up another tab’s refresh after its own refresh was rejected', async () => {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  signIn(Date.now() + 2 * 60 * 1000);
  const sessionId = getSignInSession(SERVER)!.id;
  const tabA = deferred<unknown>();
  const tabB = deferred<unknown>();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockReturnValueOnce(tabA.promise).mockReturnValueOnce(tabB.promise),
  );

  // Without Web Locks both tabs send refresh-1. The server rejects tab B's
  // duplicate first, then tab A's rotation lands.
  const refreshA = refreshSignIn(SERVER, 'access-1', sessionId);
  const { result } = renderHook(useTab);
  await act(async () => {
    tabB.resolve(response({ error: 'invalid_grant' }, 400));
  });
  await act(async () => {
    tabA.resolve(
      response({
        access_token: 'access-2',
        refresh_token: 'refresh-2',
        expires_in: WEEK_S,
      }),
    );
    await refreshA;
  });
  await act(() => vi.advanceTimersByTimeAsync(2 * 60 * 1000));

  expect(result.current).toBe('access-2');
});

it('picks up another tab’s refresh of an expired token from a storage event', async () => {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  signIn(Date.now() - 1000);
  const sessionId = getSignInSession(SERVER)!.id;
  const tabA = deferred<unknown>();
  const tabB = deferred<unknown>();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockReturnValueOnce(tabA.promise).mockReturnValueOnce(tabB.promise),
  );

  // Without Web Locks both tabs send refresh-1 for the expired token. The
  // server rejects this tab's duplicate first, then tab A's rotation lands.
  const refreshA = refreshSignIn(SERVER, 'access-1', sessionId);
  const { result } = renderHook(useTab);
  await act(async () => {
    tabB.resolve(response({ error: 'invalid_grant' }, 400));
  });
  await act(async () => {
    tabA.resolve(
      response({
        access_token: 'access-2',
        refresh_token: 'refresh-2',
        expires_in: WEEK_S,
      }),
    );
    await refreshA;
  });
  expect(result.current).toBe('access-1');

  // The browser tells this tab that tab A wrote the session.
  await act(async () => {
    window.dispatchEvent(new StorageEvent('storage', { key: SESSION_STORE }));
  });

  expect(result.current).toBe('access-2');
});

it('retries after a network error while the tab stays visible', async () => {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  signIn(Date.now() + 60 * 1000);
  const fetchMock = vi
    .fn()
    .mockRejectedValueOnce(new TypeError('Failed to fetch'))
    .mockResolvedValueOnce(
      response({
        access_token: 'access-2',
        refresh_token: 'refresh-2',
        expires_in: WEEK_S,
      }),
    );
  vi.stubGlobal('fetch', fetchMock);

  const { result } = renderHook(useTab);
  await act(() => vi.advanceTimersByTimeAsync(0));
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(result.current).toBe('access-1');

  await act(() => vi.advanceTimersByTimeAsync(RETRY_MIN_MS));

  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(result.current).toBe('access-2');
});

it('retries at once when the browser comes back online', async () => {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  signIn(Date.now() + 60 * 1000);
  const fetchMock = vi
    .fn()
    .mockRejectedValueOnce(new TypeError('Failed to fetch'))
    .mockResolvedValueOnce(
      response({
        access_token: 'access-2',
        refresh_token: 'refresh-2',
        expires_in: WEEK_S,
      }),
    );
  vi.stubGlobal('fetch', fetchMock);

  const { result } = renderHook(useTab);
  await act(() => vi.advanceTimersByTimeAsync(0));
  expect(fetchMock).toHaveBeenCalledOnce();

  await act(async () => {
    window.dispatchEvent(new Event('online'));
  });

  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(result.current).toBe('access-2');
});

it('stops when another tab’s token expired and no refresh token is left', async () => {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  signIn(Date.now() + WEEK_S * 1000);
  const session = getSignInSession(SERVER)!;
  // Another tab refreshed to access-2; that token then expired and its
  // refresh was rejected, which cleared the refresh token.
  localStorage.setItem(
    SESSION_STORE,
    JSON.stringify({
      ...session,
      accessToken: 'access-2',
      refreshToken: undefined,
      expiresAt: Date.now() - 1000,
      generation: 1,
      previousAccessToken: 'access-1',
    }),
  );
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);

  const { result } = renderHook(useTab);
  await act(() => vi.advanceTimersByTimeAsync(0));

  expect(result.current).toBe('access-1');
  expect(fetchMock).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

it('schedules the next refresh after a successful one', async () => {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  const lifetimeMs = 10 * 60 * 1000;
  signIn(Date.now() + lifetimeMs);
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      response({
        access_token: 'access-2',
        refresh_token: 'refresh-2',
        expires_in: lifetimeMs / 1000,
      }),
    )
    .mockResolvedValueOnce(
      response({
        access_token: 'access-3',
        refresh_token: 'refresh-3',
        expires_in: lifetimeMs / 1000,
      }),
    );
  vi.stubGlobal('fetch', fetchMock);

  const { result } = renderHook(useTab);
  await act(() => vi.advanceTimersByTimeAsync(lifetimeMs));
  expect(result.current).toBe('access-2');

  await act(() => vi.advanceTimersByTimeAsync(lifetimeMs));

  expect(fetchMock).toHaveBeenCalledTimes(2);
  const secondBody = new URLSearchParams(`${fetchMock.mock.calls[1][1]?.body}`);
  expect(secondBody.get('refresh_token')).toBe('refresh-2');
  expect(result.current).toBe('access-3');
});

it('catches up when the tab is shown after missing several refreshes', async () => {
  signIn(Date.now() + WEEK_S * 1000);
  const { result } = renderHook(useTab);
  const session = getSignInSession(SERVER)!;
  localStorage.setItem(
    SESSION_STORE,
    JSON.stringify({
      ...session,
      accessToken: 'access-3',
      refreshToken: 'refresh-3',
      generation: 2,
      previousAccessToken: 'access-2',
    }),
  );
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);

  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  await act(async () => {
    document.dispatchEvent(new Event('visibilitychange'));
  });

  expect(result.current).toBe('access-3');
  expect(fetchMock).not.toHaveBeenCalled();
});
