import React, { useState } from 'react';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import FormTextInput from '@theme-original/ApiExplorer/FormTextInput';
import styles from './styles.module.css';

type Props = React.ComponentProps<typeof FormTextInput>;

export default function FormTextInputWrapper(props: Props): React.ReactElement {
  const [copied, setCopied] = useState(false);

  if (props.label !== 'Bearer Token') {
    return <FormTextInput {...props} />;
  }

  const copy = async () => {
    if (!props.value) return;
    try {
      await navigator.clipboard.writeText(props.value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access may be unavailable; the token remains selectable.
    }
  };

  return (
    <div className={styles.tokenField}>
      <FormTextInput {...props} />
      <button
        aria-label={copied ? 'Bearer token copied' : 'Copy bearer token'}
        className={styles.copyButton}
        onClick={copy}
        title={copied ? 'Copied' : 'Copy to clipboard'}
        type="button"
      >
        {getIcon(copied ? 'Check' : 'Copy', 'feather', {
          width: 16,
          height: 16,
          color: 'currentColor',
        })}
      </button>
    </div>
  );
}
