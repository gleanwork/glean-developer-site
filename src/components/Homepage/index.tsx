import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import { Info } from 'react-feather';
import styles from './index.module.css';
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

      {/* Docs MCP Info Banner */}
      <div className={styles.mcpInfoBanner}>
        <Info size={20} />
        <span>
          Connect your AI coding assistant to Glean's developer documentation
          via MCP for instant access to API references and guides.{' '}
          <Link to="/docs-mcp">Get started.</Link>
        </span>
      </div>

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
    </>
  );
}
