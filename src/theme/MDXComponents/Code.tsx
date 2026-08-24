import React from 'react';
import Code from '@theme-original/MDXComponents/Code';
import { useTenantApiPersonalizationEnabled } from '@site/src/lib/tenantPersonalizationFlag';
import {
  personalizeApiUrlTextChildren,
  tenantApiUrlFromState,
  useTenantProfile,
} from '@site/src/lib/tenantProfile';

type Props = React.ComponentProps<typeof Code>;

function PersonalizedInlineCode({
  children,
  ...props
}: Props): React.ReactElement {
  const tenant = useTenantProfile();
  const content = personalizeApiUrlTextChildren(
    children,
    tenantApiUrlFromState(tenant),
  );
  return <Code {...props}>{content}</Code>;
}

export default function InlineCodeWrapper(props: Props): React.ReactElement {
  const enabled = useTenantApiPersonalizationEnabled();
  return enabled ? <PersonalizedInlineCode {...props} /> : <Code {...props} />;
}
