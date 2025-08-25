import React, { ReactNode, useContext, useMemo } from 'react';
import { FeatureFlagsContext } from '../theme/Root';

export type FeatureFlagProps = {
  flag: string;
  children: ReactNode;
  fallback?: ReactNode;
};

export default function FeatureFlag({
  flag,
  children,
  fallback = null,
}: FeatureFlagProps) {
  const { booleans } = useContext(FeatureFlagsContext);

  const enabled = useMemo(() => {
    return !!booleans[flag];
  }, [booleans, flag]);

  return enabled ? <>{children}</> : <>{fallback}</>;
}
