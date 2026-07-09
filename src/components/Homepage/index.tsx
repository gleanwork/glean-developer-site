import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
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
      <section
        className={clsx('container', styles.wideContainer, 'margin-top--sm')}
        aria-labelledby="platform-api-banner-title"
      >
        <div className={styles.topBanner}>
          <div className={styles.bannerContent}>
            <span className={styles.badge}>New</span>
            <div>
              <h2 id="platform-api-banner-title" className={styles.bannerTitle}>
                Introducing Glean Platform APIs
              </h2>
              <p className={styles.bannerSubtitle}>
                Build search experiences and run Glean agents in your
                applications with our new Platform APIs.
              </p>
            </div>
          </div>
          <Link
            to="/api/platform-api"
            className={clsx(
              'button button--secondary button--lg',
              styles.bannerButton,
            )}
          >
            Explore Platform APIs
          </Link>
        </div>
      </section>

      {/* Dynamic Carousel Section */}
      <CarouselSection />

      <hr />

      {/* IDE Plugin Promotion */}
      <IDEPluginSection />

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
