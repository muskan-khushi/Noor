import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as loginAPI } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import ErrorBanner from '../components/common/ErrorBanner';

export default function Login() {
  const [email, setEmail]   = useState('');
  const [password, setPw]   = useState('');
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState('');
  const { user, login } = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Please enter a valid email.'); return; }
    if (password.length < 6)         { setError('Password must be at least 6 characters.'); return; }
    setLoad(true); setError('');
    try {
      const { token, user } = await loginAPI({ email, password });
      login(token, user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally { setLoad(false); }
  };

  return (
    <div className="page" style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'88px 24px 60px' }}>
      <div className="glass" style={{ width:'100%', maxWidth:420, borderRadius:28, padding:'44px 38px' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{
            fontSize:38, marginBottom:10,
            filter:'drop-shadow(0 0 16px rgba(255,212,184,0.38))',
          }}>نور</div>
          <h2 style={{
            fontFamily:"'Cormorant Garamond', serif",
            fontSize:27, fontWeight:400, color:'rgba(255,248,240,0.90)', marginBottom:5,
          }}>Welcome back</h2>
          <p style={{ fontSize:13, color:'rgba(255,248,240,0.38)', fontWeight:300 }}>
            Continue your preparation
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPw(e.target.value)} placeholder="••••••••" />
          </div>

          <ErrorBanner message={error} />

          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width:'100%', padding:'14px', fontSize:15, marginTop:4 }}>
            {loading
              ? <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <SpinDot /> Signing in…
                </span>
              : 'Sign in ↗'}
          </button>

          <p style={{ textAlign:'center', fontSize:13, color:'rgba(255,248,240,0.38)' }}>
            No account?{' '}
            <Link to="/register" style={{ color:'#FFD4B8', fontWeight:500 }}>Register free</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function SpinDot() {
  return (
    <span style={{
      width:14, height:14, borderRadius:'50%', display:'inline-block',
      border:'2px solid rgba(26,15,46,0.25)', borderTopColor:'#1A0F2E',
      animation:'spin 0.7s linear infinite',
    }} />
  );
}