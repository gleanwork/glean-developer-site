import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { ThemeClassNames } from '@docusaurus/theme-common';
import { isActiveSidebarItem } from '@docusaurus/plugin-content-docs/client';
import Link from '@docusaurus/Link';
import isInternalUrl from '@docusaurus/isInternalUrl';
import IconExternalLink from '@theme/Icon/ExternalLink';
import { Icon } from '@theme/Icons';
import { FeatureFlagsContext } from '@site/src/theme/Root';
import type { Props } from '@theme/DocSidebarItem/Link';
import experimentalData from '@site/src/data/experimental.json';
import type { ExperimentalData } from '@site/src/types/experimental';

import styles from './styles.module.css';

// Set of full doc ids (e.g. "api/platform-api/platform-agents-search") that are
// marked experimental via `x-glean-experimental` in the OpenAPI specs. Matching
// on the full doc id — not just the last segment — keeps the pill scoped to the
// exact endpoint, so a kebab collision in another API family can't mis-tag it.
const experimentalDocIds = new Set(
  (experimentalData as ExperimentalData).endpoints.map((e) => e.docId),
);

function isExperimentalItem(docId: string | undefined): boolean {
  return docId ? experimentalDocIds.has(docId) : false;
}

export default function DocSidebarItemLink({
  item,
  onItemClick,
  activePath,
  level,
  index,
  ...props
}: Props): ReactNode {
  const { href, label, className, autoAddBaseUrl } = item;
  const isActive = isActiveSidebarItem(item, activePath);
  const isExperimental = isExperimentalItem((item as any).docId);
  const isInternalLink = isInternalUrl(href);
  // Feature-flag gating: hide a link when it declares a `customProps.flag`
  // that isn't enabled (e.g. reveal via `?ff_platform-api=true`).
  const { isEnabled } = React.useContext(FeatureFlagsContext);
  const flag = (item as any).customProps?.flag as string | undefined;
  if (flag && !isEnabled(flag)) {
    return null;
  }
  return (
    <li
      className={clsx(
        ThemeClassNames.docs.docSidebarItemLink,
        ThemeClassNames.docs.docSidebarItemLinkLevel(level),
        'menu__list-item',
        className,
      )}
      key={label}
    >
      <Link
        className={clsx(
          'menu__link',
          !isInternalLink && styles.menuExternalLink,
          {
            'menu__link--active': isActive,
          },
        )}
        autoAddBaseUrl={autoAddBaseUrl}
        aria-current={isActive ? 'page' : undefined}
        to={href}
        {...(isInternalLink && {
          onClick: onItemClick ? () => onItemClick(item) : undefined,
        })}
        {...props}
      >
        {(item as any).customProps?.icon && (
          <Icon
            name={(item as any).customProps.icon}
            iconSet={(item as any).customProps?.iconSet || 'feather'}
            className={styles.sidebarIcon}
          />
        )}
        {label}
        {isExperimental && (
          <span className={styles.experimentalBadge} title="Experimental">
            Experimental
          </span>
        )}
        {!isInternalLink && <IconExternalLink />}
      </Link>
    </li>
  );
}
