import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/auth.service';
import api, { setAccessToken } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((sessionUser, sessionToken) => {
    setUser(sessionUser);
    setToken(sessionToken);
    setAccessToken(sessionToken);
    connectSocket(sessionToken);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    setAccessToken(null);
    disconnectSocket();
  }, []);

  useEffect(() => {
    // Attempt to restore a session via the refresh-token cookie on load.
    (async () => {
      try {
        const refreshRes = await api.post('/auth/refresh');
        const newToken = refreshRes.data.data.accessToken;
        setAccessToken(newToken);
        const meRes = await authService.getMe();
        applySession(meRes.data.data.user, newToken);
      } catch (err) {
        clearSession();
      } finally {
        setLoading(false);
      }
    })();
  }, [applySession, clearSession]);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    applySession(res.data.data.user, res.data.data.accessToken);
    return res.data.data.user;
  };

  const register = async (name, email, password) => {
    const res = await authService.register({ name, email, password });
    // No session is created here - the account can't be used until the
    // email address is verified. Returns the response so the caller can
    // show a "check your email" screen.
    return res.data;
  };

  const verifyEmail = async (email, otp) => {
    const res = await authService.verifyEmail(email, otp);
    applySession(res.data.data.user, res.data.data.accessToken);
    return res.data.data.user;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      clearSession();
    }
  };

  const refreshUser = async () => {
    const res = await authService.getMe();
    setUser(res.data.data.user);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, verifyEmail, logout, refreshUser, isAdmin: user?.role === 'admin' }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
