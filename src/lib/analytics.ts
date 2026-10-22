/**
 * Custom events for Vercel Web Analytics.
 *
 * Every event the site sends is declared in `AnalyticsEvents`, so that type is
 * the full list of what we collect. Rules for adding one:
 *
 * - Each event answers a question someone will act on. Name the question in
 *   the comment above the event.
 * - Two properties at most. The Vercel Pro plan keeps only two per event.
 * - Property values come from a fixed set: operation IDs, recipe IDs, client
 *   IDs, enum values. Never send free text, emails, tenant or instance URLs,
 *   tokens, or search queries.
 * - Site paths are the one exception, and only without the query string or
 *   fragment. Page views already carry them.
 *
 * `trackEvent` does nothing until the Vercel script is injected, which only
 * happens in production builds (see src/clientModules/vercelAnalytics.ts).
 * In development it logs the event to the console instead.
 */
import { track, type BeforeSendEvent } from '@vercel/analytics';
import type { TenantProfileErrorReason } from './tenantProfile';

/** Vercel rejects names, keys, and values longer than this. */
const MAX_LENGTH = 255;

export type StatusClass = '1xx' | '2xx' | '3xx' | '4xx' | '5xx' | 'network';

/** Which install command a reader copied. */
export type InstallProduct =
  | 'docs-mcp'
  | 'glean-plugin'
  | 'connector-builder'
  | 'api-client';

export type RecipeAction =
  | 'copy_prompt'
  | 'view_source'
  | 'preview_open'
  | 'run_open'
  | 'run_copy';

export type VideoMilestone = 'start' | 'half' | 'complete';

/** Homepage sections, set with `data-home-slot` in HomeRedesign. */
export type HomeSlot =
  | 'announcement'
  | 'hero'
  | 'paths'
  | 'quickstart'
  | 'sdks'
  | 'mcp'
  | 'agents';

export interface AnalyticsEvents {
  /** Which endpoints do readers try in the API Explorer, and do they fail? */
  api_request_sent: { operation: string; status_class: StatusClass };
  /** Does "Sign in with Glean" in the API Explorer work? */
  api_sign_in: { result: 'success' | 'error' | 'missing_url' };
  /** Do readers set up their Glean API URL, and why does it fail? */
  tenant_profile_set: {
    source: 'discovered' | 'manual';
    result: 'ok' | TenantProfileErrorReason;
  };
  /** Which install commands do readers copy, and for which AI client? */
  install_copied: { product: InstallProduct; client: string };
  /** Which recipes do readers act on, and how? */
  recipe_action: { recipe: string; action: RecipeAction };
  /** Which code samples do readers copy, by part of the site and language? */
  code_copied: { section: string; language: string };
  /** Do readers start the videos, and do they finish them? */
  video_play: { video: string; milestone: VideoMilestone };
  /** Where on the homepage do readers click, and where to? */
  home_cta: { slot: HomeSlot; target: string };
  /** Which missing pages do readers reach, and from where? */
  not_found: { path: string; referrer: string };
}

export type AnalyticsEventName = keyof AnalyticsEvents;

export function trackEvent<N extends AnalyticsEventName>(
  name: N,
  properties: AnalyticsEvents[N],
): void {
  const data: Record<string, string> = {};
  for (const [key, value] of Object.entries(properties)) {
    data[key] = String(value).slice(0, MAX_LENGTH);
  }

  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', name, data);
  }

  try {
    track(name, data);
  } catch {
    // Analytics must never break the page.
  }
}

/** Reports a code copy on the current page. */
export function trackCodeCopy(language: string | undefined): void {
  trackEvent('code_copied', {
    section: pageSection(window.location.pathname ?? '/'),
    language: language || 'text',
  });
}

/** Response status code to a class, or `network` when there is no response. */
export function statusClass(code: unknown): StatusClass {
  if (typeof code !== 'number' || code < 100 || code > 599) return 'network';
  return `${Math.floor(code / 100)}xx` as StatusClass;
}

/** The first path segment, such as `api` or `guides`; `home` for `/`. */
export function pageSection(pathname: string): string {
  const segment = pathname.split('/').find(Boolean);
  return segment ?? 'home';
}

/**
 * Where a link points: the path for links on this site, the host for others.
 * Never the query string, which can carry anything.
 */
export function linkTarget(href: string, origin: string): string {
  try {
    const url = new URL(href, origin);
    return url.origin === origin ? url.pathname : url.hostname;
  } catch {
    return 'unknown';
  }
}

/**
 * The path of the first page the reader loaded. The client module imports
 * this file at startup, before any client-side navigation.
 */
const landingPath =
  typeof window === 'undefined' ? undefined : window.location.pathname;

/**
 * Where the reader came from to reach `pathname`. `document.referrer` keeps
 * the landing page's referrer through client-side navigation, so it only
 * applies to the landing page; any later page was reached from this site.
 */
export function pageReferrer(pathname: string): string {
  if (pathname !== landingPath) return 'internal';
  return referrerSource(document.referrer, window.location.hostname);
}

/** The referring host, `internal` for this site, or `direct` for none. */
export function referrerSource(referrer: string, host: string): string {
  if (!referrer) return 'direct';
  try {
    const { hostname } = new URL(referrer);
    return hostname === host ? 'internal' : hostname;
  } catch {
    return 'unknown';
  }
}

/** UTM parameters are kept so campaign links stay attributable. */
const KEPT_PARAM = /^utm_(source|medium|campaign|term|content)$/;

/**
 * Applied to every page view and custom event before it leaves the browser.
 *
 * - Drops the OAuth callback page, whose URL carries an authorization code.
 * - Removes every query parameter except UTM ones. Feature-flag parameters
 *   (`ff_*`) and anything a reader pastes into a URL stay out of analytics.
 * - Removes the fragment.
 */
export function redactEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  let url: URL;
  try {
    url = new URL(event.url);
  } catch {
    return null;
  }

  if (url.pathname.startsWith('/oauth/')) return null;

  const kept = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    if (KEPT_PARAM.test(key)) kept.append(key, value);
  }
  url.search = kept.toString();
  url.hash = '';

  return { ...event, url: url.toString() };
}
