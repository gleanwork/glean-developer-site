import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  allSupportedScopes,
  isOAuthEligiblePath,
  isPlaceholderServerUrl,
  signInWithGlean,
} from './oauth';

const response = (body: unknown) => ({
  ok: true,
  json: vi.fn().mockResolvedValue(body),
});

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

  it('registers and authorizes with every advertised scope', async () => {
    const scopes = ['openid', 'search', 'chat', 'agents'];
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response({
          issuer: 'https://example-be.glean.com',
          authorization_endpoint:
            'https://example-be.glean.com/oauth/authorize',
          token_endpoint: 'https://example-be.glean.com/oauth/token',
          registration_endpoint: 'https://example-be.glean.com/oauth/register',
          scopes_supported: scopes,
        }),
      )
      .mockResolvedValueOnce(response({ client_id: 'explorer-client' }))
      .mockResolvedValueOnce(response({ access_token: 'access-token' }));
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

    const tokenPromise = signInWithGlean('https://example-be.glean.com');

    await vi.waitFor(() => expect(open).toHaveBeenCalledOnce());
    const requestedScope = scopes.join(' ');
    const registration = JSON.parse(
      `${fetchMock.mock.calls[1][1]?.body}`,
    ) as Record<string, unknown>;
    expect(registration.scope).toBe(requestedScope);

    const authorizationUrl = new URL(`${open.mock.calls[0][0]}`);
    expect(authorizationUrl.searchParams.get('scope')).toBe(requestedScope);
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

    await expect(tokenPromise).resolves.toBe('access-token');
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
