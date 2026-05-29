import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(localStorage.getItem('noor_token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('noor_token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null); setUser(null);
  }, []);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/api/auth/me')
        .then(res => setUser(res.data))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, [token, logout]);

  const login = (tok, userData) => {
    localStorage.setItem('noor_token', tok);
    api.defaults.headers.common['Authorization'] = `Bearer ${tok}`;
    setToken(tok); setUser(userData);
  };

  return <AuthContext.Provider value={{ user, token, login, logout, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
export { api };
