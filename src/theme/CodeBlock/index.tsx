import React from 'react';
import CodeBlock from '@theme-original/CodeBlock';
import { useTenantApiPersonalizationEnabled } from '@site/src/lib/tenantPersonalizationFlag';
import {
  personalizeApiUrlTextChildren,
  tenantApiUrlFromState,
  useTenantProfile,
} from '@site/src/lib/tenantProfile';

type Props = React.ComponentProps<typeof CodeBlock>;

function PersonalizedCodeBlock({
  children,
  ...props
}: Props): React.ReactElement {
  const tenant = useTenantProfile();
  const content = personalizeApiUrlTextChildren(
    children,
    tenantApiUrlFromState(tenant),
  );
  return <CodeBlock {...props}>{content}</CodeBlock>;
}

export default function CodeBlockWrapper(props: Props): React.ReactElement {
  const enabled = useTenantApiPersonalizationEnabled();
  return enabled ? (
    <PersonalizedCodeBlock {...props} />
  ) : (
    <CodeBlock {...props} />
  );
}
