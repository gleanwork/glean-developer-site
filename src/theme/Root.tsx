import React from 'react';
import type { ReactNode } from 'react';
import FeatureFlagsProvider from '@theme/FeatureFlagsProvider';
import KeyboardShortcuts from './KeyboardShortcuts';
import Intercom from '@intercom/messenger-js-sdk';

export default function Root({ children }: { children: ReactNode }) {
  Intercom({
    app_id: 'a3ow6qrr',
  });

  return (
    <FeatureFlagsProvider>
      <KeyboardShortcuts />
      {children}
    </FeatureFlagsProvider>
  );
}
