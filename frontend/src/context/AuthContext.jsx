/**
 * @module AuthContext
 * @description Global auth state and actions for login/register/logout
 */
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { authApi, setAuthToken } from '../services/api';

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = 'taskflow_auth_token';

const persistToken = (token) => {
  if (!token) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  localStorage.setItem(AUTH_STORAGE_KEY, token);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authActionLoading, setAuthActionLoading] = useState(false);

  const applySession = useCallback((session) => {
    setToken(session.token);
    setUser(session.user);
    setAuthToken(session.token);
    persistToken(session.token);
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    persistToken(null);
  }, []);

  const register = useCallback(
    async (payload) => {
      setAuthActionLoading(true);
      try {
        const response = await authApi.register(payload);
        applySession(response.data);
      } finally {
        setAuthActionLoading(false);
      }
    },
    [applySession]
  );

  const login = useCallback(
    async (payload) => {
      setAuthActionLoading(true);
      try {
        const response = await authApi.login(payload);
        applySession(response.data);
      } finally {
        setAuthActionLoading(false);
      }
    },
    [applySession]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    const bootstrapSession = async () => {
      const savedToken = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!savedToken) {
        setLoading(false);
        return;
      }

      setAuthToken(savedToken);
      try {
        const me = await authApi.getMe();
        setToken(savedToken);
        setUser(me.data);
      } catch (error) {
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    bootstrapSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      authActionLoading,
      isAuthenticated: Boolean(token && user),
      register,
      login,
      logout,
    }),
    [user, token, loading, authActionLoading, register, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
