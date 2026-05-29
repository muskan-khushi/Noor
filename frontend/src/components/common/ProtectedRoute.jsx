import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#64748b' }}>Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}
