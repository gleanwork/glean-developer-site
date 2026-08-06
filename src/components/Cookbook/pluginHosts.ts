/**
 * Per-host install and invocation instructions for the `cookbook` plugin.
 *
 * The three hosts differ in kind, not just in wording, so this can't collapse
 * into one templated command — all three were verified against each vendor's
 * CLI or docs rather than assumed:
 *
 * - Claude Code and Codex both have real non-interactive CLIs (`claude plugin
 *   …`, `codex plugin …`), confirmed from their own `--help` output. The Codex
 *   docs page describes only its interactive `/plugins` browser and never
 *   mentions the CLI.
 * - Cursor has no plugin CLI at all — confirmed against the full `cursor-agent`
 *   command reference, whose only plugin-related item is `--plugin-dir` for
 *   loading a local directory. Installing is a UI flow.
 * - Invocation prefixes differ: `/plugin:skill` (Claude Code), `/skill`
 *   (Cursor), `$skill` (Codex — the `@` in Codex's plugins page refers to the
 *   ChatGPT surface; its skills page is explicit that Codex uses `$`).
 *
 * Only Claude Code documents that plugin skills are namespaced by plugin name.
 * Cursor and Codex show bare skill names and address neither namespacing nor
 * collisions, so their entries lead with the host's own discovery affordance
 * (`/skills`, Customize) — true whichever way those hosts resolve a name.
 *
 * The plugin/marketplace/repo values are not here: they come from
 * `recipes.json`'s `plugin` block, synced from the marketplace manifest
 * pluginpack generates (see scripts/sync-registry.mjs), so renaming the plugin
 * upstream can't leave this printing a stale namespace.
 */

import type { CookbookPlugin } from '../../types/recipe';

export interface PluginHostStep {
  label: string;
  /**
   * One copy field per command, rendered as a numbered sequence. Never join
   * several into one block: each is a separate invocation that can fail on
   * its own, and a multi-line paste is not something you'd hand someone to
   * run in a terminal.
   */
  commands?: string[];
  /** Click-through steps, for a path with no command to copy. */
  instructions?: string[];
}

/**
 * Most hosts can be set up either from a shell or from inside a running
 * session. These are alternatives — you pick one — so they're presented as a
 * choice rather than stacked, which would read as more steps to run.
 */
export interface PluginInstallPath extends PluginHostStep {
  id: 'terminal' | 'in-session' | 'ui';
}

export interface PluginHost {
  /** Client id in @gleanwork/mcp-config-schema, used for the brand icon. */
  id: 'claude-code' | 'cursor' | 'codex';
  label: string;
  /** Monochrome marks need inverting in dark mode. */
  mono?: boolean;
  /** One entry renders directly; several render behind a path picker. */
  install: (plugin: CookbookPlugin) => PluginInstallPath[];
  /** How to run the recipe once installed. */
  invoke: (plugin: CookbookPlugin, recipeId: string) => PluginHostStep;
}

export const PLUGIN_HOSTS: PluginHost[] = [
  {
    id: 'claude-code',
    label: 'Claude Code',
    install: ({ repo, pluginName, marketplaceName }) => [
      {
        id: 'terminal',
        label: 'Terminal',
        commands: [
          `claude plugin marketplace add ${repo}`,
          `claude plugin install ${pluginName}@${marketplaceName}`,
        ],
      },
      {
        id: 'in-session',
        label: 'In Claude Code',
        commands: [
          `/plugin marketplace add ${repo}`,
          `/plugin install ${pluginName}@${marketplaceName}`,
        ],
      },
    ],
    invoke: ({ pluginName }, recipeId) => ({
      label: 'Run the recipe',
      commands: [`/${pluginName}:${recipeId}`],
    }),
  },
  {
    id: 'codex',
    label: 'Codex',
    mono: true,
    install: ({ repo, pluginName, marketplaceName }) => [
      {
        id: 'terminal',
        label: 'Terminal',
        commands: [
          `codex plugin marketplace add ${repo}`,
          `codex plugin add ${pluginName}@${marketplaceName}`,
        ],
      },
      {
        id: 'in-session',
        label: 'In Codex',
        commands: ['/plugins'],
        instructions: [
          `Opens the plugin browser — switch to the ${marketplaceName} tab and install ${pluginName}.`,
        ],
      },
    ],
    invoke: (_plugin, recipeId) => ({
      label: 'Run the recipe',
      commands: [`$${recipeId}`],
      instructions: [`In a new session — or run /skills and pick it.`],
    }),
  },
  {
    id: 'cursor',
    label: 'Cursor',
    mono: true,
    // Cursor has no plugin CLI, so there is no choice to offer here.
    install: ({ repo }) => [
      {
        id: 'ui',
        label: 'In Cursor',
        instructions: [
          'Open Dashboard → Plugins → Add Marketplace → Import from Repo.',
          `Point it at ${repo}, then install the plugin from Customize.`,
        ],
      },
    ],
    invoke: (_plugin, recipeId) => ({
      label: 'Run the recipe',
      commands: [`/${recipeId}`],
      instructions: [`Or find it under Agent Decides in Customize.`],
    }),
  },
];

/** Restarting or starting a new session is required before skills appear. */
export const POST_INSTALL_NOTE: Record<PluginHost['id'], string> = {
  'claude-code': 'Run /reload-plugins to pick it up without restarting.',
  codex: 'Bundled skills load in a new chat or CLI session.',
  cursor: 'Reload the window if the skill does not appear.',
};
