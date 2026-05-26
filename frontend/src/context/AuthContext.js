import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already authenticated on mount
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authAPI.me();
      setUser(response.data.user);
    } catch (err) {
      // Not authenticated - this is expected
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const register = async (name, email, password) => {
    setError(null);
    const response = await authAPI.register({ name, email, password });
    setUser(response.data.user);
    return response.data;
  };

  const login = async (email, password) => {
    setError(null);
    const response = await authAPI.login({ email, password });
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      // Ignore logout errors - still clear local state
      console.warn('Logout request failed:', err);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    isAuthenticated: !!user,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
