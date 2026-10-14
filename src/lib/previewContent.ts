/**
 * Preview content: one switch for every registry item (recipes, videos) whose
 * JSON says `visibility: "preview"`.
 *
 * - The registry's `visibility` is the source of truth. Nothing is gated by id.
 * - At runtime, previews show when the `preview-content` feature flag is on:
 *   from Edge Config / build flags (e.g. `allowedUsers`), or `?ff_preview-content=true`.
 *   The URL grant is remembered for the browser session, so reviewers can click
 *   around; `?ff_preview-content=false` clears it.
 * - Preview items still ship in every build: hidden, not secret.
 */
export const PREVIEW_CONTENT_FLAG = 'preview-content';
export const PREVIEW_CONTENT_PARAM = `ff_${PREVIEW_CONTENT_FLAG}`;
export const PREVIEW_CONTENT_SESSION_KEY = `ff:${PREVIEW_CONTENT_FLAG}`;

export type ContentVisibility = 'public' | 'preview';

/** Public items always show; preview items show only when previews are enabled. */
export function isContentVisible(
  item: { visibility: ContentVisibility },
  previewsEnabled: boolean,
): boolean {
  return item.visibility === 'public' || previewsEnabled;
}

/**
 * The URL's explicit grant, if any: `true` for `?ff_preview-content=true|1`,
 * `false` for any other value, `undefined` when the param is absent.
 */
export function previewGrantFromSearch(search: string): boolean | undefined {
  const value = new URLSearchParams(search).get(PREVIEW_CONTENT_PARAM);
  if (value === null) return undefined;
  return value === 'true' || value === '1';
}
