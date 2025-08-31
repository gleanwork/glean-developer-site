import { describe, test, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MCPConfigurator from '../index';

vi.mock('sonner', () => ({
  Toaster: () => null,
  toast: {
    success: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@theme/Tabs', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@theme/TabItem', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

describe('Bearer Token Configuration', () => {
  describe('Manual Config Tab', () => {
    test('native HTTP hosts include Authorization header with bearer token', async () => {
      const { getByLabelText, getByText, container } = render(
        <MCPConfigurator />,
      );

      const hostSelect = getByLabelText('Select Your Host Application');
      fireEvent.change(hostSelect, { target: { value: 'cursor' } });

      const instanceInput = container.querySelector('#instance-name');
      fireEvent.change(instanceInput!, { target: { value: 'acme' } });

      const authMethodSelect = getByLabelText('Authentication Method');
      fireEvent.change(authMethodSelect, { target: { value: 'bearer' } });

      await waitFor(() => {
        const tokenInput = getByLabelText('Bearer Token');
        fireEvent.change(tokenInput, { target: { value: 'test-token-123' } });
      });

      await waitFor(() => {
        const configCode = container.querySelector(
          '[class*="configCode"] code',
        );
        const config = configCode?.textContent;

        expect(config).toContain('"Authorization": "Bearer test-token-123"');
        expect(config).toContain('"headers"');
        expect(config).toContain('"type": "http"');
      });
    });

    test('stdio hosts (using mcp-remote) include --header flag with bearer token', async () => {
      const { getByLabelText, container } = render(<MCPConfigurator />);

      const hostSelect = getByLabelText('Select Your Host Application');
      fireEvent.change(hostSelect, { target: { value: 'windsurf' } });

      const instanceInput = container.querySelector('#instance-name');
      fireEvent.change(instanceInput!, { target: { value: 'acme' } });

      const authMethodSelect = getByLabelText('Authentication Method');
      fireEvent.change(authMethodSelect, { target: { value: 'bearer' } });

      await waitFor(() => {
        const tokenInput = getByLabelText('Bearer Token');
        fireEvent.change(tokenInput, { target: { value: 'test-token-456' } });
      });

      await waitFor(() => {
        const configCode = container.querySelector(
          '[class*="configCode"] code',
        );
        const config = configCode?.textContent;

        expect(config).toContain('--header');
        expect(config).toContain('Authorization: Bearer test-token-456');
      });
    });

    test('goose includes Authorization header in YAML', async () => {
      const { getByLabelText, container } = render(<MCPConfigurator />);

      const hostSelect = getByLabelText('Select Your Host Application');
      fireEvent.change(hostSelect, { target: { value: 'goose' } });

      const instanceInput = container.querySelector('#instance-name');
      fireEvent.change(instanceInput!, { target: { value: 'acme' } });

      const authMethodSelect = getByLabelText('Authentication Method');
      fireEvent.change(authMethodSelect, { target: { value: 'bearer' } });

      await waitFor(() => {
        const tokenInput = getByLabelText('Bearer Token');
        fireEvent.change(tokenInput, { target: { value: 'test-token-789' } });
      });

      await waitFor(() => {
        const configCode = container.querySelector(
          '[class*="configCode"] code',
        );
        const config = configCode?.textContent;

        expect(config).toContain('Authorization: Bearer test-token-789');
        expect(config).toContain('headers:');
        expect(config).toContain('type: streamable_http');
      });
    });
  });

  describe('OAuth vs Bearer Token', () => {
    test('OAuth mode does not include any auth headers', async () => {
      const { getByLabelText, container } = render(<MCPConfigurator />);

      const hostSelect = getByLabelText('Select Your Host Application');
      fireEvent.change(hostSelect, { target: { value: 'cursor' } });

      const instanceInput = container.querySelector('#instance-name');
      fireEvent.change(instanceInput!, { target: { value: 'acme' } });

      const authMethodSelect = getByLabelText('Authentication Method');
      expect(authMethodSelect).toHaveValue('oauth');

      await waitFor(() => {
        const configCode = container.querySelector(
          '[class*="configCode"] code',
        );
        const config = configCode?.textContent;

        expect(config).not.toContain('Authorization');
        expect(config).not.toContain('headers');
        expect(config).not.toContain('--header');
        expect(config).not.toContain('GLEAN_API_TOKEN');
      });
    });
  });

  describe('Auth Method Switching Bug Fix', () => {
    test('switching from bearer to oauth removes token from config', async () => {
      const { getByDisplayValue, getByText, getByRole, container } = render(<MCPConfigurator />);
      
      // First select a non-admin client (cursor) to show auth options
      const clientSelect = getByRole('combobox', { name: /select your host application/i });
      fireEvent.change(clientSelect, { target: { value: 'cursor' } });
      
      // Set up instance and server name
      const instanceInput = getByDisplayValue('');
      fireEvent.change(instanceInput, { target: { value: 'testcompany' } });
      
      // Now the auth method dropdown should be available
      await waitFor(() => {
        const authSelect = container.querySelector('#auth-method') as HTMLSelectElement;
        expect(authSelect).toBeInTheDocument();
        
        // Switch to bearer auth
        fireEvent.change(authSelect, { target: { value: 'bearer' } });
      });
      
      // Set a token
      await waitFor(() => {
        const tokenInput = container.querySelector('#auth-token') as HTMLInputElement;
        expect(tokenInput).toBeInTheDocument();
        fireEvent.change(tokenInput, { target: { value: 'test-token-123' } });
      });
      
      // Switch back to oauth
      const authSelect = container.querySelector('#auth-method') as HTMLSelectElement;
      fireEvent.change(authSelect, { target: { value: 'oauth' } });
      
      // Check that the manual config doesn't contain the token
      await waitFor(() => {
        const configText = getByText(/"type": "http"/).closest('code')?.textContent;
        expect(configText).toBeTruthy();
        expect(configText).not.toContain('Authorization');
        expect(configText).not.toContain('test-token-123');
        expect(configText).not.toContain('headers');
      });
    });
  });
});
