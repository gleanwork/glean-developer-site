import { useEffect, useRef } from 'react';
import GleanWebSDK from '@gleanwork/web-sdk';

function SearchComponent() {
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchRef.current) return;

    // Render search box with SSO auth (default)
    GleanWebSDK.renderSearchBox(searchRef.current, {
      backend: 'https://your-server-id-be.glean.com/',
      searchBoxCustomizations: {
        placeholderText: 'Search your company...'
      }
    });
  }, []);

  return <div ref={searchRef} />;
}

export default SearchComponent;
