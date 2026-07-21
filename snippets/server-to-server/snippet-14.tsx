import { createContext, useContext, useEffect, useState } from 'react';
import { createGuestAuthProvider } from '@gleanwork/web-sdk';

interface GuestAuthContextType {
  token: string | null;
  loading: boolean;
  error: Error | null;
  refreshToken: () => Promise<void>;
}

const GuestAuthContext = createContext<GuestAuthContextType | null>(null);

export function GuestAuthProvider({
  children,
  backend
}: {
  children: React.ReactNode;
  backend: string;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [provider, setProvider] = useState<any>(null);

  useEffect(() => {
    const initProvider = async () => {
      try {
        const authProvider = createGuestAuthProvider({ backend });
        setProvider(authProvider);
        const authToken = await authProvider.getAuthToken();
        setToken(authToken);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    initProvider();
  }, [backend]);

  const refreshToken = async () => {
    if (!provider) return;

    try {
      setLoading(true);
      const newToken = await provider.createAuthToken();
      setToken(newToken);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestAuthContext.Provider value={{ token, loading, error, refreshToken }}>
      {children}
    </GuestAuthContext.Provider>
  );
}

export function useGuestAuth() {
  const context = useContext(GuestAuthContext);
  if (!context) {
    throw new Error('useGuestAuth must be used within GuestAuthProvider');
  }
  return context;
}
