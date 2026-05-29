import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GapFinderPage from './pages/GapFinderPage';
import HyperLocalPage from './pages/HyperLocalPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/"            element={<Landing />} />
          <Route path="/login"       element={<Login />} />
          <Route path="/register"    element={<Register />} />
          <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/gap-finder"  element={<ProtectedRoute><GapFinderPage /></ProtectedRoute>} />
          <Route path="/hyperlocal"  element={<ProtectedRoute><HyperLocalPage /></ProtectedRoute>} />
          <Route path="*" element={<div style={{textAlign:'center',padding:'100px 20px'}}><h1>404</h1><p>Page not found</p><a href="/">Go home</a></div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
