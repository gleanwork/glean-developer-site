import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import { Info } from 'react-feather';
import styles from './index.module.css';
import Card from '@theme/Card';
import CarouselSection from './CarouselSection';
import IDEPluginSection from './IDEPluginSection';
import { GLEAN_BRAND_COLORS } from '@gleanwork/docusaurus-theme-glean/brandColors';

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
      title: 'Integrate with AI Tools',
      body: 'Connect Claude Code, Cursor, Copilot, and any MCP host to your enterprise knowledge.',
      href: 'guides/mcp',
      icon: 'plug',
      iconSet: 'glean',
      color: GLEAN_BRAND_COLORS.PRIMARY_BLUE,
    },
    {
      title: 'Build with Our APIs',
      body: 'Search, chat, and agent APIs with client libraries for Python, TypeScript, Java, and Go.',
      href: 'api-info/client/getting-started/overview',
      icon: 'Code',
      iconSet: 'feather',
      color: GLEAN_BRAND_COLORS.PRIMARY_BLUE,
    },
    {
      title: 'Connect Your Data',
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

      {/* IDE Plugin Promotion */}
      <IDEPluginSection />

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
