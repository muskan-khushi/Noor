import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuroraBackground from './components/common/AuroraBackground';
import Navbar           from './components/common/Navbar';
import ProtectedRoute   from './components/common/ProtectedRoute';
import ErrorBoundary    from './components/common/ErrorBoundary';

import Landing       from './pages/Landing';
import Login         from './pages/Login';
import Register      from './pages/Register';
import Dashboard     from './pages/Dashboard';
import GapFinderPage from './pages/GapFinderPage';
import HyperLocalPage from './pages/HyperLocalPage';

import './styles/global.css';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Fixed aurora + particles layer — sits behind everything */}
        <AuroraBackground />

        {/* All app content sits above the aurora */}
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
          <Navbar />
          <ErrorBoundary>
            <Routes>
              <Route path="/"           element={<Landing />} />
              <Route path="/login"      element={<Login />} />
              <Route path="/register"   element={<Register />} />
              <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/gap-finder" element={<ProtectedRoute><GapFinderPage /></ProtectedRoute>} />
              <Route path="/hyperlocal" element={<ProtectedRoute><HyperLocalPage /></ProtectedRoute>} />
              <Route path="*"           element={
                <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column' }}>
                  <h1 style={{ fontSize: 64, margin: 0 }}>404</h1>
                  <p style={{ color: 'rgba(255,248,240,0.5)' }}>Page not found.</p>
                </div>
              } />
            </Routes>
          </ErrorBoundary>
        </div>
      </Router>
    </AuthProvider>
  );
}