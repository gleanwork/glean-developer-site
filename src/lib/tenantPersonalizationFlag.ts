import { useContext, useEffect, useState } from 'react';
import { FeatureFlagsContext } from '@site/src/theme/Root';

export const TENANT_API_PERSONALIZATION_FLAG = 'tenant-api-personalization';

/**
 * Defers activation until after hydration. URL flag overrides are browser-only,
 * so using them during the initial render would select a different component
 * tree than the server-rendered page.
 */
export function useTenantApiPersonalizationEnabled(): boolean {
  const enabled = useContext(FeatureFlagsContext).isEnabled(
    TENANT_API_PERSONALIZATION_FLAG,
  );
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated && enabled;
}
