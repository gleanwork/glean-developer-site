import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import {
  getSignInSession,
  refreshSignIn,
  rememberSignedIn,
} from '@site/src/components/ApiOAuth/oauth';
import { useSignInRefresh } from './useSignInRefresh';

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
