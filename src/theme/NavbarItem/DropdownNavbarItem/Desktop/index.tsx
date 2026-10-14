/**
 * Ejected from @docusaurus/theme-classic 3.10.2
 * (src/theme/NavbarItem/DropdownNavbarItem/Desktop/index.tsx).
 *
 * Changed so navbar dropdowns open on click, like the Docs MCP menu, and not
 * on hover:
 * - no `dropdown--hoverable` class, so Infima's :hover rule doesn't open it
 * - a click on the label toggles the menu
 * - Escape closes it and returns focus to the label
 * - choosing an item closes it
 *
 * Check this file against upstream when upgrading Docusaurus.
 */

import React, { useState, useRef, useEffect, type ReactNode } from 'react';
import clsx from 'clsx';
import NavbarNavLink from '@theme/NavbarItem/NavbarNavLink';
import NavbarItem from '@theme/NavbarItem';
import type { Props } from '@theme/NavbarItem/DropdownNavbarItem/Desktop';

export default function DropdownNavbarItemDesktop({
  items,
  position,
  className,
  onClick,
  ...props
}: Props): ReactNode {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent | TouchEvent | FocusEvent,
    ) => {
      if (
        !dropdownRef.current ||
        dropdownRef.current.contains(event.target as Node)
      ) {
        return;
      }
      setShowDropdown(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('focusin', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('focusin', handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div
      ref={dropdownRef}
      className={clsx('navbar__item', 'dropdown', {
        'dropdown--right': position === 'right',
        'dropdown--show': showDropdown,
      })}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && showDropdown) {
          setShowDropdown(false);
          dropdownRef.current
            ?.querySelector<HTMLElement>(':scope > .navbar__link')
            ?.focus();
        }
      }}
    >
      <NavbarNavLink
        aria-haspopup="true"
        aria-expanded={showDropdown}
        role="button"
        // # hash permits to make the <a> tag focusable in case no link target
        // See https://github.com/facebook/docusaurus/pull/6003
        // There's probably a better solution though...
        href={props.to ? undefined : '#'}
        className={clsx('navbar__link', className)}
        {...props}
        onClick={
          props.to
            ? undefined
            : (e) => {
                e.preventDefault();
                setShowDropdown(!showDropdown);
              }
        }
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowDropdown(!showDropdown);
          }
        }}
      >
        {props.children ?? props.label}
      </NavbarNavLink>
      <ul className="dropdown__menu" onClick={() => setShowDropdown(false)}>
        {items.map((childItemProps, i) => (
          <NavbarItem
            isDropdownItem
            activeClassName="dropdown__link--active"
            {...childItemProps}
            key={i}
          />
        ))}
      </ul>
    </div>
  );
}
