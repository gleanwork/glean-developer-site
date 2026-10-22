import React from 'react';
import DefaultNavbarItem from '@theme/NavbarItem/DefaultNavbarItem';
import type { Props as DefaultNavbarItemProps } from '@theme/NavbarItem/DefaultNavbarItem';
import { McpInstallButton } from 'docusaurus-plugin-mcp-server/theme';
import { trackEvent } from '@site/src/lib/analytics';

const LABEL = 'Docs MCP';

/**
 * McpInstallButton has no copy callback, so read the copy click from its
 * markup: a copy button inside a client's dropdown item, whose header names
 * the client. The names come from the plugin's client registry, not from the
 * reader. Replace this with a callback if the plugin adds one.
 */
export function trackDocsMcpCopy(target: EventTarget | null): void {
  if (!(target instanceof Element)) return;
  const item = target.closest('button')?.closest('.mcp-install-dropdown__item');
  const name = item
    ?.querySelector('.mcp-install-dropdown__client-name')
    ?.textContent?.trim();
  if (!name) return;
  const client = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  trackEvent('install_copied', { product: 'docs-mcp', client });
}

export default function McpInstallButtonItem({
  mobile,
  ...props
}: DefaultNavbarItemProps): React.JSX.Element {
  // The install dropdown doesn't fit the mobile sidebar, so link to the page
  // that explains the server and has the same install options. Forward the
  // props Docusaurus passes, including the onClick that closes the sidebar.
  if (mobile) {
    return <DefaultNavbarItem {...props} mobile label={LABEL} to="/docs-mcp" />;
  }

  // navbar__item gives the navbar's spacing and hides the button below the
  // mobile breakpoint, where the sidebar link above takes over.
  return (
    <div
      className="navbar__item"
      onClickCapture={(event) => trackDocsMcpCopy(event.target)}
    >
      <McpInstallButton label={LABEL} />
    </div>
  );
}
