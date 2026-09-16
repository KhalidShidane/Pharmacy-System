import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const data = await authApi.updateProfile(payload);
    setUser(data);
    return data;
  }, []);

  const changePassword = useCallback((payload) => authApi.changePassword(payload), []);

  const uploadAvatar = useCallback(async (file) => {
    const data = await authApi.uploadAvatar(file);
    setUser(data);
    return data;
  }, []);

  const can = useCallback((...permissions) => {
    if (!user) return false;
    return permissions.every((p) => user.permissions?.includes(p));
  }, [user]);

  const value = useMemo(
    () => ({ user, loading, login, logout, updateProfile, changePassword, uploadAvatar, can, isAuthenticated: Boolean(user) }),
    [user, loading, login, logout, updateProfile, changePassword, uploadAvatar, can]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
