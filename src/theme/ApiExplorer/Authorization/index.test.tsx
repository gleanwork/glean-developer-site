import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  REFRESH_LEAD_MS,
  rememberSignedIn,
  type SignInResult,
} from '@site/src/components/ApiOAuth/oauth';
import AuthorizationWrapper from './index';

const SERVER = 'https://acme-be.glean.com';
const SESSION_STORE = 'api-explorer-oauth-signed-in';

const explorerState = {
  server: { value: { url: SERVER, variables: {} } },
  auth: {
    selected: 'BearerAuth',
    options: {
      BearerAuth: [{ key: 'BearerAuth', type: 'http', scheme: 'bearer' }],
    },
    data: { BearerAuth: { token: undefined as string | undefined } },
  },
};

const dispatchSpy = vi.hoisted(() => vi.fn());
const signInMock = vi.hoisted(() => vi.fn());

vi.mock('@site/src/components/ApiOAuth/oauth', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@site/src/components/ApiOAuth/oauth')
  >()),
  signInWithGlean: signInMock,
}));

vi.mock('@theme/ApiItem/hooks', () => ({
  useTypedDispatch: () => dispatchSpy,
  useTypedSelector: (selector: (state: typeof explorerState) => unknown) =>
    selector(explorerState),
}));

vi.mock('@theme/ApiExplorer/Authorization/slice', () => ({
  setAuthData: (payload: unknown) => ({ type: 'auth/setAuthData', payload }),
}));

vi.mock('@theme-original/ApiExplorer/Authorization', () => ({
  default: () => null,
}));

vi.mock('@docusaurus/router', () => ({
  useLocation: () => ({ pathname: '/api/client-api/search/search' }),
}));

vi.mock('@site/src/lib/tenantPersonalizationFlag', () => ({
  useTenantApiPersonalizationEnabled: () => false,
}));

const signIn = (overrides: Partial<SignInResult> = {}): SignInResult => ({
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  expiresAt: Date.now() + 60 * 60 * 1000,
  clientId: 'explorer-client',
  tokenEndpoint: `${SERVER}/oauth/token`,
  ...overrides,
});

const refreshed = () => ({
  ok: true,
  status: 200,
  json: vi.fn().mockResolvedValue({
    access_token: 'access-2',
    refresh_token: 'refresh-2',
    expires_in: 3600,
  }),
});

const setToken = (token: string | undefined) => {
  explorerState.auth.data.BearerAuth.token = token;
};

const button = () => screen.getByRole('button');

beforeEach(() => {
  dispatchSpy.mockClear();
  signInMock.mockReset();
  explorerState.server.value.url = SERVER;
  setToken(undefined);
});

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Sign in with Glean', () => {
  it('remembers a new sign-in, so it survives a reload', async () => {
    signInMock.mockResolvedValue(signIn());
    const { unmount } = render(<AuthorizationWrapper />);

    fireEvent.click(button());
    await waitFor(() =>
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { scheme: 'BearerAuth', key: 'token', value: 'access-1' },
        }),
      ),
    );
    unmount();

    // After a reload the explorer restores its own persisted token.
    setToken('access-1');
    render(<AuthorizationWrapper />);

    expect(button().textContent).toBe('Signed in ✓ — sign in again');
  });

  it('stays signed in after a reload', () => {
    rememberSignedIn(SERVER, signIn());
    setToken('access-1');

    render(<AuthorizationWrapper />);

    expect(button().textContent).toBe('Signed in ✓ — sign in again');
    expect(screen.getByText('OAuth token filled in below.')).toBeTruthy();
  });

  it('shows signed out for a pasted token', () => {
    rememberSignedIn(SERVER, signIn());
    setToken('pasted-token');

    render(<AuthorizationWrapper />);

    expect(button().textContent).toBe('Sign in with Glean');
  });

  it('shows signed out after the Base URL changes', () => {
    rememberSignedIn(SERVER, signIn());
    setToken('access-1');
    explorerState.server.value.url = 'https://other-be.glean.com';

    render(<AuthorizationWrapper />);

    expect(button().textContent).toBe('Sign in with Glean');
  });

  it('asks to sign in again when the token expired and cannot be refreshed', () => {
    rememberSignedIn(
      SERVER,
      signIn({ refreshToken: undefined, expiresAt: Date.now() - 1000 }),
    );
    setToken('access-1');

    render(<AuthorizationWrapper />);

    expect(button().textContent).toBe('Sign in again');
    expect(
      screen.getByText('Your sign-in expired. Sign in again for a new token.'),
    ).toBeTruthy();
  });

  it('refreshes an expired token on load and fills in the new one', async () => {
    rememberSignedIn(SERVER, signIn({ expiresAt: Date.now() - 1000 }));
    setToken('access-1');
    const fetchMock = vi.fn().mockResolvedValue(refreshed());
    vi.stubGlobal('fetch', fetchMock);

    render(<AuthorizationWrapper />);

    await waitFor(() =>
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { scheme: 'BearerAuth', key: 'token', value: 'access-2' },
        }),
      ),
    );
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('refreshes shortly before the token expires', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const expiresAt = Date.now() + 10 * 60 * 1000;
    rememberSignedIn(SERVER, signIn({ expiresAt }));
    setToken('access-1');
    const fetchMock = vi.fn().mockResolvedValue(refreshed());
    vi.stubGlobal('fetch', fetchMock);

    render(<AuthorizationWrapper />);
    await act(() =>
      vi.advanceTimersByTimeAsync(10 * 60 * 1000 - REFRESH_LEAD_MS - 1000),
    );
    expect(fetchMock).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { scheme: 'BearerAuth', key: 'token', value: 'access-2' },
      }),
    );
  });

  it('shows the expired state when the token runs out without a refresh token', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    rememberSignedIn(
      SERVER,
      signIn({ refreshToken: undefined, expiresAt: Date.now() + 60 * 1000 }),
    );
    setToken('access-1');

    render(<AuthorizationWrapper />);
    expect(button().textContent).toBe('Signed in ✓ — sign in again');

    await act(() => vi.advanceTimersByTimeAsync(60 * 1000));
    expect(button().textContent).toBe('Sign in again');
  });

  it('picks up a token refreshed after this page closed', async () => {
    localStorage.setItem(
      'api-explorer-oauth-signed-in',
      JSON.stringify({
        ...signIn({ accessToken: 'access-2', refreshToken: 'refresh-2' }),
        serverUrl: SERVER,
        id: 'sign-in-1',
        generation: 1,
        previousAccessToken: 'access-1',
      }),
    );
    setToken('access-1');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<AuthorizationWrapper />);

    await waitFor(() =>
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { scheme: 'BearerAuth', key: 'token', value: 'access-2' },
        }),
      ),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forgets the stored sign-in when the reader clears the token', () => {
    rememberSignedIn(SERVER, signIn());
    setToken('access-1');
    const { rerender } = render(<AuthorizationWrapper />);

    setToken(undefined);
    rerender(<AuthorizationWrapper />);

    expect(localStorage.getItem(SESSION_STORE)).toBeNull();
    expect(button().textContent).toBe('Sign in with Glean');
  });

  it('forgets the stored sign-in when the reader pastes another token', () => {
    rememberSignedIn(SERVER, signIn());
    setToken('access-1');
    const { rerender } = render(<AuthorizationWrapper />);

    setToken('pasted-token');
    rerender(<AuthorizationWrapper />);

    expect(localStorage.getItem(SESSION_STORE)).toBeNull();
  });

  it('forgets the stored sign-in when the token is cleared after a Base URL change', () => {
    rememberSignedIn(SERVER, signIn());
    setToken('access-1');
    const { rerender } = render(<AuthorizationWrapper />);

    explorerState.server.value.url = 'https://other-be.glean.com';
    rerender(<AuthorizationWrapper />);
    expect(localStorage.getItem(SESSION_STORE)).not.toBeNull();

    setToken(undefined);
    rerender(<AuthorizationWrapper />);

    expect(localStorage.getItem(SESSION_STORE)).toBeNull();
  });

  it('keeps the stored sign-in when the explorer fills in a refreshed token', () => {
    rememberSignedIn(SERVER, signIn());
    setToken('access-1');
    const { rerender } = render(<AuthorizationWrapper />);

    const stored = JSON.parse(localStorage.getItem(SESSION_STORE)!);
    localStorage.setItem(
      SESSION_STORE,
      JSON.stringify({
        ...stored,
        accessToken: 'access-2',
        refreshToken: 'refresh-2',
        previousAccessToken: 'access-1',
        generation: 1,
      }),
    );
    setToken('access-2');
    rerender(<AuthorizationWrapper />);

    expect(localStorage.getItem(SESSION_STORE)).not.toBeNull();
    expect(button().textContent).toBe('Signed in ✓ — sign in again');
  });

  it('keeps the stored sign-in while the explorer restores its token on load', () => {
    rememberSignedIn(SERVER, signIn());
    const { rerender } = render(<AuthorizationWrapper />);

    setToken('access-1');
    rerender(<AuthorizationWrapper />);

    expect(localStorage.getItem(SESSION_STORE)).not.toBeNull();
    expect(button().textContent).toBe('Signed in ✓ — sign in again');
  });

  it('does not refresh a pasted token', async () => {
    rememberSignedIn(SERVER, signIn({ expiresAt: Date.now() - 1000 }));
    setToken('pasted-token');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<AuthorizationWrapper />);
    await act(async () => {});

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
