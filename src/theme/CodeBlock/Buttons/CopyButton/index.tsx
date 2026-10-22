import React from 'react';
import CopyButton from '@theme-original/CodeBlock/Buttons/CopyButton';
import type CopyButtonType from '@theme/CodeBlock/Buttons/CopyButton';
import type { WrapperProps } from '@docusaurus/types';
import { useCodeBlockContext } from '@docusaurus/theme-common/internal';
import { trackCodeCopy } from '@site/src/lib/analytics';
import styles from './styles.module.css';

type Props = WrapperProps<typeof CopyButtonType>;

/** Reports copies from Markdown code blocks, with the fence's language. */
export default function CopyButtonWrapper(props: Props): React.ReactElement {
  const { metadata } = useCodeBlockContext();
  return (
    <span
      className={styles.wrapper}
      onClickCapture={() => trackCodeCopy(metadata.language)}
    >
      <CopyButton {...props} />
    </span>
  );
}
