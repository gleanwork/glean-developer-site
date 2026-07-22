import React from 'react';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import styles from './AuthFlow.module.css';

function feather(name: string, size = 15): React.ReactNode {
  return getIcon(name, 'feather', {
    width: size,
    height: size,
    color: 'currentColor',
  });
}

interface Node {
  icon: string;
  title: string;
  sub: string;
  accent?: boolean;
}

function Lane({
  label,
  nodes,
}: {
  label: string;
  nodes: Node[];
}): React.ReactElement {
  return (
    <div className={styles.lane}>
      <span className={styles.laneLabel}>{label}</span>
      {nodes.map((node, i) => (
        <React.Fragment key={node.title}>
          {i > 0 ? (
            <span aria-hidden="true" className={styles.arrow}>
              {feather('ArrowRight', 14)}
            </span>
          ) : null}
          <span
            className={`${styles.node} ${node.accent ? styles.nodeAccent : ''}`}
          >
            <span aria-hidden="true" className={styles.nodeIcon}>
              {feather(node.icon)}
            </span>
            <span className={styles.nodeTitle}>{node.title}</span>
            <span className={styles.nodeSub}>{node.sub}</span>
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

/** Side-by-side flow diagram contrasting the two Web SDK auth methods. */
export default function AuthFlow(): React.ReactElement {
  return (
    <div className={styles.flow}>
      <div className={styles.canvas}>
        <Lane
          label="SSO (default)"
          nodes={[
            {
              icon: 'User',
              title: 'User clicks widget',
              sub: 'Sees a sign-in prompt on first use',
            },
            {
              icon: 'Users',
              title: 'Your identity provider',
              sub: 'Standard SSO flow in a popup',
              accent: true,
            },
            {
              icon: 'Search',
              title: 'Widget is live',
              sub: 'Session persists like the Glean app',
            },
          ]}
        />
        <Lane
          label="Server-to-server"
          nodes={[
            {
              icon: 'Server',
              title: 'Your backend',
              sub: 'Mints a short-lived user token via the Client API',
              accent: true,
            },
            {
              icon: 'Key',
              title: 'authToken option',
              sub: 'Passed to the SDK, refreshed via callback',
            },
            {
              icon: 'Search',
              title: 'Widget is live',
              sub: 'No visible sign-in step for the user',
            },
          ]}
        />
      </div>
    </div>
  );
}
