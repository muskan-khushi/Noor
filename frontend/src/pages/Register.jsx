import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerAPI } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import ErrorBanner from '../components/common/ErrorBanner';

const BOARDS  = ['Maharashtra','Tamil Nadu','Rajasthan','Kerala','Punjab','West Bengal','Andhra Pradesh','Karnataka','Gujarat','Uttar Pradesh'];
const EXAMS   = ['NEET','JEE Mains','CUET','NTSE'];
const CLASSES = ['9','10','11','12'];

export default function Register() {
  const [form, setForm] = useState({ name:'', email:'', password:'', class:'11', stateBoard:'', district:'', targetExam:'' });
  const [loading, setLoad] = useState(false);
  const [error, setError]  = useState('');
  const { login } = useAuth();
  const navigate  = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.stateBoard || !form.district || !form.targetExam) {
      setError('Please fill all required fields.'); return;
    }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoad(true); setError('');
    try {
      const { token, user } = await registerAPI(form);
      login(token, user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoad(false); }
  };

  return (
    <div className="page" style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'88px 24px 60px' }}>
      <div className="glass" style={{ width:'100%', maxWidth:500, borderRadius:28, padding:'44px 38px' }}>

        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:38, marginBottom:10, filter:'drop-shadow(0 0 16px rgba(255,212,184,0.38))' }}>نور</div>
          <h2 style={{
            fontFamily:"'Cormorant Garamond', serif",
            fontSize:27, fontWeight:400, color:'rgba(255,248,240,0.90)', marginBottom:5,
          }}>Create your account</h2>
          <p style={{ fontSize:13, color:'rgba(255,248,240,0.38)', fontWeight:300 }}>Free for all students</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="form-group">
            <label>Full name</label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Priya Sharma" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div className="form-group">
              <label>Class</label>
              <div style={{ position:'relative' }}>
                <select value={form.class} onChange={e => set('class', e.target.value)}>
                  {CLASSES.map(c => <option key={c}>{c}</option>)}
                </select>
                <Caret />
              </div>
            </div>
            <div className="form-group">
              <label>Target exam</label>
              <div style={{ position:'relative' }}>
                <select value={form.targetExam} onChange={e => set('targetExam', e.target.value)}>
                  <option value="">Select…</option>
                  {EXAMS.map(e => <option key={e}>{e}</option>)}
                </select>
                <Caret />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>State board</label>
            <div style={{ position:'relative' }}>
              <select value={form.stateBoard} onChange={e => set('stateBoard', e.target.value)}>
                <option value="">Select your board…</option>
                {BOARDS.map(b => <option key={b}>{b}</option>)}
              </select>
              <Caret />
            </div>
          </div>

          <div className="form-group">
            <label>District / city</label>
            <input type="text" value={form.district} onChange={e => set('district', e.target.value)} placeholder="e.g. Jodhpur" />
          </div>

          <ErrorBanner message={error} />

          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width:'100%', padding:'14px', fontSize:15, marginTop:4 }}>
            {loading
              ? <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <SpinDot /> Creating account…
                </span>
              : 'Create account ↗'}
          </button>

          <p style={{ textAlign:'center', fontSize:13, color:'rgba(255,248,240,0.38)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'#FFD4B8', fontWeight:500 }}>Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function Caret() {
  return (
    <span style={{
      position:'absolute', right:13, top:'50%', transform:'translateY(-50%)',
      pointerEvents:'none', color:'rgba(255,248,240,0.32)', fontSize:10,
    }}>▾</span>
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