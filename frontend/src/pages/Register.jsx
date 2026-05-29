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
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoad(true); setError('');
    try {
      const { token, user } = await registerAPI(form);
      login(token, user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally { setLoad(false); }
  };

  const field = (label, key, type='text', placeholder='') => (
    <div className="form-group">
      <label>{label}</label>
      <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} />
    </div>
  );

  return (
    <div className="page" style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px' }}>
      <div className="card" style={{ width:'100%', maxWidth:520 }}>
        <h2 style={{ fontSize:26, fontWeight:800, marginBottom:4 }}>Create your account</h2>
        <p style={{ color:'#64748b', marginBottom:24 }}>Free for all students</p>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {field('Full Name','name','text','Priya Sharma')}
          {field('Email','email','email','you@example.com')}
          {field('Password','password','password','Min 6 characters')}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div className="form-group">
              <label>Class</label>
              <select value={form.class} onChange={e => set('class', e.target.value)}>
                {CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Target Exam</label>
              <select value={form.targetExam} onChange={e => set('targetExam', e.target.value)}>
                <option value="">Select…</option>
                {EXAMS.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>State Board</label>
            <select value={form.stateBoard} onChange={e => set('stateBoard', e.target.value)}>
              <option value="">Select your board…</option>
              {BOARDS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          {field('District / City','district','text','e.g. Jodhpur')}
          <ErrorBanner message={error} />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>
          <p style={{ textAlign:'center', fontSize:14, color:'#64748b' }}>
            Already have an account? <Link to="/login" style={{ color:'#f97316', fontWeight:600 }}>Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
