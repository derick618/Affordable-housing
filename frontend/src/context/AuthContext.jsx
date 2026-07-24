import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import client, { ensureCsrfCookie } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await client.get('/api/user');
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchUser().finally(() => setLoading(false));
  }, [fetchUser]);

  const login = useCallback(async (email, password) => {
    await ensureCsrfCookie();
    await client.post('/api/login', { email, password });
    await fetchUser();
  }, [fetchUser]);

  const register = useCallback(async (payload) => {
    await ensureCsrfCookie();
    await client.post('/api/register', payload);
    await fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    await client.post('/api/logout');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
