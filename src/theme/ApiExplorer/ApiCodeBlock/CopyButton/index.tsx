import React from 'react';
import CopyButton from '@theme-original/ApiExplorer/ApiCodeBlock/CopyButton';
import { trackCodeCopy } from '@site/src/lib/analytics';
import styles from './styles.module.css';

type Props = React.ComponentProps<typeof CopyButton>;

/**
 * The OpenAPI theme passes the copy button only the code. Its code block
 * container carries the language as a `language-*` class, so read it there.
 */
export function codeBlockLanguage(element: Element): string | undefined {
  const container = element.closest('[class*="language-"]');
  const match = container?.className.match(/(?:^|\s)language-([\w-]+)/);
  return match?.[1];
}

/** Reports copies from API reference samples and responses. */
export default function CopyButtonWrapper(props: Props): React.ReactElement {
  return (
    <span
      className={styles.wrapper}
      onClickCapture={(event) =>
        trackCodeCopy(codeBlockLanguage(event.currentTarget))
      }
    >
      <CopyButton {...props} />
    </span>
  );
}
