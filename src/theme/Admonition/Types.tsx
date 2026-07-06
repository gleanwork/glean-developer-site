import React, { type ComponentProps } from 'react';
import clsx from 'clsx';
import DefaultAdmonitionTypes from '@theme-original/Admonition/Types';
import AdmonitionLayout from '@theme/Admonition/Layout';
import IconInfo from '@theme/Admonition/Icon/Info';

type AdmonitionProps = ComponentProps<typeof AdmonitionLayout>;

// Custom `experimental` admonition used on API pages for endpoints marked with
// `x-glean-experimental`. Reuses the Info icon but renders with the orange
// palette defined for `.theme-admonition-experimental` in src/css/custom.css,
// matching the "Experimental" sidebar pill.
function ExperimentalAdmonition(props: AdmonitionProps): React.ReactElement {
  return (
    <AdmonitionLayout
      {...props}
      icon={props.icon ?? <IconInfo />}
      title={props.title ?? 'experimental'}
      className={clsx('alert', props.className)}
    >
      {props.children}
    </AdmonitionLayout>
  );
}

const AdmonitionTypes = {
  ...DefaultAdmonitionTypes,
  experimental: ExperimentalAdmonition,
};

export default AdmonitionTypes;
