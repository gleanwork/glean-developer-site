import React from 'react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { McpInstallButtonProps } from 'docusaurus-plugin-mcp-server/theme';

const trackSpy = vi.hoisted(() => vi.fn());
const buttonProps = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@site/src/lib/analytics', () => ({ trackEvent: trackSpy }));
vi.mock('@theme/NavbarItem/DefaultNavbarItem', () => ({ default: () => null }));
vi.mock('docusaurus-plugin-mcp-server/theme', () => ({
  McpInstallButton: (props: unknown) => {
    buttonProps.current = props;
    return null;
  },
}));

import McpInstallButtonItem from './McpInstallButtonItem';

describe('McpInstallButtonItem', () => {
  beforeEach(() => {
    trackSpy.mockClear();
    buttonProps.current = null;
  });

  it('reports each copy with the client the reader copied for', () => {
    render(<McpInstallButtonItem />);
    const { onCopy } = buttonProps.current as McpInstallButtonProps;

    onCopy?.({ client: 'claude-code', kind: 'command' });

    expect(trackSpy).toHaveBeenCalledExactlyOnceWith('install_copied', {
      product: 'docs-mcp',
      client: 'claude-code',
    });
  });

  it('reports nothing until a copy happens', () => {
    render(<McpInstallButtonItem />);
    expect(trackSpy).not.toHaveBeenCalled();
  });
});
