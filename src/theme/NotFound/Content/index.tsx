import React, { useEffect } from 'react';
import NotFoundContent from '@theme-original/NotFound/Content';
import type NotFoundContentType from '@theme/NotFound/Content';
import type { WrapperProps } from '@docusaurus/types';
import { useLocation } from '@docusaurus/router';
import { pageReferrer, trackEvent } from '@site/src/lib/analytics';

type Props = WrapperProps<typeof NotFoundContentType>;

/**
 * Reports each missing page with where the reader came from, to find broken
 * inbound links. The referrer is the host only, never the full URL.
 */
export default function NotFoundContentWrapper(
  props: Props,
): React.ReactElement {
  const { pathname } = useLocation();

  useEffect(() => {
    trackEvent('not_found', {
      path: pathname,
      referrer: pageReferrer(pathname),
    });
  }, [pathname]);

  return <NotFoundContent {...props} />;
}
