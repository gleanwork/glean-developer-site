import React, { useState } from 'react';
import { getClientIcon } from '@gleanwork/mcp-config-schema/browser';
import TerminalPanel from '../home/TerminalPanel';
import { icon } from './diagrams';
import { tintSession } from './tintSession';
import styles from './styles.module.css';

/**
 * Per-host install instructions for the connector-builder plugin.
 *
 * Commands and invocation prefixes are taken from the verified set in
 * ../Cookbook/pluginHosts.ts — the same three hosts, same CLIs, checked
 * against each vendor's own command reference. The salient differences:
 *
 * - Claude Code and Codex have real plugin CLIs; their verbs differ
 *   (`plugin install` vs `plugin add`).
 * - Cursor has no plugin CLI at all. Installing is a UI flow, so its entry
 *   is click-through steps rather than a copyable command.
 * - Invocation prefixes differ: `/plugin:skill` (Claude Code), `/skill`
 *   (Cursor), `$skill` (Codex).
 *
 * Not imported from pluginHosts.ts directly: that module is typed to
 * CookbookPlugin and its invoke() is recipe-specific.
 */

const REPO = 'gleanwork/glean-indexing-sdk';
const PLUGIN = 'glean-connector-builder';
const MARKETPLACE = 'glean-indexing-sdk';

interface Host {
  id: 'claude-code' | 'cursor' | 'codex';
  label: string;
  mono?: boolean;
  /** Copyable shell commands, or null when the host has no plugin CLI. */
  commands: string[] | null;
  /** Click-through steps, for a UI-only install path. */
  steps?: string[];
  /** How the skill is addressed once installed. */
  invoke: string;
  /** What has to happen before skills appear. */
  postInstall: string;
}

const HOSTS: Host[] = [
  {
    id: 'claude-code',
    label: 'Claude Code',
    commands: [
      `claude plugin marketplace add ${REPO}`,
      `claude plugin install ${PLUGIN}@${MARKETPLACE}`,
    ],
    invoke: `/${PLUGIN}:connector-builder`,
    postInstall: 'Run /reload-plugins to pick it up without restarting.',
  },
  {
    id: 'codex',
    label: 'Codex',
    mono: true,
    commands: [
      `codex plugin marketplace add ${REPO}`,
      `codex plugin add ${PLUGIN}@${MARKETPLACE}`,
    ],
    invoke: '$connector-builder',
    postInstall: 'Bundled skills load in a new chat or CLI session.',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    mono: true,
    commands: null,
    steps: [
      'Open Dashboard → Plugins → Add Marketplace → Import from Repo.',
      `Point it at ${REPO}, then install the plugin from Customize.`,
    ],
    invoke: '/connector-builder',
    postInstall: 'Reload the window if the skill does not appear.',
  },
];

/**
 * Tabbed per-host install block. This is the primary call to action on the
 * Indexing SDK overview, so it leads with the copyable command.
 */
export default function AgentInstall(): React.ReactElement {
  const [active, setActive] = useState(0);
  const host = HOSTS[active];

  return (
    <div className={styles.installBlock}>
      <div className={styles.hostTabs}>
        {HOSTS.map((h, i) => (
          <button
            className={`${styles.hostTab} ${i === active ? styles.hostTabActive : ''}`}
            key={h.id}
            onClick={() => setActive(i)}
            type="button"
          >
            <span
              className={`${styles.hostIcon} ${h.mono ? styles.hostIconMono : ''}`}
              dangerouslySetInnerHTML={{ __html: getClientIcon(h.id) ?? '' }}
            />
            {h.label}
          </button>
        ))}
      </div>

      {host.commands ? (
        <TerminalPanel
          code={host.commands.join('\n')}
          copy
          filename="terminal"
          label={host.label}
          tinter={tintSession}
        />
      ) : (
        <div className={styles.hostSteps}>
          {host.steps?.map((step, i) => (
            <div className={styles.hostStep} key={step}>
              <span className={styles.hostStepNum}>{i + 1}</span>
              <span>{step}</span>
            </div>
          ))}
          <p className={styles.hostStepNote}>
            {icon('Info', 13)}
            Cursor has no plugin CLI, so this one is a UI flow.
          </p>
        </div>
      )}

      <div className={styles.installFooter}>
        <span className={styles.installFooterItem}>
          {icon('RefreshCw', 13)}
          {host.postInstall}
        </span>
        <span className={styles.installFooterItem}>
          {icon('Terminal', 13)}
          Invoke explicitly with <code>{host.invoke}</code>, or just describe
          your source.
        </span>
      </div>
    </div>
  );
}
