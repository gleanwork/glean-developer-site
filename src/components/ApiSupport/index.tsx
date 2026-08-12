import React from 'react';
import styles from './styles.module.css';

interface ApiSupportProps {
  clientApi?: boolean;
  indexingApi?: boolean;
  platformApi?: boolean;
}

export default function ApiSupport({
  clientApi = false,
  indexingApi = false,
  platformApi = false,
}: ApiSupportProps): React.JSX.Element {
  return (
    <div className={`${styles.support} margin-bottom--md`}>
      <span>Supported APIs:</span>
      {platformApi && (
        <span className={`${styles.badge} ${styles.platform}`}>
          Platform API
        </span>
      )}
      {clientApi && (
        <span className={`${styles.badge} ${styles.client}`}>Client API</span>
      )}
      {indexingApi && (
        <span className={`${styles.badge} ${styles.indexing}`}>
          Indexing API
        </span>
      )}
    </div>
  );
}
