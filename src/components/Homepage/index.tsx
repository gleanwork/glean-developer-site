import React from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import styles from './index.module.css';
import { Icon } from '../Icons';
import Card from '../Card';
import CarouselSection from './CarouselSection';
import { GLEAN_BRAND_COLORS } from '../../utils/brandColors';

type Feature = {
  title: string;
  body: string;
  href: string;
  icon: string;
  iconSet?: 'feather' | 'glean';
  color?: string;
};

export default function Home() {
  const features: Feature[] = [
    {
      title: 'Build AI Agents',
      body: 'Create and orchestrate intelligent agents that reason over enterprise knowledge and automate work.',
      href: 'guides/agents/overview',
      icon: 'agent',
      iconSet: 'glean',
      color: GLEAN_BRAND_COLORS.PRIMARY_BLUE,
    },
    {
      title: 'Leverage Your Data',
      body: "Use Glean's APIs and client libraries to search, chat, and embed Work AI in your own apps.",
      href: 'api-info/client/getting-started/overview',
      icon: 'Search',
      iconSet: 'feather',
      color: GLEAN_BRAND_COLORS.PRIMARY_BLUE,
    },
    {
      title: 'Create Connectors',
      body: 'Bring any source into Glean with our connector framework and indexing API.',
      href: 'api-info/indexing/getting-started/overview',
      icon: 'Database',
      iconSet: 'feather',
      color: GLEAN_BRAND_COLORS.PRIMARY_BLUE,
    },
  ];

  return (
    <>
      {/* Dynamic Carousel Section */}
      <CarouselSection />

      <hr />

      {/* Feature Cards */}
      <section
        className={clsx('container', styles.wideContainer, 'margin-vert--l')}
      >
        <div className="row">
          {features.map((f) => (
            <div key={f.title} className="col col--4 margin-vert--md">
              <div className={styles.featureCard}>
                <Card
                  title={f.title}
                  icon={f.icon}
                  iconSet={f.iconSet}
                  href={f.href}
                  color={f.color}
                >
                  {f.body}
                </Card>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MCP highlight */}
      <section className={clsx('margin-vert--l', styles.mcpSection)}>
        <div className={clsx('container', styles.wideContainer)}>
          <div className="row">
            <div className="col col--6">
              <h2>Model Context Protocol (MCP)</h2>

              <p>
                Secure, two‑way connections between AI models and enterprise
                data.
              </p>

              <ul>
                <li>
                  Expose Glean search capabilities directly to AI assistants.
                </li>
                <li>
                  Build agents that can safely reason over your organization's
                  knowledge.
                </li>
                <li>
                  Create seamless workflows between Glean and other
                  MCP‑compatible tools.
                </li>
              </ul>

              <Link
                className={clsx('button button--primary button--lg', styles.mcpButton)}
                to="guides/mcp"
              >
                Learn more about Glean's MCP integration
              </Link>
            </div>

            <div className={clsx('col col--6', styles.mcpIconContainer)}>
              <Icon name="mcp" iconSet="glean" width={128} height={128} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
