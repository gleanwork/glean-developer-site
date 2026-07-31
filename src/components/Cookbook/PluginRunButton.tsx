import React, { useEffect, useRef, useState } from 'react';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import { getClientIcon } from '@gleanwork/mcp-config-schema/browser';
import type { CookbookPlugin } from '../../types/recipe';
import {
  PLUGIN_HOSTS,
  POST_INSTALL_NOTE,
  type PluginHost,
  type PluginHostStep,
} from './pluginHosts';
import styles from './RecipeLayout.module.css';

/**
 * Rail control for running a recipe through the cookbook plugin.
 *
 * Borrows McpInstallButton's interaction model (aria-expanded/haspopup, close
 * on outside mousedown) but not its markup: that component renders an infima
 * `dropdown__menu`, which floats and would clip inside this 300px sticky rail.
 * This expands in flow instead, and reuses the rail's own pill and card
 * classes so the control looks like the buttons that were already here.
 */

function CopyRow({ code }: { code: string }): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure origin, denied permission) — the
      // command is still selectable in the block itself.
    }
  };

  return (
    <div className={styles.hostCommand}>
      <pre>
        <code>{code}</code>
      </pre>
      <button
        aria-label={copied ? 'Copied' : 'Copy to clipboard'}
        className={styles.hostCopy}
        onClick={copy}
        type="button"
      >
        {getIcon(copied ? 'Check' : 'Copy', 'feather', {
          width: 14,
          height: 14,
          color: 'currentColor',
        })}
      </button>
    </div>
  );
}

function Step({ step }: { step: PluginHostStep }): React.ReactElement {
  return (
    <div className={styles.hostStep}>
      <div className={styles.hostStepLabel}>{step.label}</div>
      {step.commands?.map((command) => (
        <CopyRow code={command} key={command} />
      ))}
      {step.instructions?.map((line) => (
        <p className={styles.hostStepNote} key={line}>
          {line}
        </p>
      ))}
    </div>
  );
}

function HostIcon({ host }: { host: PluginHost }): React.ReactElement {
  return (
    <span
      className={`${styles.hostIcon} ${host.mono ? styles.hostIconMono : ''}`}
      // Markup comes from @gleanwork/mcp-config-schema's packaged icon set,
      // not user input.
      dangerouslySetInnerHTML={{ __html: getClientIcon(host.id) ?? '' }}
    />
  );
}

export default function PluginRunButton({
  plugin,
  recipeId,
}: {
  plugin: CookbookPlugin;
  recipeId: string;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [hostId, setHostId] = useState<PluginHost['id']>(PLUGIN_HOSTS[0].id);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    function onOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const host = PLUGIN_HOSTS.find((h) => h.id === hostId) ?? PLUGIN_HOSTS[0];

  return (
    <div
      className={`dropdown dropdown--right ${open ? 'dropdown--show' : ''} ${styles.pluginDropdown}`}
      ref={containerRef}
    >
      <button
        aria-expanded={open}
        aria-haspopup="true"
        className={styles.primaryAction}
        onClick={() => setOpen(!open)}
        type="button"
      >
        {getIcon('Play', 'feather', {
          width: 16,
          height: 16,
          color: 'currentColor',
        })}
        Run this recipe
        <span className={open ? styles.chevronOpen : styles.chevron}>
          {getIcon('ChevronDown', 'feather', {
            width: 14,
            height: 14,
            color: 'currentColor',
          })}
        </span>
      </button>

      <ul className="dropdown__menu">
        <li>
          <div className={styles.railLabel}>Choose your tool</div>
          <div className={styles.hostTabs} role="tablist">
            {PLUGIN_HOSTS.map((candidate) => (
              <button
                aria-selected={candidate.id === hostId}
                className={`${styles.hostTab} ${
                  candidate.id === hostId ? styles.hostTabActive : ''
                }`}
                key={candidate.id}
                onClick={() => setHostId(candidate.id)}
                role="tab"
                type="button"
              >
                <HostIcon host={candidate} />
                {candidate.label}
              </button>
            ))}
          </div>

          <Step step={host.install(plugin)} />
          <Step step={host.invoke(plugin, recipeId)} />
          <p className={styles.hostStepNote}>{POST_INSTALL_NOTE[host.id]}</p>
        </li>
      </ul>
    </div>
  );
}
