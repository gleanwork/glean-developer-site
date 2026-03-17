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
};

const plugins: IDEPlugin[] = [
  {
    name: 'Claude Code',
    logo: '/img/mcp-clients/claude.png',
    accentColor: '#D97757',
    description:
      "Pull your company's docs, decisions, code context, and experts into Claude Code without leaving the terminal. Glean answers with your organization's actual knowledge.",
    repoHref: 'https://github.com/gleanwork/claude-plugins',
  },
  {
    name: 'Cursor',
    logo: '/img/mcp-clients/cursor.png',
    accentColor: '#1c1c1c',
    description:
      "Ground Cursor's AI in your organization's real knowledge base. Search internal docs, surface relevant context, and reference the right people as you code.",
    repoHref: 'https://github.com/gleanwork/cursor-plugins',
  },
];

export default function IDEPluginSection() {
  return (
    <section className={clsx('container', styles.section)}>
      <h2 className={styles.sectionHeading}>Get Glean in Your IDE</h2>
      <p className={styles.sectionSubheading}>
        One MCP connection gives your AI coding assistant access to your entire
        company's knowledge.
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
                  to="/guides/mcp"
                  className={clsx(
                    'button button--primary',
                    styles.configureBtn,
                  )}
                  style={{
                    backgroundColor: plugin.accentColor,
                    borderColor: plugin.accentColor,
                  }}
                >
                  Configure
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
