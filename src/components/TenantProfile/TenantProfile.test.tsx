import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tenantProfileStore } from '@site/src/lib/tenantProfile';
import { FeatureFlagsContext } from '@site/src/theme/Root';
import TenantProfileControl from './index';

function renderTenantProfile(
  enabled = true,
  outerSubmit?: React.FormEventHandler<HTMLFormElement>,
) {
  const control = <TenantProfileControl />;
  return render(
    <FeatureFlagsContext.Provider
      value={
        {
          isEnabled: (flag: string) =>
            enabled && flag === 'tenant-api-personalization',
          flagConfigs: {},
        } as React.ContextType<typeof FeatureFlagsContext>
      }
    >
      {outerSubmit ? <form onSubmit={outerSubmit}>{control}</form> : control}
    </FeatureFlagsContext.Provider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  tenantProfileStore.clear();
});

afterEach(() => cleanup());

describe('TenantProfileControl', () => {
  it('renders nothing while tenant personalization is disabled', () => {
    const { container } = renderTenantProfile(false);
    expect(container).toBeEmptyDOMElement();
  });

  it('configures a manual custom API URL in a copyable read-only field', async () => {
    const user = userEvent.setup();
    renderTenantProfile();

    await user.click(screen.getByText('Enter URL manually'));
    await user.type(
      screen.getByLabelText('Glean API URL'),
      'https://knowledge.example.org/',
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByLabelText('API URL')).toHaveValue(
      'https://knowledge.example.org',
    );
    expect(screen.getByLabelText('API URL')).toHaveAttribute('readonly');
    expect(
      screen.getByRole('button', { name: 'Copy API URL' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change' })).toBeInTheDocument();
    expect(tenantProfileStore.getSnapshot()).toMatchObject({
      kind: 'configured',
      profile: { apiUrl: 'https://knowledge.example.org', source: 'manual' },
    });
  });

  it('does not submit the API Explorer request form when saving a manual URL', async () => {
    const outerSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) =>
      event.preventDefault(),
    );
    const user = userEvent.setup();
    renderTenantProfile(true, outerSubmit);

    await user.click(screen.getByText('Enter URL manually'));
    await user.type(
      screen.getByLabelText('Glean API URL'),
      'https://knowledge.example.org',
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(outerSubmit).not.toHaveBeenCalled();
  });

  it('shows privacy guidance before email discovery', async () => {
    const user = userEvent.setup();
    renderTenantProfile();

    await user.click(screen.getByText('Find my API URL'));

    expect(
      screen.getByText(
        /Only your email domain is sent to Glean\. Your email address is not stored/,
      ),
    ).toBeInTheDocument();
  });

  it('rejects an invalid manual URL without replacing a working profile', async () => {
    tenantProfileStore.setManualApiUrl('https://working.example.com');
    const user = userEvent.setup();
    renderTenantProfile();

    await user.click(screen.getByText('Change'));
    await user.click(screen.getByText('Enter the URL manually instead'));
    await user.type(
      screen.getByLabelText('Glean API URL'),
      'http://unsafe.test',
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      screen.getByText('Enter a full HTTPS API URL without a path.'),
    ).toBeInTheDocument();
    expect(tenantProfileStore.getSnapshot()).toMatchObject({
      kind: 'error',
      previous: { apiUrl: 'https://working.example.com' },
    });
  });
});
