import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import clsx from 'clsx';
import CodeBlock from '@theme/CodeBlock';
import ThemedImage from '@theme/ThemedImage';
import Frame from '@theme/Frame';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import styles from './CarouselSection.module.css';
import { Icon } from '@theme/Icons';

import 'swiper/css';
import 'swiper/css/pagination';

type CarouselSlide = {
  title: string;
  description: string;
  bullets: string[];
  ctaText: string;
  ctaHref: string;
  ctaIcon: string;
  ctaIconSet: 'feather' | 'glean';
  codeLanguage?: string;
  codeContent?: string;
  imageUrl?: {
    light: string;
    dark: string;
  };
  imageAlt?: string;
};

const slides: CarouselSlide[] = [
  {
    title: 'Your Coding Agent Knows Code. Glean Teaches It Your Company.',
    description:
      'Individual MCP servers give your agent isolated access to each tool. Glean gives it the graph — connecting docs, conversations, code, and people so your agent understands context, not just content.',
    bullets: [
      '<strong>Plans grounded in reality</strong> – Agents pull in design docs, past decisions, and org context before writing a line of code',
      '<strong>Works where you work</strong> – Plugins for Claude Code, Cursor, and any MCP-compatible IDE',
      "<strong>Permission-aware from day one</strong> – Every query respects your company's access controls",
    ],
    ctaText: 'Explore IDE Integrations',
    ctaHref: '/guides/mcp',
    ctaIcon: 'mcp',
    ctaIconSet: 'glean',
    imageUrl: {
      light: '/img/claude-code-mcp.png',
      dark: '/img/claude-code-mcp.png',
    },
    imageAlt:
      'Claude Code terminal showing Glean MCP tool calls with enterprise results',
  },
  {
    title:
      'Not All Agents Will Be Built on Glean. All of Them Should Be Connected.',
    description:
      "Glean is the enterprise knowledge layer for every AI agent — wherever it runs. One MCP server URL gives any agent secure, permission-aware access to your company's docs, code, people, and conversations.",
    bullets: [
      '<strong>One connection, every tool</strong> – Works with Claude, Cursor, Copilot, ChatGPT, Windsurf, and 20+ MCP hosts',
      '<strong>Agents as tools</strong> – Expose your Glean agents as callable MCP tools in any IDE or AI app',
      '<strong>Framework-agnostic</strong> – Plug Glean into LangChain, OpenAI Agents SDK, Google ADK, or any MCP-compatible framework',
    ],
    ctaText: 'Get Started with MCP',
    ctaHref: '/guides/mcp',
    ctaIcon: 'mcp',
    ctaIconSet: 'glean',
    imageUrl: {
      light: '/img/ide-split.png',
      dark: '/img/ide-split.png',
    },
    imageAlt:
      'Split-screen showing Claude Code with glean-core plugin and Cursor with Glean MCP',
  },
  {
    title: 'Build Agents That Actually Know Your Business',
    description:
      "Glean agents don't just reason — they reason over your company's entire knowledge graph. Build agents that search docs, analyze data, find experts, and take action, all with enterprise-grade permissions.",
    bullets: [
      '<strong>Multi-step reasoning</strong> – Agents that plan, execute, and iterate on complex workflows',
      '<strong>Grounded in your data</strong> – Search, chat, code search, people, and meetings as native tools',
      '<strong>Deploy anywhere</strong> – Run on Glean, call via API, or expose as MCP tools in any host',
    ],
    ctaText: 'Explore Agent APIs',
    ctaHref: '/guides/agents/overview',
    ctaIcon: 'agent',
    ctaIconSet: 'glean',
    imageUrl: {
      light: '/img/agent-as-tool.png',
      dark: '/img/agent-as-tool.png',
    },
    imageAlt: 'Claude Code calling a Glean agent as an MCP tool',
  },
  {
    title: 'Bring Every Data Source into the Graph',
    description:
      'Glean indexes 100+ enterprise apps out of the box. For everything else, our indexing APIs let you push any data source into the knowledge graph — with custom schemas, real-time sync, and full permission enforcement.',
    bullets: [
      '<strong>Bulk or streaming</strong> – Upload millions of documents or sync in real-time',
      '<strong>Your schema, your way</strong> – Custom properties, relationships, and metadata',
      '<strong>Powers everything above</strong> – The richer the graph, the smarter every agent, search, and integration becomes',
    ],
    ctaText: 'View Indexing APIs',
    ctaHref: '/api-info/indexing/getting-started/overview',
    ctaIcon: 'Database',
    ctaIconSet: 'feather',
    codeLanguage: 'python',
    codeContent: `import os
from glean import Glean, models

with Glean(
    instance='acme',
    api_token=os.getenv('GLEAN_INDEXING_TOKEN', ''),
) as g:
    document = models.DocumentDefinition(
        id='doc-123',
        title='Q4 Sales Report',
        body='Our Q4 performance exceeded expectations...',
        datasource='internal-docs'
    )

    g.indexing.index_document(document=document)`,
  },
];

export default function CarouselSection() {
  return (
    <section
      className={clsx('container', styles.wideContainer, 'margin-vert--l')}
    >
      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{
          delay: 8000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{
          clickable: true,
          bulletClass: styles.paginationBullet,
          bulletActiveClass: styles.paginationBulletActive,
        }}
        className={styles.carousel}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div className="row">
              <div className="col col--5">
                <h2>{slide.title}</h2>
                <p>{slide.description}</p>
                <ul>
                  {slide.bullets.map((bullet, bulletIndex) => (
                    <li
                      key={bulletIndex}
                      dangerouslySetInnerHTML={{ __html: bullet }}
                    />
                  ))}
                </ul>
                <Link
                  to={slide.ctaHref}
                  className={clsx(
                    'button button--primary button--lg',
                    styles.carouselButton,
                  )}
                >
                  <Icon
                    name={slide.ctaIcon}
                    iconSet={slide.ctaIconSet}
                    width={20}
                    height={20}
                    className="margin-right--sm"
                  />
                  {slide.ctaText}
                </Link>
              </div>
              <div className="col col--7">
                {slide.imageUrl ? (
                  <div className={styles.imageWrap}>
                    <ThemedImage
                      alt={slide.imageAlt}
                      sources={{
                        light: useBaseUrl(slide.imageUrl.light),
                        dark: useBaseUrl(slide.imageUrl.dark),
                      }}
                      className={styles.carouselImage}
                    />
                  </div>
                ) : (
                  <div className={styles.codeWrap}>
                    <CodeBlock language={slide.codeLanguage} showLineNumbers>
                      {slide.codeContent}
                    </CodeBlock>
                  </div>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
