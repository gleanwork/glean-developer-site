import React from 'react';
import DefaultNavbarItem from '@theme/NavbarItem/DefaultNavbarItem';
import { McpInstallButton } from 'docusaurus-plugin-mcp-server/theme';

const LABEL = 'Docs MCP';

interface NavbarItemProps {
  mobile?: boolean;
  className?: string;
}

export default function McpInstallButtonItem({
  mobile,
}: NavbarItemProps): React.JSX.Element {
  // The install dropdown doesn't fit the mobile sidebar, so link to the page
  // that explains the server and has the same install options.
  if (mobile) {
    return <DefaultNavbarItem mobile label={LABEL} to="/docs-mcp" />;
  }

  // navbar__item gives the navbar's spacing and hides the button below the
  // mobile breakpoint, where the sidebar link above takes over.
  return (
    <div className="navbar__item">
      <McpInstallButton label={LABEL} />
    </div>
  );
}
