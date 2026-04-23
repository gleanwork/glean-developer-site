import React, { ReactNode, useContext, useMemo } from 'react';
import { FeatureFlagsContext } from '../FeatureFlagsProvider/context';

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
  const { isEnabled } = useContext(FeatureFlagsContext);

  const enabled = useMemo(() => {
    return isEnabled(flag);
  }, [isEnabled, flag]);

  return enabled ? <>{children}</> : <>{fallback}</>;
}
