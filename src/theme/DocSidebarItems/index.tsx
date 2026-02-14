import React, { memo, useContext, useMemo, type ReactNode } from 'react';
import {
  DocSidebarItemsExpandedStateProvider,
  useVisibleSidebarItems,
} from '@docusaurus/plugin-content-docs/client';
import DocSidebarItem from '@theme/DocSidebarItem';
import { FeatureFlagsContext } from '@site/src/theme/Root';
import type { Props } from '@theme/DocSidebarItems';

function filterItemsByFlags(
  items: Props['items'],
  isEnabled: (flag: string) => boolean,
): Props['items'] {
  return items
    .filter((item) => {
      const flag = (item as any).customProps?.flag;
      if (typeof flag === 'string') {
        return isEnabled(flag);
      }
      return true;
    })
    .map((item) => {
      if (item.type === 'category' && item.items) {
        return {
          ...item,
          items: [...filterItemsByFlags(item.items, isEnabled)],
        };
      }
      return item;
    })
    .filter((item) => {
      // Remove empty categories (all children were hidden)
      if (item.type === 'category') {
        return item.items && item.items.length > 0;
      }
      return true;
    });
}

function DocSidebarItems({ items, ...props }: Props): ReactNode {
  const { isEnabled } = useContext(FeatureFlagsContext);
  const flagFilteredItems = useMemo(
    () => filterItemsByFlags(items, isEnabled),
    [items, isEnabled],
  );
  const visibleItems = useVisibleSidebarItems(
    flagFilteredItems,
    props.activePath,
  );

  return (
    <DocSidebarItemsExpandedStateProvider>
      {visibleItems.map((item, index) => (
        <DocSidebarItem key={index} item={item} index={index} {...props} />
      ))}
    </DocSidebarItemsExpandedStateProvider>
  );
}

export default memo(DocSidebarItems);
