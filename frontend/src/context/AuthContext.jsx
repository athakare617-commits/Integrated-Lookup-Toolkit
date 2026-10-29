import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session exclusively from authentic stored token in localStorage
  useEffect(() => {
    async function initAuth() {
      try {
        const storedToken = localStorage.getItem('iltk_auth_token');
        const storedUser = localStorage.getItem('iltk_auth_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          api.setAuthToken(storedToken);

          // Verify token validity with backend
          try {
            const meRes = await api.getMe();
            if (meRes.success && meRes.user) {
              setUser(meRes.user);
              localStorage.setItem('iltk_auth_user', JSON.stringify(meRes.user));
            }
          } catch {
            // Token expired or invalid: clear session
            localStorage.removeItem('iltk_auth_token');
            localStorage.removeItem('iltk_auth_user');
            api.setAuthToken(null);
            setUser(null);
            setToken(null);
          }
        }
      } catch {
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success && res.user) {
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('iltk_auth_user', JSON.stringify(res.user));
      localStorage.setItem('iltk_auth_token', res.token);
      api.setAuthToken(res.token);
      return { success: true, user: res.user };
    }
    throw new Error(res.error || 'Login failed.');
  };

  const register = async (formData) => {
    const res = await api.register(formData);
    if (res.success && res.user) {
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('iltk_auth_user', JSON.stringify(res.user));
      localStorage.setItem('iltk_auth_token', res.token);
      api.setAuthToken(res.token);
      return { success: true, user: res.user };
    }
    throw new Error(res.error || 'Registration failed.');
  };

  const logout = async () => {
    try {
      if (user) {
        await api.logout({ email: user.email, name: user.name }).catch(() => {});
      }
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('iltk_auth_user');
      localStorage.removeItem('iltk_auth_token');
      api.setAuthToken(null);
    }
  };

  const regenerateApiKey = async () => {
    const res = await api.regenerateApiKey();
    if (res.success && res.apiKey) {
      const updatedUser = { ...user, apiKey: res.apiKey };
      setUser(updatedUser);
      localStorage.setItem('iltk_auth_user', JSON.stringify(updatedUser));
      return res.apiKey;
    }
    throw new Error(res.error || 'Failed to regenerate API key.');
  };

  const updateProfile = (data) => {
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('iltk_auth_user', JSON.stringify(updated));
    return updated;
  };

  const isAdmin = Boolean(
    user && (
      user.role === 'Administrator' ||
      user.role?.toLowerCase() === 'admin' ||
      user.role?.toLowerCase() === 'administrator'
    )
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        isAdmin,
        loading,
        login,
        register,
        logout,
        regenerateApiKey,
        updateProfile
      }}
    >
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

export default AuthContext;
