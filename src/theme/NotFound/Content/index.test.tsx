import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const trackSpy = vi.hoisted(() => vi.fn());
const location = vi.hoisted(() => ({ pathname: '/guides/old-page' }));

vi.mock('@site/src/lib/analytics', () => ({
  trackEvent: trackSpy,
  pageReferrer: (pathname: string) =>
    pathname === '/guides/old-page' ? 'github.com' : 'internal',
}));
vi.mock('@docusaurus/router', () => ({ useLocation: () => location }));
vi.mock('@theme-original/NotFound/Content', () => ({
  default: () => <h1>Page Not Found</h1>,
}));

import NotFoundContent from './index';

describe('NotFound analytics', () => {
  it('reports the missing path and its referrer once per path', () => {
    const { rerender, getByText } = render(<NotFoundContent />);
    rerender(<NotFoundContent />);
    expect(getByText('Page Not Found')).toBeInTheDocument();

    location.pathname = '/api/removed';
    rerender(<NotFoundContent />);

    expect(trackSpy.mock.calls).toEqual([
      ['not_found', { path: '/guides/old-page', referrer: 'github.com' }],
      ['not_found', { path: '/api/removed', referrer: 'internal' }],
    ]);
  });
});
