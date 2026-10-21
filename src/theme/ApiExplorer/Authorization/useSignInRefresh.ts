import { useEffect, useReducer, useRef, useState } from 'react';
import {
  getSignInSession,
  isSignInStorageEvent,
  REFRESH_LEAD_MS,
  refreshSignIn,
  signInState,
} from '@site/src/components/ApiOAuth/oauth';

// setTimeout overflows above 2^31 - 1 ms (about 24.8 days).
const MAX_TIMEOUT_MS = 2 ** 31 - 1;
// After a failed refresh that kept the refresh token (a network error or a
// server error), retry after this delay, doubling up to the maximum.
export const RETRY_MIN_MS = 30 * 1000;
const RETRY_MAX_MS = 5 * 60 * 1000;

/**
 * Keep a signed-in token fresh. When `token` came from signing in to
 * `serverUrl`, refresh it shortly before it expires, and again whenever the
 * tab becomes visible after it was due, since timers do not run while a
 * laptop sleeps. A refresh that fails but keeps the refresh token is
 * retried with backoff, and at once when the browser comes back online.
 * Each new token goes to `onRefreshed`.
 *
 * Returns true while a refresh is in flight. The component also re-renders
 * when the token expires without a refresh, so its signed-in state stays
 * current.
 */
export function useSignInRefresh(
  serverUrl: string | null,
  token: string | undefined,
  onRefreshed: (token: string) => void,
): boolean {
  const [refreshing, setRefreshing] = useState(false);
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  const onRefreshedRef = useRef(onRefreshed);
  onRefreshedRef.current = onRefreshed;

  useEffect(() => {
    if (
      !serverUrl ||
      !token ||
      signInState(serverUrl, token) === 'signed-out'
    ) {
      return undefined;
    }
    // The sign-in this token came from. Other tabs may refresh it, but a
    // newer sign-in gets a new id and is never picked up here.
    const sessionId = getSignInSession(serverUrl)?.id;
    if (!sessionId) {
      return undefined;
    }
    let cancelled = false;
    let inFlight = false;
    // No refresh request before this time, after a failed one.
    let retryAt = 0;
    let retryDelay = RETRY_MIN_MS;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const scheduleAt = (time: number) => {
      clearTimeout(timer);
      timer = setTimeout(
        check,
        Math.min(Math.max(time - Date.now(), 0), MAX_TIMEOUT_MS),
      );
    };

    const refresh = async () => {
      if (inFlight) {
        return;
      }
      inFlight = true;
      setRefreshing(true);
      let fresh: string | null = null;
      try {
        fresh = await refreshSignIn(serverUrl, token, sessionId);
      } catch {
        // Network error: the refresh token is kept for the next try.
      }
      inFlight = false;
      if (cancelled) {
        return;
      }
      setRefreshing(false);
      if (fresh) {
        // The new token re-runs this effect with a new schedule.
        onRefreshedRef.current(fresh);
        return;
      }
      // A rejected refresh clears the refresh token, so this backoff only
      // delays retries of a refresh token that is still stored.
      retryAt = Date.now() + retryDelay;
      retryDelay = Math.min(retryDelay * 2, RETRY_MAX_MS);
      rerender();
      check();
    };

    const resetRetry = () => {
      retryAt = 0;
      retryDelay = RETRY_MIN_MS;
    };

    function check() {
      if (cancelled) {
        return;
      }
      const session = getSignInSession(serverUrl);
      if (!session || session.id !== sessionId) {
        // Signed out, or signed in again in another tab.
        rerender();
        return;
      }
      if (session.accessToken !== token) {
        // Another tab, or this page before it closed, refreshed. Pick up
        // the new token. That needs no request, so an earlier failure here
        // does not block it.
        if (session.expiresAt === undefined || Date.now() < session.expiresAt) {
          onRefreshedRef.current(session.accessToken);
        } else if (Date.now() < retryAt) {
          scheduleAt(retryAt);
        } else {
          void refresh();
        }
        return;
      }
      if (session.expiresAt === undefined) {
        return;
      }
      const now = Date.now();
      const canRefresh = Boolean(session.refreshToken);
      const dueAt = canRefresh
        ? Math.max(session.expiresAt - REFRESH_LEAD_MS, retryAt)
        : session.expiresAt;
      if (now < dueAt) {
        if (now >= session.expiresAt) {
          // Expired while a retry waits: show it now.
          rerender();
        }
        // Wake at expiry too, so the label changes on time.
        scheduleAt(
          now < session.expiresAt ? Math.min(dueAt, session.expiresAt) : dueAt,
        );
      } else if (canRefresh) {
        void refresh();
      } else {
        rerender();
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        resetRetry();
        check();
      }
    };
    const onOnline = () => {
      resetRetry();
      check();
    };
    // Another tab refreshed, signed in again, or cleared the sign-in.
    const onStorage = (event: StorageEvent) => {
      if (isSignInStorageEvent(event)) {
        check();
      }
    };

    check();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    window.addEventListener('storage', onStorage);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('storage', onStorage);
      if (inFlight) {
        setRefreshing(false);
      }
    };
  }, [serverUrl, token]);

  return refreshing;
}
