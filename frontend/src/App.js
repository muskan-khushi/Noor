import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuroraBackground from './components/common/AuroraBackground';
import Navbar           from './components/common/Navbar';
import ProtectedRoute   from './components/common/ProtectedRoute';

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
          <Routes>
            <Route path="/"           element={<Landing />} />
            <Route path="/login"      element={<Login />} />
            <Route path="/register"   element={<Register />} />
            <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/gap-finder" element={<ProtectedRoute><GapFinderPage /></ProtectedRoute>} />
            <Route path="/hyperlocal" element={<ProtectedRoute><HyperLocalPage /></ProtectedRoute>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}