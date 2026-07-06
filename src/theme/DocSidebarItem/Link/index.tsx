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

import styles from './styles.module.css';

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
        {!isInternalLink && <IconExternalLink />}
      </Link>
    </li>
  );
}
