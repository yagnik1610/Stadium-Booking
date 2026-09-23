import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('stadium_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('stadium_token');

      if (savedToken) {
        try {
          const res = await authAPI.getProfile();
          if (res.success && res.user) {
            setUser(res.user);
            setToken(savedToken);
          } else {
            // Invalid token
            logout();
          }
        } catch (e) {
          // If 401 or network error
          if (e.message !== 'Network Error') {
            logout();
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    if (res.success && res.token) {
      localStorage.setItem('stadium_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    return null;
  };

  const register = async (userData) => {
    const res = await authAPI.register(userData);
    if (res.success && res.token) {
      localStorage.setItem('stadium_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    return null;
  };

  const logout = () => {
    localStorage.removeItem('stadium_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUserData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUserData } : updatedUserData));
  };

  const value = {
    user,
    token,
    loading,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
