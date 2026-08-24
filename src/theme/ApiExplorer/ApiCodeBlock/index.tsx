import React from 'react';
import ApiCodeBlock from '@theme-original/ApiExplorer/ApiCodeBlock';
import { useTenantApiPersonalizationEnabled } from '@site/src/lib/tenantPersonalizationFlag';
import {
  personalizeApiUrlTextChildren,
  tenantApiUrlFromState,
  useTenantProfile,
} from '@site/src/lib/tenantProfile';

type Props = React.ComponentProps<typeof ApiCodeBlock>;

function PersonalizedApiCodeBlock({
  children,
  ...props
}: Props): React.ReactElement {
  const tenant = useTenantProfile();
  const personalizedChildren = personalizeApiUrlTextChildren(
    children,
    tenantApiUrlFromState(tenant),
  );
  return <ApiCodeBlock {...props}>{personalizedChildren}</ApiCodeBlock>;
}

export default function ApiCodeBlockWrapper(props: Props): React.ReactElement {
  const enabled = useTenantApiPersonalizationEnabled();
  return enabled ? (
    <PersonalizedApiCodeBlock {...props} />
  ) : (
    <ApiCodeBlock {...props} />
  );
}
