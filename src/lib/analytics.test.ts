import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const trackSpy = vi.hoisted(() => vi.fn());
vi.mock('@vercel/analytics', () => ({ track: trackSpy }));

import {
  linkTarget,
  pageSection,
  redactEvent,
  referrerSource,
  routerPath,
  statusClass,
  trackCodeCopy,
  trackEvent,
} from './analytics';

describe('redactEvent', () => {
  it('drops the OAuth callback, whose URL carries an authorization code', () => {
    expect(
      redactEvent({
        type: 'pageview',
        url: 'https://developers.glean.com/oauth/callback?code=abc&state=xyz',
      }),
    ).toBeNull();
  });

  it('removes query parameters except UTM ones, and the fragment', () => {
    expect(
      redactEvent({
        type: 'pageview',
        url: 'https://developers.glean.com/cookbook/x?ff_recipe=x&utm_source=blog&email=a%40b.com#step-2',
      }),
    ).toEqual({
      type: 'pageview',
      url: 'https://developers.glean.com/cookbook/x?utm_source=blog',
    });
  });

  it('applies to custom events too', () => {
    expect(
      redactEvent({
        type: 'event',
        url: 'https://developers.glean.com/api/x?token=secret',
      }),
    ).toEqual({ type: 'event', url: 'https://developers.glean.com/api/x' });
  });

  it('drops events whose URL cannot be parsed', () => {
    expect(redactEvent({ type: 'pageview', url: 'not a url' })).toBeNull();
  });
});

describe('statusClass', () => {
  it.each([
    [200, '2xx'],
    [204, '2xx'],
    [401, '4xx'],
    [503, '5xx'],
    [undefined, 'network'],
    [0, 'network'],
    ['200', 'network'],
  ])('%s -> %s', (code, expected) => {
    expect(statusClass(code)).toBe(expected);
  });
});

describe('pageSection', () => {
  it.each([
    ['/', 'home'],
    ['/api/client-api/search/query', 'api'],
    ['/guides/mcp/cursor/', 'guides'],
  ])('%s -> %s', (pathname, expected) => {
    expect(pageSection(pathname)).toBe(expected);
  });
});

describe('linkTarget', () => {
  const origin = 'https://developers.glean.com';

  it('is the path for links on this site, without the query', () => {
    expect(linkTarget('/guides/mcp/cursor?ref=hero#setup', origin)).toBe(
      '/guides/mcp/cursor',
    );
    expect(linkTarget(`${origin}/api/platform-api`, origin)).toBe(
      '/api/platform-api',
    );
  });

  it('is the host for links to other sites', () => {
    expect(
      linkTarget('https://github.com/gleanwork/glean-cookbook?x=1', origin),
    ).toBe('github.com');
  });
});

describe('referrerSource', () => {
  it.each([
    ['', 'direct'],
    ['https://developers.glean.com/guides/', 'internal'],
    ['https://www.google.com/search?q=glean+api', 'www.google.com'],
    ['not a url', 'unknown'],
  ])('%s -> %s', (referrer, expected) => {
    expect(referrerSource(referrer, 'developers.glean.com')).toBe(expected);
  });
});

describe('pageReferrer', () => {
  const original = window.location;
  afterEach(() => {
    (window as { location: unknown }).location = original;
    vi.restoreAllMocks();
  });

  it('uses document.referrer only on the landing page', async () => {
    // The landing path is read when the module loads, so load a fresh copy
    // after setting the location.
    (window as { location: unknown }).location = {
      hostname: 'developers.glean.com',
      pathname: '/old-guide',
    };
    vi.resetModules();
    const fresh = await import('./analytics');
    vi.spyOn(document, 'referrer', 'get').mockReturnValue(
      'https://github.com/gleanwork/glean-cookbook',
    );

    expect(fresh.pageReferrer('/old-guide')).toBe('github.com');
    expect(fresh.pageReferrer('/missing-page')).toBe('internal');
  });

  it('matches an encoded landing path against the decoded router path', async () => {
    // The browser keeps `%20`; the router hands the component a space.
    (window as { location: unknown }).location = {
      hostname: 'developers.glean.com',
      pathname: '/guides/my%20page',
    };
    vi.resetModules();
    const fresh = await import('./analytics');
    vi.spyOn(document, 'referrer', 'get').mockReturnValue(
      'https://github.com/gleanwork/glean-cookbook',
    );

    expect(fresh.pageReferrer('/guides/my page')).toBe('github.com');
  });
});

describe('routerPath', () => {
  it('decodes a path the way the router does', () => {
    expect(routerPath('/guides/my%20page')).toBe('/guides/my page');
    expect(routerPath('/guides/caf%C3%A9')).toBe('/guides/café');
  });

  it('keeps reserved escapes, as decodeURI does', () => {
    expect(routerPath('/guides/a%2Fb')).toBe('/guides/a%2Fb');
  });

  it('leaves a malformed escape as it is instead of throwing', () => {
    expect(routerPath('/guides/100%')).toBe('/guides/100%');
  });
});

describe('trackCodeCopy', () => {
  beforeEach(() => {
    trackSpy.mockReset();
  });

  it('reports the section of the current page and the language', () => {
    const original = window.location;
    (window as { location: unknown }).location = {
      pathname: '/guides/mcp/cursor',
    };
    trackCodeCopy('json');
    trackCodeCopy(undefined);
    (window as { location: unknown }).location = original;

    expect(trackSpy.mock.calls).toEqual([
      ['code_copied', { section: 'guides', language: 'json' }],
      ['code_copied', { section: 'guides', language: 'text' }],
    ]);
  });
});

describe('trackEvent', () => {
  beforeEach(() => {
    trackSpy.mockReset();
  });

  it('sends the event with string values', () => {
    trackEvent('recipe_action', { recipe: 'slack-bot', action: 'run_open' });
    expect(trackSpy).toHaveBeenCalledWith('recipe_action', {
      recipe: 'slack-bot',
      action: 'run_open',
    });
  });

  it('truncates values to the 255 characters Vercel accepts', () => {
    trackEvent('api_request_sent', {
      operation: 'x'.repeat(300),
      status_class: '2xx',
    });
    expect(trackSpy.mock.calls[0][1].operation).toHaveLength(255);
  });

  it('never throws when the analytics script fails', () => {
    trackSpy.mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() =>
      trackEvent('api_sign_in', { result: 'success' }),
    ).not.toThrow();
  });
});
