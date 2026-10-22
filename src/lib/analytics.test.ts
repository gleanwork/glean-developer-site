import { beforeEach, describe, expect, it, vi } from 'vitest';

const trackSpy = vi.hoisted(() => vi.fn());
vi.mock('@vercel/analytics', () => ({ track: trackSpy }));

import { redactEvent, statusClass, trackEvent } from './analytics';

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
