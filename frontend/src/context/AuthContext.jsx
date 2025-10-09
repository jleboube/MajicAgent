import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_TOKEN_KEY = 'rea_token';
const STORAGE_ROLE_KEY = 'rea_role';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_TOKEN_KEY));
  const [role, setRole] = useState(() => localStorage.getItem(STORAGE_ROLE_KEY));
  const [loading, setLoading] = useState(true);

  const applyToken = (nextToken, nextRole) => {
    if (nextToken) {
      localStorage.setItem(STORAGE_TOKEN_KEY, nextToken);
      setToken(nextToken);
    }

    if (nextRole) {
      localStorage.setItem(STORAGE_ROLE_KEY, nextRole);
      setRole(nextRole);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    const roleParam = params.get('role');

    if (tokenParam) {
      applyToken(tokenParam, roleParam);
      params.delete('token');
      params.delete('role');
      params.delete('auth');
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    }

    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_ROLE_KEY);
    setToken(null);
    setRole(null);
  };

  const value = useMemo(() => ({
    token,
    role,
    isAuthenticated: Boolean(token),
    loading,
    setToken: applyToken,
    logout
  }), [token, role, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
