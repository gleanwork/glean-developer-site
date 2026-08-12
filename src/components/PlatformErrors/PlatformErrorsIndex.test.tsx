import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PlatformErrorsIndex from './PlatformErrorsIndex';

const useLocation = vi.fn(() => ({ search: '' }));

vi.mock('@docusaurus/router', () => ({
  useLocation: () => useLocation(),
}));

const errors = [
  {
    code: 'invalid_cursor',
    slug: 'invalid-cursor',
    status: 400,
    title: 'Invalid Pagination Cursor',
    remediation: {
      meaning: 'The pagination cursor cannot be used for this request.',
      commonCauses: ['The cursor is malformed.'],
    },
  },
  {
    code: 'rate_limit_exceeded',
    slug: 'rate-limit-exceeded',
    status: 429,
    title: 'Rate Limit Exceeded',
    remediation: {
      meaning: 'The caller sent too many requests.',
      commonCauses: ['The request rate exceeded the allowed quota.'],
    },
  },
];

describe('PlatformErrorsIndex', () => {
  beforeEach(() => {
    useLocation.mockReturnValue({ search: '' });
  });

  it('links every error directly from the landing table', () => {
    render(<PlatformErrorsIndex errors={errors} />);

    expect(
      screen.getByRole('link', {
        name: 'invalid_cursor: Invalid Pagination Cursor',
      }),
    ).toHaveAttribute('href', '/errors/invalid-cursor');
    expect(
      screen.getByRole('link', {
        name: 'rate_limit_exceeded: Rate Limit Exceeded',
      }),
    ).toHaveAttribute('href', '/errors/rate-limit-exceeded');
    expect(screen.getByText('2 documented errors')).toBeInTheDocument();
  });

  it('filters by code, status, title, meaning, and cause keywords', async () => {
    const user = userEvent.setup();
    render(<PlatformErrorsIndex errors={errors} />);
    const search = screen.getByRole('searchbox', { name: 'Find an error' });

    await user.type(search, '429 quota');

    const body = screen.getAllByRole('rowgroup')[1];
    expect(within(body).getByText('rate_limit_exceeded')).toBeInTheDocument();
    expect(within(body).queryByText('invalid_cursor')).not.toBeInTheDocument();
    expect(screen.getByText('1 of 2 documented errors')).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'Invalid Pagination Cursor');

    expect(within(body).getByText('invalid_cursor')).toBeInTheDocument();
    expect(
      within(body).queryByText('rate_limit_exceeded'),
    ).not.toBeInTheDocument();
  });

  it('shows missing-page guidance without hiding the full index', () => {
    useLocation.mockReturnValue({ search: '?missing=unknown_error' });

    render(<PlatformErrorsIndex errors={errors} />);

    expect(screen.getByText('unknown_error')).toBeInTheDocument();
    expect(screen.getByText('2 documented errors')).toBeInTheDocument();
  });
});
