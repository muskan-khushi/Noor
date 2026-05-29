import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as loginAPI } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import ErrorBanner from '../components/common/ErrorBanner';

export default function Login() {
  const [email,setEmail]   = useState('');
  const [password,setPw]   = useState('');
  const [loading,setLoad]  = useState(false);
  const [error,setError]   = useState('');
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async () => {
    setLoad(true); setError('');
    try {
      const { token, user } = await loginAPI({ email, password });
      login(token, user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally { setLoad(false); }
  };

  return (
    <div className="page" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="card" style={{ width:'100%', maxWidth:420 }}>
        <h2 style={{ fontSize:26, fontWeight:800, marginBottom:4 }}>Welcome back</h2>
        <p style={{ color:'#64748b', marginBottom:24 }}>Log in to continue your preparation</p>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPw(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key==='Enter' && handleSubmit()} />
          </div>
          <ErrorBanner message={error} />
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Logging in…' : 'Log In →'}
          </button>
          <p style={{ textAlign:'center', fontSize:14, color:'#64748b' }}>
            No account? <Link to="/register" style={{ color:'#f97316', fontWeight:600 }}>Register free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
