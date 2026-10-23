import { beforeEach, describe, expect, it, vi } from 'vitest';

const trackSpy = vi.hoisted(() => vi.fn());
vi.mock('@site/src/lib/analytics', () => ({ trackEvent: trackSpy }));
vi.mock('@theme/NavbarItem/DefaultNavbarItem', () => ({ default: () => null }));
vi.mock('docusaurus-plugin-mcp-server/theme', () => ({
  McpInstallButton: () => null,
}));

import { trackDocsMcpCopy } from './McpInstallButtonItem';

// The markup docusaurus-plugin-mcp-server 2.3 renders for the dropdown.
function dropdown(): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = `
    <button class="mcp-install-dropdown__button"><span>Docs MCP</span></button>
    <ul>
      <li class="mcp-install-dropdown__item">
        <div class="mcp-install-dropdown__client-header">
          <span class="mcp-install-dropdown__client-name">Claude Code</span>
        </div>
        <div class="mcp-code-block">
          <code>claude mcp add ...</code>
          <button class="mcp-code-block__copy"><svg><path></path></svg></button>
        </div>
      </li>
    </ul>`;
  return root;
}

describe('trackDocsMcpCopy', () => {
  beforeEach(() => {
    trackSpy.mockClear();
  });

  it('reports the client whose copy button was clicked', () => {
    const root = dropdown();
    trackDocsMcpCopy(root.querySelector('path'));
    expect(trackSpy).toHaveBeenCalledExactlyOnceWith('install_copied', {
      product: 'docs-mcp',
      client: 'claude-code',
    });
  });

  it('ignores the button that opens the dropdown', () => {
    const root = dropdown();
    trackDocsMcpCopy(root.querySelector('.mcp-install-dropdown__button span'));
    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('ignores clicks on the command text', () => {
    const root = dropdown();
    trackDocsMcpCopy(root.querySelector('code'));
    expect(trackSpy).not.toHaveBeenCalled();
  });
});
