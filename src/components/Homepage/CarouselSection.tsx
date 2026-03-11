import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import clsx from 'clsx';
import CodeBlock from '@theme/CodeBlock';
import ThemedImage from '@theme/ThemedImage';
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
      'Code assistants can write fast. Glean gives them the context they’re missing — docs, decisions, people, tickets, and code — so they can build in the real world, not in a vacuum.',
    bullets: [
      '<strong>Ground plans in reality</strong> – Pull in design docs, prior decisions, and team context before writing code',
      '<strong>Works where you work</strong> – Use Glean with Claude Code, Cursor, and other MCP-compatible tools',
      "<strong>Permission-aware from day one</strong> – Every query respects your company's access controls",
    ],
    ctaText: 'Connect Glean to Your IDE',
    ctaHref: '/guides/mcp',
    ctaIcon: 'plug',
    ctaIconSet: 'glean',
    imageUrl: {
      light: '/img/glean-mcp-tool-calls.png',
      dark: '/img/glean-mcp-tool-calls.png',
    },
    imageAlt:
      'Chat window showing Glean MCP tool calls with enterprise results',
  },
  {
    title:
      'Connect Any Agent to Your Company\'s Knowledge',
    description:
      "Not every agent will run on Glean. That’s fine. Glean is the knowledge layer that connects any agent to your enterprise context through one secure MCP endpoint.",
    bullets: [
      '<strong>One connection, many hosts</strong> – Works with Claude, Cursor, Copilot, ChatGPT, Windsurf, and 20+ MCP hosts',
      '<strong>Framework-agnostic</strong> – Plug Glean into LangChain, OpenAI Agents SDK, Google ADK, or any MCP-compatible framework',
      '<strong>Bring agents to the data</strong> – Expose Glean agents as tools anywhere your developers work',
    ],
    ctaText: 'Get Started with MCP',
    ctaHref: '/guides/mcp',
    ctaIcon: 'mcp',
    ctaIconSet: 'glean',
    imageUrl: {
      light: '/img/mcp-ecosystem-diagram.png',
      dark: '/img/mcp-ecosystem-diagram.png',
    },
    imageAlt:
      'MCP ecosystem diagram showing Glean as the central knowledge layer',
  },
  {
    title: 'Build Agents That Actually Know Your Business',
    description:
      "Glean agents reason over your company’s knowledge graph, not just a prompt window. Search, analyze, find experts, and take action with enterprise-safe access built in.",
    bullets: [
      '<strong>Multi-step by design</strong> – Plan, execute, and iterate across complex workflows',
      '<strong>Grounded in company context</strong> – Search, chat, code, people, and meetings as native tools',
      '<strong>Deploy where you need them</strong> – Run on Glean, call via API, or expose as MCP tools in any host',
    ],
    ctaText: 'Choose Your Agent Approach',
    ctaHref: '/guides/agents/overview',
    ctaIcon: 'agent',
    ctaIconSet: 'glean',
    imageUrl: {
      light: '/img/agent-code-toolkit.png',
      dark: '/img/agent-code-toolkit.png',
    },
    imageAlt: 'Python code defining CrewAI agents with glean-agent-toolkit',
  },
  {
    title: 'Bring Every Data Source into the Graph',
    description:
      'The better your knowledge graph, the better every search, agent, and integration performs. Glean connects 100+ apps out of the box and lets you index everything else through flexible APIs.',
    bullets: [
      '<strong>Bulk or real-time</strong> – Upload millions of documents or sync continuously',
      '<strong>Flexible schema</strong> – Model metadata, relationships, and custom properties your way',
      '<strong>Foundation for everything above</strong> – A richer graph makes every agent smarter',
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
