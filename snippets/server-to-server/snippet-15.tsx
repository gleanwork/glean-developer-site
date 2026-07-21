import { useEffect, useRef } from 'react';
import GleanWebSDK from '@gleanwork/web-sdk';

function SearchComponent() {
  const { token, loading } = useGuestAuth();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token || loading || !searchRef.current) return;

    GleanWebSDK.renderSearchBox(searchRef.current, {
      authMethod: 'token',
      authToken: token,
      backend: 'https://{your}-be.glean.com/',
      onAuthTokenRequired: async () => {
        const authProvider = createGuestAuthProvider({
          backend: 'https://{your}-be.glean.com/'
        });
        return await authProvider.getAuthToken();
      }
    });
  }, [token, loading]);

  if (loading) return <div>Loading...</div>;

  return <div ref={searchRef} />;
}
