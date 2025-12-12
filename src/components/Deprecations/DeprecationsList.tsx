import type React from 'react';
import DeprecationsEntries from './DeprecationsEntries';
import type { EndpointGroup } from '../../types/deprecations';
import styles from './DeprecationsList.module.css';

interface DeprecationsListProps {
  endpoints: EndpointGroup[];
}

export default function DeprecationsList({
  endpoints,
}: DeprecationsListProps): React.ReactElement {
  return (
    <div className={styles.deprecationsList}>
      <DeprecationsEntries endpoints={endpoints} />
    </div>
  );
}
