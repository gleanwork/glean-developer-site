import { useContext, useEffect, useState } from 'react';
import { useLocation } from '@docusaurus/router';
import { FeatureFlagsContext } from '../theme/Root';
import {
  PREVIEW_CONTENT_FLAG,
  PREVIEW_CONTENT_SESSION_KEY,
  previewGrantFromSearch,
} from './previewContent';

function readSessionGrant(): boolean {
  try {
    return window.sessionStorage.getItem(PREVIEW_CONTENT_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function writeSessionGrant(granted: boolean): void {
  try {
    if (granted) window.sessionStorage.setItem(PREVIEW_CONTENT_SESSION_KEY, '1');
    else window.sessionStorage.removeItem(PREVIEW_CONTENT_SESSION_KEY);
  } catch {
    // Storage can be unavailable (privacy mode); the URL grant still applies.
  }
}

/**
 * Whether preview registry items should show. Always `false` during SSR and
 * the first client render, so static HTML never contains preview items and
 * hydration matches; previews appear right after mount.
 */
export function usePreviewContent(): boolean {
  const { isEnabled } = useContext(FeatureFlagsContext);
  const { search } = useLocation();
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    const fromUrl = previewGrantFromSearch(search);
    if (fromUrl !== undefined) writeSessionGrant(fromUrl);
    setGranted(fromUrl ?? readSessionGrant());
  }, [search]);

  if (granted === null) return false;
  // An explicit `?ff_preview-content=false` wins over the flag, so a reviewer
  // can see the public view.
  if (previewGrantFromSearch(search) === false) return false;
  return granted || isEnabled(PREVIEW_CONTENT_FLAG);
}
