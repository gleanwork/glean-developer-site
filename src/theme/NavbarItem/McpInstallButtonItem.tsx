import React from 'react';
import DefaultNavbarItem from '@theme/NavbarItem/DefaultNavbarItem';
import type { Props as DefaultNavbarItemProps } from '@theme/NavbarItem/DefaultNavbarItem';
import {
  McpInstallButton,
  type McpInstallCopyEvent,
} from 'docusaurus-plugin-mcp-server/theme';
import { trackEvent } from '@site/src/lib/analytics';

const LABEL = 'Docs MCP';

/**
 * Reports a copy from the install dropdown. The client is an ID from the
 * plugin's client registry, such as `claude-code`, never anything the reader
 * typed.
 */
export function trackDocsMcpCopy({ client }: McpInstallCopyEvent): void {
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
    <div className="navbar__item">
      <McpInstallButton label={LABEL} onCopy={trackDocsMcpCopy} />
    </div>
  );
}
