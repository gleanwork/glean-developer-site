import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import { getClientIcon } from '@gleanwork/mcp-config-schema/browser';
import FeatureFlag from '../FeatureFlag';
import TerminalPanel from './TerminalPanel';
import {
  AGENTS_BAND_CODE,
  HERO_SLIDES,
  QUICKSTART_SNIPPETS,
  SDK_CARDS,
} from './snippets';
import styles from './HomeRedesign.module.css';

function feather(name: string, size = 18): React.ReactNode {
  return getIcon(name, 'feather', {
    width: size,
    height: size,
    color: 'currentColor',
  });
}

/** Experimental Platform APIs announcement band (content-configurable). */
export function AnnouncementBand({
  tag = 'Experimental',
  title = 'Introducing Glean Platform APIs',
  body = 'Build search experiences and run Glean agents in your applications with our new Platform APIs — now rolling out in experimental preview.',
  href = '/api/platform-api',
  cta = 'Explore Platform APIs',
}: {
  tag?: string;
  title?: string;
  body?: string;
  href?: string;
  cta?: string;
}): React.ReactElement {
  return (
    <div className={styles.bandWrap}>
      <Link className={styles.band} to={href}>
        <div className={styles.bandAccent} aria-hidden="true" />
        <div className={styles.bandContent}>
          <span className={styles.bandTag}>{tag}</span>
          <div className={styles.bandText}>
            <h3 className={styles.bandTitle}>{title}</h3>
            <p className={styles.bandBody}>{body}</p>
          </div>
        </div>
        <span className={styles.bandCta}>
          {cta}
          {feather('ArrowRight', 16)}
        </span>
      </Link>
    </div>
  );
}

/** Rotating hero: four API surfaces, paired copy + terminal panels. */
export function HeroCarousel(): React.ReactElement {
  const [active, setActive] = useState(0);
  const paused = useRef(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const timer = setInterval(() => {
      if (!paused.current && !reduced.current) {
        setActive((a) => (a + 1) % HERO_SLIDES.length);
      }
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const goTo = useCallback((i: number) => {
    setActive((i + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  return (
    <div
      className={styles.hero}
      onMouseEnter={() => {
        paused.current = true;
      }}
      onMouseLeave={() => {
        paused.current = false;
      }}
    >
      <div>
        <div className={styles.heroSlides}>
          {HERO_SLIDES.map((slide, i) => (
            <div
              className={`${styles.heroSlide} ${
                i === active ? styles.heroSlideActive : ''
              }`}
              key={slide.surface}
            >
              <div className={styles.heroEyebrow}>
                <span className={styles.heroEyebrowDot} />
                {slide.surface}
              </div>
              <h1 className={styles.heroTitle}>{slide.headline}</h1>
              <p className={styles.heroSub}>{slide.subcopy}</p>
            </div>
          ))}
        </div>
        <div className={styles.heroCtas}>
          <Link
            className={styles.heroPrimary}
            to={HERO_SLIDES[active].primaryHref}
          >
            Start building
            {feather('ArrowRight')}
          </Link>
          <Link
            className={styles.heroSecondary}
            to={HERO_SLIDES[active].secondaryHref}
          >
            {feather('BookOpen')}
            API reference
          </Link>
        </div>
      </div>

      <div>
        <div className={styles.heroPanels}>
          {HERO_SLIDES.map((slide, i) => (
            <TerminalPanel
              className={`${styles.heroPanel} ${
                i === active ? styles.heroPanelActive : ''
              }`}
              code={slide.code}
              filename={slide.filename}
              key={slide.surface}
              label={slide.surface}
            />
          ))}
        </div>
        <div className={styles.heroControls}>
          <button
            aria-label="Previous"
            className={styles.heroArrow}
            onClick={() => goTo(active - 1)}
            type="button"
          >
            {feather('ChevronLeft', 16)}
          </button>
          {HERO_SLIDES.map((slide, i) => (
            <button
              aria-label={`Go to ${slide.surface}`}
              className={`${styles.heroDot} ${
                i === active ? styles.heroDotActive : ''
              }`}
              key={slide.surface}
              onClick={() => goTo(i)}
              type="button"
            />
          ))}
          <button
            aria-label="Next"
            className={styles.heroArrow}
            onClick={() => goTo(active + 1)}
            type="button"
          >
            {feather('ChevronRight', 16)}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Flag-gated cookbook teaser — hidden until the cookbook flag flips. */
export function CookbookStrip(): React.ReactElement {
  return (
    <Link className={styles.cookbookStrip} to="/cookbook">
      <span className={styles.cookbookStripIcon}>
        {feather('BookOpen', 20)}
      </span>
      <span className={styles.cookbookStripText}>
        <span className={styles.cookbookStripTitle}>
          New: Cookbooks
          <span className={styles.cookbookStripBadge}>Recipes</span>
        </span>
        <span className={styles.cookbookStripBody}>
          Runnable patterns that go from problem to working demo to scaffolded
          starter code — auth and permissions laid out for each.
        </span>
      </span>
      <span className={styles.cookbookStripArrow}>
        {feather('ArrowRight', 18)}
      </span>
    </Link>
  );
}

const PATHS = [
  {
    title: 'Build with the APIs',
    body: 'Search, chat, and agents from your code — with client libraries for four languages.',
    icon: 'Code',
    href: '/api-info/client/getting-started/overview',
  },
  {
    title: 'Embed with the Web SDK',
    body: 'Permission-aware search and chat inside the apps your team already uses.',
    icon: 'Layout',
    href: '/libraries/web-sdk/overview',
  },
  {
    title: 'Connect your data',
    body: 'Bring any source into Glean with the Indexing API and connector framework.',
    icon: 'Database',
    href: '/api-info/indexing/getting-started/overview',
  },
  {
    title: 'Bring Glean to your IDE',
    body: 'Claude Code, Cursor, Codex, and any MCP host.',
    icon: 'Terminal',
    href: '/guides/mcp',
  },
];

export function PathCards(): React.ReactElement {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Choose your path</h2>
      <p className={styles.sectionSub}>Four ways to get started.</p>
      <div className={styles.pathGrid}>
        {PATHS.map((path) => (
          <Link className={styles.pathCard} key={path.title} to={path.href}>
            <span className={styles.pathIcon}>{feather(path.icon, 20)}</span>
            <span className={styles.pathTitle}>{path.title}</span>
            <span className={styles.pathBody}>{path.body}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

const QUICKSTART_FILENAMES = {
  python: 'main.py',
  typescript: 'main.ts',
  go: 'main.go',
  java: 'Main.java',
  curl: 'terminal',
} as const;

export function QuickstartTabs(): React.ReactElement {
  const [lang, setLang] = useState<keyof typeof QUICKSTART_FILENAMES>('python');
  const snippet = QUICKSTART_SNIPPETS[lang];

  return (
    <section className={styles.section}>
      <div className={styles.quickstart}>
        <div>
          <div className={styles.quickstartEyebrow}>Quickstart</div>
          <h3 className={styles.quickstartTitle}>
            One call to your knowledge graph
          </h3>
          <ol className={styles.quickstartSteps}>
            <li>
              <span className={styles.quickstartNum}>1</span>
              <span>
                Create an API token in{' '}
                <Link to="/get-started/authentication">Authentication</Link> —
                OAuth or a Glean-issued token.
              </span>
            </li>
            <li>
              <span className={styles.quickstartNum}>2</span>
              <span>
                Install a{' '}
                <Link to="/libraries/api-clients">client library</Link> for your
                language.
              </span>
            </li>
            <li>
              <span className={styles.quickstartNum}>3</span>
              <span>
                Run your first query — results come back ranked and
                permission-aware.
              </span>
            </li>
          </ol>
        </div>
        <div className={styles.quickstartCode}>
          <div className={styles.quickstartTabs}>
            {(
              Object.entries(QUICKSTART_SNIPPETS) as Array<
                [typeof lang, { label: string; code: string }]
              >
            ).map(([key, value]) => (
              <button
                className={`${styles.quickstartTab} ${
                  key === lang ? styles.quickstartTabActive : ''
                }`}
                key={key}
                onClick={() => setLang(key)}
                type="button"
              >
                {value.label}
              </button>
            ))}
          </div>
          <TerminalPanel
            className={styles.quickstartPanel}
            code={snippet.code}
            filename={QUICKSTART_FILENAMES[lang]}
          />
        </div>
      </div>
    </section>
  );
}

/** Install command that copies on click without triggering the card link. */
function SdkInstall({ command }: { command: string }): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const copy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable; the command stays readable on the card.
    }
  };

  return (
    <button
      aria-label={`Copy "${command}" to clipboard`}
      className={styles.sdkInstall}
      onClick={copy}
      title="Copy to clipboard"
      type="button"
    >
      <code>{command}</code>
      <span className={copied ? styles.sdkCopyDone : styles.sdkCopy}>
        {feather(copied ? 'Check' : 'Copy', 13)}
      </span>
    </button>
  );
}

export function SdkGrid(): React.ReactElement {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>API client libraries</h2>
      <div className={styles.sdkGrid}>
        {SDK_CARDS.map((sdk) => (
          <Link
            className={styles.sdkCard}
            key={sdk.name}
            to="/libraries/api-clients"
          >
            <span className={styles.sdkName}>
              <span className={styles.sdkIcon}>
                {getIcon(sdk.icon, 'glean', {
                  width: 18,
                  height: 18,
                  color: 'currentColor',
                })}
              </span>
              {sdk.name}
            </span>
            <SdkInstall command={sdk.install} />
          </Link>
        ))}
      </div>
    </section>
  );
}

const MCP_CARDS = [
  {
    title: 'Claude Code',
    body: 'Install the Glean plugins and search company knowledge from your terminal.',
    href: '/guides/mcp/claude-code',
    clientId: 'claude-code',
    mono: false,
  },
  {
    title: 'Cursor',
    body: 'Connect the Glean MCP server to Cursor for context-aware coding.',
    href: '/guides/mcp/cursor',
    clientId: 'cursor',
    mono: true,
  },
  {
    title: 'Codex',
    body: 'Install the Glean plugin for Codex — enterprise knowledge in your terminal.',
    href: '/guides/mcp/codex',
    clientId: 'codex',
    mono: true,
  },
];

export function McpCards(): React.ReactElement {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Bring Glean into your IDE</h2>
      <div className={styles.mcpGrid}>
        {MCP_CARDS.map((card) => (
          <Link className={styles.mcpCard} key={card.title} to={card.href}>
            <span
              className={`${styles.mcpIcon} ${card.mono ? styles.mcpIconMono : ''}`}
              dangerouslySetInnerHTML={{
                __html: getClientIcon(card.clientId) ?? '',
              }}
            />
            <span className={styles.mcpTitle}>
              {card.title}
              <span className={styles.mcpArrow}>
                {feather('ArrowUpRight', 15)}
              </span>
            </span>
            <span className={styles.mcpBody}>{card.body}</span>
          </Link>
        ))}
      </div>
      <p className={styles.mcpHostsNote}>
        Plus GitHub Copilot, Goose, Windsurf, and{' '}
        <Link to="/guides/mcp/supported-hosts">any MCP host</Link>.
      </p>
    </section>
  );
}

export function AgentsBand(): React.ReactElement {
  return (
    <section className={styles.section}>
      <div className={styles.agentsBand}>
        <div>
          <span className={styles.agentsPill}>Agents</span>
          <h2 className={styles.agentsTitle}>Framework-agnostic by design</h2>
          <p className={styles.agentsBody}>
            The agent toolkit exposes Glean retrieval as tools for whatever you
            build with — the knowledge graph comes along regardless of
            framework.
          </p>
          <div className={styles.agentsChips}>
            {['LangChain', 'OpenAI Agents SDK', 'Google ADK', 'MCP'].map(
              (chip) => (
                <span className={styles.agentsChip} key={chip}>
                  {chip}
                </span>
              ),
            )}
          </div>
          <Link className={styles.agentsCta} to="/guides/agents/toolkit">
            Explore the agent toolkit
            {feather('ArrowRight', 16)}
          </Link>
        </div>
        <TerminalPanel
          className={styles.agentsPanel}
          code={AGENTS_BAND_CODE}
          filename="tools.py"
          label="Agent toolkit"
        />
      </div>
    </section>
  );
}

/** The full redesigned homepage (handoff direction 1a), flag-gated. */
export default function HomeRedesign(): React.ReactElement {
  return (
    <div className={`${styles.page} home-redesign-root`}>
      <AnnouncementBand />
      <HeroCarousel />
      <FeatureFlag flag="cookbook">
        <CookbookStrip />
      </FeatureFlag>
      <PathCards />
      <QuickstartTabs />
      <SdkGrid />
      <McpCards />
      <AgentsBand />
    </div>
  );
}
