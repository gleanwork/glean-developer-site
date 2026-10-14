import React from 'react';
import useIsBrowser from '@docusaurus/useIsBrowser';
import SearchBar from '@theme-original/SearchBar';

function isApplePlatform(): boolean {
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
}

// Wraps the Glean search plugin's SearchBar to show the shortcut that opens
// it (bound in src/theme/KeyboardShortcuts.tsx). The hint renders only in the
// browser, so it is never wrong for the reader's platform.
export default function SearchBarWrapper(): React.JSX.Element {
  const isBrowser = useIsBrowser();

  return (
    <div className="navbar-search">
      <SearchBar />
      {isBrowser && (
        <kbd className="navbar-search__shortcut" aria-hidden="true">
          {isApplePlatform() ? '⌘K' : 'Ctrl K'}
        </kbd>
      )}
    </div>
  );
}
