import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const trackSpy = vi.hoisted(() => vi.fn());
vi.mock('@site/src/lib/analytics', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@site/src/lib/analytics')>()),
  trackEvent: trackSpy,
}));

import { trackHomeClick } from './HomeRedesign';

const original = window.location;

function page(): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = `
    <div data-home-slot="hero">
      <a href="/get-started/authentication"><span>Start building</span></a>
      <button type="button">Watch the video</button>
      <dialog open><a href="/cookbook/customer-360">Recipe</a></dialog>
    </div>
    <section data-home-slot="sdks">
      <a href="/libraries/api-clients">
        Python
        <button type="button"><code>pip install glean-api-client</code></button>
      </a>
    </section>
    <section data-home-slot="agents">
      <a href="https://github.com/gleanwork/glean-agent-toolkit?ref=home">Toolkit</a>
    </section>
    <a href="/outside">Outside a slot</a>`;
  return root;
}

describe('trackHomeClick', () => {
  beforeEach(() => {
    trackSpy.mockClear();
    (window as { location: unknown }).location = {
      origin: 'https://developers.glean.com',
    };
  });
  afterEach(() => {
    (window as { location: unknown }).location = original;
  });

  it('reports the slot and the link path', () => {
    trackHomeClick(page().querySelector('[data-home-slot="hero"] a span'));
    expect(trackSpy).toHaveBeenCalledExactlyOnceWith('home_cta', {
      slot: 'hero',
      target: '/get-started/authentication',
    });
  });

  it('reports only the host for links to other sites', () => {
    trackHomeClick(page().querySelector('[data-home-slot="agents"] a'));
    expect(trackSpy).toHaveBeenCalledExactlyOnceWith('home_cta', {
      slot: 'agents',
      target: 'github.com',
    });
  });

  it('skips buttons, including a copy button inside a card link', () => {
    const root = page();
    trackHomeClick(root.querySelector('[data-home-slot="hero"] button'));
    trackHomeClick(root.querySelector('[data-home-slot="sdks"] code'));
    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('skips links in the video dialog and links outside a slot', () => {
    const root = page();
    trackHomeClick(root.querySelector('dialog a'));
    trackHomeClick(root.querySelector('a[href="/outside"]'));
    expect(trackSpy).not.toHaveBeenCalled();
  });
});
