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

    test('goose includes GLEAN_API_TOKEN environment variable', async () => {
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

        expect(config).toContain('GLEAN_API_TOKEN: test-token-789');
        expect(config).toContain('envs:');
      });
    });
  });

  // CLI Command tests are covered in all-hosts-bearer.test.ts
  // These tests validate the logic without UI interaction complexity

  // Config Button tests are covered in all-hosts-bearer.test.ts
  // These tests validate the logic without UI interaction complexity

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
});
