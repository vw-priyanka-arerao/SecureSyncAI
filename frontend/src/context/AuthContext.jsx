import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createApiClient } from '../services/api';

const STORAGE_KEY = 'securesync-auth';
const AuthContext = createContext(null);

function readStoredAuth() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [credentials, setCredentials] = useState(() => readStoredAuth());
  const [user, setUser] = useState(() => credentials?.user || null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  const logout = useCallback(() => {
    setCredentials(null);
    setUser(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const api = useMemo(() => createApiClient(() => credentials, logout), [credentials, logout]);

  const loginWithPassword = useCallback(async (username, password) => {
    setIsBootstrapping(true);
    try {
      const previewApi = createApiClient(() => ({ username, password }), () => undefined);
      const me = await previewApi.me();
      const nextCredentials = { mode: 'basic', username, password, user: me };
      setCredentials(nextCredentials);
      setUser(me);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCredentials));
      return me;
    } finally {
      setIsBootstrapping(false);
    }
  }, []);

  const loginWithToken = useCallback(async (token) => {
    setIsBootstrapping(true);
    try {
      const previewApi = createApiClient(() => ({ mode: 'token', token }), () => undefined);
      const me = await previewApi.me();
      const nextCredentials = { mode: 'token', token, user: me };
      setCredentials(nextCredentials);
      setUser(me);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCredentials));
      return me;
    } finally {
      setIsBootstrapping(false);
    }
  }, []);

  const login = useCallback(async (payload) => {
    if (payload?.mode === 'token') {
      return loginWithToken(payload.token);
    }
    return loginWithPassword(payload.username, payload.password);
  }, [loginWithPassword, loginWithToken]);

  const refreshProfile = useCallback(async () => {
    if (!credentials?.token && (!credentials?.username || !credentials?.password)) {
      return null;
    }
    setIsBootstrapping(true);
    try {
      const me = await api.me();
      const nextCredentials = { ...credentials, user: me };
      setCredentials(nextCredentials);
      setUser(me);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCredentials));
      return me;
    } catch (error) {
      logout();
      throw error;
    } finally {
      setIsBootstrapping(false);
    }
  }, [api, credentials, logout]);

  const value = useMemo(() => ({
    credentials,
    user,
    api,
    login,
    loginWithPassword,
    loginWithToken,
    logout,
    refreshProfile,
    isBootstrapping,
    isAuthenticated: Boolean(user)
  }), [api, credentials, isBootstrapping, login, loginWithPassword, loginWithToken, logout, refreshProfile, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

