import type React from 'react';
import {
  type EndpointGroup as EndpointGroupType,
  getLocationFromPath,
} from '../../types/deprecations';
import DeprecationEntry from './DeprecationEntry';
import styles from './EndpointGroup.module.css';

interface EndpointGroupProps {
  group: EndpointGroupType;
  showRemovalDate?: boolean;
}

function MethodBadge({ method }: { method: EndpointGroupType['method'] }): React.ReactElement {
  return (
    <span className={`${styles.methodBadge} ${styles[method.toLowerCase()]}`}>
      {method}
    </span>
  );
}

export default function EndpointGroup({
  group,
  showRemovalDate = false,
}: EndpointGroupProps): React.ReactElement {
  const location = getLocationFromPath(group.path);

  return (
    <div className={styles.endpointGroup}>
      <div className={styles.groupHeader}>
        <div className={styles.endpointInfo}>
          <MethodBadge method={group.method} />
          <code className={styles.endpointPath}>{group.path}</code>
        </div>
        <span className={styles.location}>{location}</span>
      </div>
      <div className={styles.deprecationsList}>
        {group.deprecations.map((deprecation) => (
          <DeprecationEntry key={deprecation.id} entry={deprecation} showRemovalDate={showRemovalDate} />
        ))}
      </div>
    </div>
  );
}
