import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import clsx from 'clsx';
import styles from './IDEPluginSection.module.css';

type IDEPlugin = {
  name: string;
  logo: string;
  accentColor: string;
  description: string;
  repoHref: string;
  pageHref: string;
};

const plugins: IDEPlugin[] = [
  {
    name: 'Claude Code',
    logo: '/img/mcp-clients/claude.png',
    accentColor: '#D97757',
    description:
      'The official Glean plugin for Claude Code. Extends your Glean MCP connection with native Claude Code skills for enterprise search, people discovery, and knowledge retrieval — purpose-built for your development workflow.',
    repoHref: 'https://github.com/gleanwork/claude-plugins',
    pageHref: '/guides/mcp/claude-code',
  },
  {
    name: 'Cursor',
    logo: '/img/mcp-clients/cursor.png',
    accentColor: '#1c1c1c',
    description:
      "The official Glean plugin for Cursor. Install from the Cursor Marketplace to connect Cursor's AI to your company's knowledge — enterprise search, code exploration, and people discovery.",
    repoHref: 'https://github.com/gleanwork/cursor-plugins',
    pageHref: '/guides/mcp/cursor',
  },
];

export default function IDEPluginSection() {
  return (
    <section className={clsx('container', styles.section)}>
      <h2 className={styles.sectionHeading}>Official IDE Plugins</h2>
      <p className={styles.sectionSubheading}>
        Go beyond MCP — our official plugins add purpose-built skills and tools
        for Claude Code and Cursor.
      </p>
      <div className="row">
        {plugins.map((plugin) => (
          <div key={plugin.name} className="col col--6">
            <div
              className={styles.card}
              style={
                { '--plugin-accent': plugin.accentColor } as React.CSSProperties
              }
            >
              <div className={styles.cardHeader}>
                <img
                  src={useBaseUrl(plugin.logo)}
                  alt={plugin.name}
                  className={styles.logo}
                />
                <span className={styles.pluginName}>{plugin.name}</span>
              </div>
              <p className={styles.description}>{plugin.description}</p>
              <div className={styles.actions}>
                <Link
                  to={plugin.repoHref}
                  className={clsx('button button--secondary', styles.docsBtn)}
                >
                  View on GitHub
                </Link>
                <Link
                  to={plugin.pageHref}
                  className={clsx(
                    'button button--primary',
                    styles.configureBtn,
                  )}
                  style={{
                    backgroundColor: plugin.accentColor,
                    borderColor: plugin.accentColor,
                  }}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
