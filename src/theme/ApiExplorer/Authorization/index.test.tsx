import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rememberSignedIn } from '@site/src/components/ApiOAuth/oauth';
import AuthorizationWrapper from './index';

const SERVER = 'https://acme-be.glean.com';

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

vi.mock('@theme/ApiItem/hooks', () => ({
  useTypedDispatch: () => vi.fn(),
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

const setToken = (token: string | undefined) => {
  explorerState.auth.data.BearerAuth.token = token;
};

const button = () => screen.getByRole('button');

beforeEach(() => {
  explorerState.server.value.url = SERVER;
  setToken(undefined);
});

afterEach(() => {
  localStorage.clear();
});

describe('Sign in with Glean', () => {
  it('stays signed in after a reload', () => {
    rememberSignedIn(SERVER, {
      accessToken: 'access-1',
      expiresAt: Date.now() + 60 * 60 * 1000,
    });
    setToken('access-1');

    render(<AuthorizationWrapper />);

    expect(button().textContent).toBe('Signed in ✓ — sign in again');
    expect(screen.getByText('OAuth token filled in below.')).toBeTruthy();
  });

  it('shows signed out for a pasted token', () => {
    rememberSignedIn(SERVER, { accessToken: 'access-1' });
    setToken('pasted-token');

    render(<AuthorizationWrapper />);

    expect(button().textContent).toBe('Sign in with Glean');
  });

  it('shows signed out after the Base URL changes', () => {
    rememberSignedIn(SERVER, { accessToken: 'access-1' });
    setToken('access-1');
    explorerState.server.value.url = 'https://other-be.glean.com';

    render(<AuthorizationWrapper />);

    expect(button().textContent).toBe('Sign in with Glean');
  });

  it('asks to sign in again once the token has expired', () => {
    rememberSignedIn(SERVER, {
      accessToken: 'access-1',
      expiresAt: Date.now() - 1000,
    });
    setToken('access-1');

    render(<AuthorizationWrapper />);

    expect(button().textContent).toBe('Sign in again');
    expect(
      screen.getByText('Your sign-in expired. Sign in again for a new token.'),
    ).toBeTruthy();
  });
});
