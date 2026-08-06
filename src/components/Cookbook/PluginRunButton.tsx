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

function CopyRow({
  code,
  index,
}: {
  code: string;
  /** 1-based position when a path has several commands; omitted for one. */
  index?: number;
}): React.ReactElement {
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
      {index ? <span className={styles.hostCommandNum}>{index}</span> : null}
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

/** Numbers commands only when there's a sequence, so two steps don't read as two options. */
function StepBody({ step }: { step: PluginHostStep }): React.ReactElement {
  const numbered = (step.commands?.length ?? 0) > 1;
  return (
    <>
      {step.commands?.map((command, i) => (
        <CopyRow
          code={command}
          index={numbered ? i + 1 : undefined}
          key={command}
        />
      ))}
      {step.instructions?.map((line) => (
        <p className={styles.hostStepNote} key={line}>
          {line}
        </p>
      ))}
    </>
  );
}

/**
 * Install section. Terminal and in-session setup are alternatives, not extra
 * work, so when a host supports both they go behind a picker — stacking them
 * reads as four commands to run instead of two.
 */
function Install({
  host,
  plugin,
}: {
  host: PluginHost;
  plugin: CookbookPlugin;
}): React.ReactElement {
  const paths = host.install(plugin);
  const [pathId, setPathId] = useState(paths[0].id);
  // Host switches change which paths exist; fall back rather than render blank.
  const path = paths.find((p) => p.id === pathId) ?? paths[0];

  return (
    <div className={styles.hostStep}>
      <div className={styles.hostStepHeader}>
        <span className={styles.hostStepLabel}>Install the plugin</span>
        {paths.length > 1 ? (
          <span className={styles.pathToggle}>
            {paths.map((candidate) => (
              <button
                className={`${styles.pathOption} ${
                  candidate.id === path.id ? styles.pathOptionActive : ''
                }`}
                key={candidate.id}
                onClick={() => setPathId(candidate.id)}
                type="button"
              >
                {candidate.label}
              </button>
            ))}
          </span>
        ) : null}
      </div>
      <StepBody step={path} />
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

          <Install host={host} plugin={plugin} />

          <div className={styles.hostStep}>
            <div className={styles.hostStepLabel}>Run the recipe</div>
            <StepBody step={host.invoke(plugin, recipeId)} />
          </div>

          <p className={styles.hostStepNote}>{POST_INSTALL_NOTE[host.id]}</p>
        </li>
      </ul>
    </div>
  );
}
