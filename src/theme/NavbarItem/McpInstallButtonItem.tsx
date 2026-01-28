import React from 'react';
import { McpInstallButton } from 'docusaurus-plugin-mcp-server/theme';
import styles from './McpInstallButtonItem.module.css';

interface NavbarItemProps {
  mobile?: boolean;
  className?: string;
}

export default function McpInstallButtonItem({
  mobile,
}: NavbarItemProps): React.JSX.Element | null {
  // Don't render on mobile
  if (mobile) {
    return null;
  }

  return (
    <div className={styles.mcpWrapper}>
      <McpInstallButton />
    </div>
  );
}
