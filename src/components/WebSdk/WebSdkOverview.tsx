import React, { useState } from 'react';
import Link from '@docusaurus/Link';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import TerminalPanel from '../home/TerminalPanel';
import BrowserFrame from '../BrowserFrame';
import styles from './webSdk.module.css';
import {
  MockAutocomplete,
  MockChat,
  MockModalSearch,
  MockRecommendations,
  MockSettings,
  MockSidebar,
} from './mocks';
import { PortalPage } from './mocks/primitives';

function feather(name: string, size = 16): React.ReactNode {
  return getIcon(name, 'feather', {
    width: size,
    height: size,
    color: 'currentColor',
  });
}

/** Copyable install command pill. */
function InstallPill({ command }: { command: string }): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable; the command stays readable.
    }
  };

  return (
    <button
      aria-label={`Copy "${command}" to clipboard`}
      className={styles.install}
      onClick={copy}
      title="Copy to clipboard"
      type="button"
    >
      <code>{command}</code>
      <span className={copied ? styles.installCopyDone : styles.installCopy}>
        {feather(copied ? 'Check' : 'Copy', 13)}
      </span>
    </button>
  );
}

interface Tile {
  name: string;
  desc: string;
  call: string;
  href: string;
  badge?: { label: string; warn?: boolean };
  stage: React.ReactNode;
  flushStage?: boolean;
}

const TILES: Tile[] = [
  {
    name: 'Glean Chat',
    desc: 'A full AI assistant grounded in your company knowledge, with citations back to the source.',
    call: 'renderChat(element, options)',
    href: '/libraries/web-sdk/components/chat',
    stage: <MockChat />,
    flushStage: true,
  },
  {
    name: 'Search box + results',
    desc: 'Compose an autocomplete search box with a full results page for a custom search experience.',
    call: 'renderSearchBox(element, options)',
    href: '/libraries/web-sdk/components/autocomplete',
    stage: <MockAutocomplete />,
  },
  {
    name: 'Modal Search',
    desc: 'Attach a complete search overlay to any input on your page — one method call.',
    call: 'attach(inputElement, options)',
    href: '/libraries/web-sdk/components/modal-search',
    stage: (
      <>
        <PortalPage bodyBars={4} />
        <MockModalSearch />
      </>
    ),
    flushStage: true,
  },
  {
    name: 'Recommendations',
    desc: 'Contextual suggestions for the current page, with a built-in search box.',
    call: 'renderRecommendations(element, options)',
    href: '/libraries/web-sdk/components/recommendations',
    stage: <MockRecommendations />,
    flushStage: true,
  },
  {
    name: 'Glean Settings',
    desc: 'Let users connect personal datasources like GitHub and Slack without leaving your app.',
    call: 'renderSettings(element, options)',
    href: '/libraries/web-sdk/components/settings',
    badge: { label: 'Beta' },
    stage: <MockSettings />,
    flushStage: true,
  },
  {
    name: 'Sidebar Search',
    desc: 'A slide-out panel with search and contextual recommendations.',
    call: 'openSidebar(options)',
    href: '/libraries/web-sdk/components/sidebar',
    badge: { label: 'Deprecated', warn: true },
    stage: (
      <>
        <PortalPage bodyBars={4} />
        <MockSidebar />
      </>
    ),
    flushStage: true,
  },
];

const QUICKSTART = {
  npm: {
    label: 'npm',
    filename: 'search.ts',
    code: `import { renderSearchBox } from '@gleanwork/web-sdk'

renderSearchBox(document.getElementById('search'), {
  backend: 'https://acme-be.glean.com/',
  onSearch: (query) => {
    location.assign('/search?q=' + encodeURIComponent(query))
  },
})`,
  },
  script: {
    label: 'Script tag',
    filename: 'index.html',
    code: `<script defer src="https://app.glean.com/embedded-search-latest.min.js"></script>

<script>
  window.addEventListener('glean:ready', () => {
    window.GleanWebSDK.renderSearchBox(document.getElementById('search'), {
      backend: 'https://acme-be.glean.com/',
      onSearch: (query) => {
        location.assign('/search?q=' + encodeURIComponent(query))
      },
    })
  })
</script>`,
  },
} as const;

function Quickstart(): React.ReactElement {
  const [tab, setTab] = useState<keyof typeof QUICKSTART>('npm');
  const active = QUICKSTART[tab];

  return (
    <section>
      <div className={styles.quickstart}>
        <div>
          <div className={styles.quickstartEyebrow}>Quickstart</div>
          <h2 className={styles.quickstartTitle}>
            A search box in three steps
          </h2>
          <ol className={styles.quickstartSteps}>
            <li>
              <span className={styles.quickstartNum}>1</span>
              <span>
                Add the SDK — install <code>@gleanwork/web-sdk</code> from npm,
                or load the script tag from your Glean web app domain.
              </span>
            </li>
            <li>
              <span className={styles.quickstartNum}>2</span>
              <span>
                Render a container element with <code>position: relative</code>{' '}
                and <code>display: block</code>.
              </span>
            </li>
            <li>
              <span className={styles.quickstartNum}>3</span>
              <span>
                Call <code>renderSearchBox</code> — users sign in with your
                existing SSO, and every result respects their permissions. See{' '}
                <Link to="/libraries/web-sdk/authentication/overview">
                  Authentication
                </Link>{' '}
                for token-based options.
              </span>
            </li>
          </ol>
        </div>
        <div>
          <div className={styles.quickstartTabs}>
            {(
              Object.entries(QUICKSTART) as Array<
                [
                  keyof typeof QUICKSTART,
                  (typeof QUICKSTART)[keyof typeof QUICKSTART],
                ]
              >
            ).map(([key, value]) => (
              <button
                className={`${styles.quickstartTab} ${
                  key === tab ? styles.quickstartTabActive : ''
                }`}
                key={key}
                onClick={() => setTab(key)}
                type="button"
              >
                {value.label}
              </button>
            ))}
          </div>
          <TerminalPanel code={active.code} copy filename={active.filename} />
        </div>
      </div>
    </section>
  );
}

const PLATFORMS = [
  {
    name: 'React',
    body: 'Wrap the SDK in components and hooks for your React app.',
    href: '/libraries/web-sdk/guides/react',
    icon: 'Code',
  },
  {
    name: 'SharePoint',
    body: 'Ship Glean search inside SharePoint with an SPFx web part.',
    href: '/libraries/web-sdk/guides/sharepoint',
    icon: 'Grid',
  },
  {
    name: 'Zendesk',
    body: 'Add Glean to your help center theme and agent workspace.',
    href: '/libraries/web-sdk/guides/zendesk',
    icon: 'LifeBuoy',
  },
  {
    name: 'LumApps',
    body: 'Embed Glean widgets in your LumApps intranet pages.',
    href: '/libraries/web-sdk/guides/lumapps',
    icon: 'Layout',
  },
  {
    name: 'Brightspot',
    body: 'Integrate Glean search into Brightspot-powered sites.',
    href: '/libraries/web-sdk/guides/brightspot',
    icon: 'Globe',
  },
];

const AUTH_CARDS = [
  {
    name: 'SSO by default',
    body: 'No extra setup — users sign in with your existing identity provider the first time a widget loads.',
    href: '/libraries/web-sdk/authentication/default-sso',
    icon: 'Users',
  },
  {
    name: 'Server-to-server tokens',
    body: 'Mint short-lived user tokens on your backend and pass them to the SDK for a fully seamless session.',
    href: '/libraries/web-sdk/authentication/server-to-server',
    icon: 'Key',
  },
  {
    name: 'Third-party cookies',
    body: 'Understand how browser cookie policies affect embedded sessions, and how the SDK handles them.',
    href: '/libraries/web-sdk/3rd-party-cookies',
    icon: 'Shield',
  },
];

export default function WebSdkOverview(): React.ReactElement {
  return (
    <div className={`${styles.root} web-sdk-root`}>
      <header className={styles.banner}>
        <span className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          Web SDK
        </span>
        <h1 className={styles.title}>Embed Glean anywhere</h1>
        <p className={styles.sub}>
          Drop permission-aware search, AI chat, and contextual recommendations
          into any internal surface. Every component is a one-line render call
          backed by your organization&apos;s Glean instance.
        </p>
        <div className={styles.ctas}>
          <button
            className={styles.primaryCta}
            onClick={() => {
              const reduced =
                typeof window.matchMedia === 'function' &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;
              document
                .getElementById('components')
                ?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
            }}
            type="button"
          >
            Browse components
            {feather('ArrowRight')}
          </button>
          <Link
            className={styles.secondaryCta}
            to="https://app.glean.com/meta/browser_api/index.html"
          >
            {feather('BookOpen')}
            SDK reference
          </Link>
          <InstallPill command="npm install @gleanwork/web-sdk" />
        </div>
      </header>

      <section id="components">
        <h2 className={styles.sectionTitle}>Six components, one SDK</h2>
        <p className={styles.sectionSub}>
          The previews below are illustrative, rendered with sample data from a
          fictional engineering portal — in your app, each component renders
          live against your organization&apos;s Glean instance.
        </p>
        <div className={styles.gallery}>
          {TILES.map((tile) => (
            <Link className={styles.tile} key={tile.name} to={tile.href}>
              <div
                aria-hidden="true"
                className={`${styles.tileStage} ${
                  tile.flushStage ? styles.tileStageFlush : ''
                }`}
              >
                {tile.stage}
              </div>
              <div className={styles.tileBody}>
                <span className={styles.tileName}>
                  {tile.name}
                  {tile.badge ? (
                    <span
                      className={`${styles.tileBadge} ${
                        tile.badge.warn ? styles.tileBadgeWarn : ''
                      }`}
                    >
                      {tile.badge.label}
                    </span>
                  ) : null}
                  <span className={styles.tileArrow}>
                    {feather('ArrowRight')}
                  </span>
                </span>
                <span className={styles.tileDesc}>{tile.desc}</span>
                <span className={styles.tileCall}>{tile.call}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Quickstart />

      <section>
        <h2 className={styles.sectionTitle}>Works where your team works</h2>
        <p className={styles.sectionSub}>
          Step-by-step guides for the platforms teams embed Glean into most.
        </p>
        <div className={styles.cardRow}>
          {PLATFORMS.map((platform) => (
            <Link
              className={styles.card}
              key={platform.name}
              to={platform.href}
            >
              <span className={styles.cardIcon}>
                {feather(platform.icon, 18)}
              </span>
              <span className={styles.cardTitle}>{platform.name}</span>
              <span className={styles.cardBody}>{platform.body}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className={styles.sectionTitle}>Authentication</h2>
        <p className={styles.sectionSub}>
          Widgets authenticate real users, so every search result and chat
          answer is scoped to what that person can already see.
        </p>
        <div className={styles.cardRow}>
          {AUTH_CARDS.map((card) => (
            <Link className={styles.card} key={card.name} to={card.href}>
              <span className={styles.cardIcon}>{feather(card.icon, 18)}</span>
              <span className={styles.cardTitle}>{card.name}</span>
              <span className={styles.cardBody}>{card.body}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
