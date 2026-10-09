import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FeatureFlagsContext } from '../theme/Root';
import { usePreviewContent } from './usePreviewContent';

const routerState = vi.hoisted(() => ({ location: { pathname: '/', search: '' } }));

vi.mock('@docusaurus/router', () => ({
  useLocation: () => routerState.location,
}));

function Probe() {
  return <p data-testid="previews">{String(usePreviewContent())}</p>;
}

function renderWithFlag(flagOn: boolean) {
  return render(
    <FeatureFlagsContext.Provider
      value={{
        flagConfigs: {},
        flags: { 'preview-content': flagOn },
        isEnabled: (flag) => flag === 'preview-content' && flagOn,
        refresh: () => {},
      }}
    >
      <Probe />
    </FeatureFlagsContext.Provider>,
  );
}

const shown = () => screen.getByTestId('previews').textContent;

beforeEach(() => {
  routerState.location = { pathname: '/', search: '' };
});

describe('usePreviewContent', () => {
  it('is off by default', async () => {
    renderWithFlag(false);
    await waitFor(() => expect(shown()).toBe('false'));
  });

  it('ignores the old per-item parameters', async () => {
    routerState.location.search = '?ff_recipe=a&ff_video=b';
    renderWithFlag(false);
    await waitFor(() => expect(shown()).toBe('false'));
  });

  it('turns on from the URL and remembers it for the session', async () => {
    routerState.location.search = '?ff_preview-content=true';
    const { unmount } = renderWithFlag(false);
    await waitFor(() => expect(shown()).toBe('true'));
    unmount();

    // Next page, no parameter.
    routerState.location = { pathname: '/videos', search: '' };
    renderWithFlag(false);
    await waitFor(() => expect(shown()).toBe('true'));
  });

  it('clears the session grant with an explicit false', async () => {
    window.sessionStorage.setItem('ff:preview-content', '1');
    routerState.location.search = '?ff_preview-content=false';
    renderWithFlag(false);
    await waitFor(() => expect(shown()).toBe('false'));
    expect(window.sessionStorage.getItem('ff:preview-content')).toBeNull();
  });

  it('follows the feature flag (Edge Config or build flags)', async () => {
    renderWithFlag(true);
    await waitFor(() => expect(shown()).toBe('true'));
  });

  it('lets an explicit false override the flag, to check the public view', async () => {
    routerState.location.search = '?ff_preview-content=false';
    renderWithFlag(true);
    await waitFor(() => expect(shown()).toBe('false'));
  });
});
