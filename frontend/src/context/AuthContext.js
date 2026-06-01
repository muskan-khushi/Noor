import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('noor_token');
    const saved = localStorage.getItem('noor_user');
    if (token && saved) {
      try {
        setUser(JSON.parse(saved));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Validate token with backend
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/me`)
          .then(res => setUser(res.data))
          .catch(() => {
            localStorage.removeItem('noor_token');
            localStorage.removeItem('noor_user');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
          })
          .finally(() => setLoading(false));
      } catch (_) {
        localStorage.removeItem('noor_token');
        localStorage.removeItem('noor_user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('noor_token', token);
    localStorage.setItem('noor_user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('noor_token');
    localStorage.removeItem('noor_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}