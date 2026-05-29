import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getReports } from '../api/gapFinder';
import { getHistory } from '../api/hyperlocalGen';
import Loader from '../components/common/Loader';

export default function Dashboard() {
  const { user } = useAuth();
  const [reports, setReports]   = useState([]);
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      getReports().then(setReports).catch(err => console.error('Failed to load data:', err)),
      getHistory().then(setHistory).catch(err => console.error('Failed to load data:', err)),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader message="Loading your dashboard…" />;

  return (
    <div className="page container">
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontSize:30, fontWeight:800 }}>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p style={{ color:'#64748b', marginTop:4 }}>
          {user?.stateBoard} Board · {user?.targetExam || 'No exam set'} · District: {user?.district}
        </p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20, marginBottom:40 }}>
        <Link to="/gap-finder" style={{ textDecoration:'none' }}>
          <div className="card" style={{ borderLeft:'4px solid #ef4444', cursor:'pointer', transition:'box-shadow 0.15s' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
            <h3 style={{ fontSize:18, fontWeight:700, marginBottom:6 }}>Gap Finder</h3>
            <p style={{ color:'#64748b', fontSize:14 }}>Upload your syllabus and find what's missing before your national exam.</p>
            <div style={{ marginTop:16, color:'#f97316', fontWeight:600, fontSize:14 }}>Start analysis →</div>
          </div>
        </Link>
        <Link to="/hyperlocal" style={{ textDecoration:'none' }}>
          <div className="card" style={{ borderLeft:'4px solid #f97316', cursor:'pointer' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🌍</div>
            <h3 style={{ fontSize:18, fontWeight:700, marginBottom:6 }}>Localise Content</h3>
            <p style={{ color:'#64748b', fontSize:14 }}>Rewrite any textbook problem using examples from your region.</p>
            <div style={{ marginTop:16, color:'#f97316', fontWeight:600, fontSize:14 }}>Localise now →</div>
          </div>
        </Link>
      </div>

      {reports.length > 0 && (
        <div style={{ marginBottom:32 }}>
          <h2 style={{ fontSize:20, fontWeight:700, marginBottom:16 }}>Recent Gap Reports</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {reports.slice(0,5).map(r => (
              <div key={r._id} className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', flexWrap:'wrap', gap:12 }}>
                <div>
                  <span style={{ fontWeight:700 }}>{r.targetExam} — {r.subject}</span>
                  <span style={{ color:'#64748b', fontSize:13, marginLeft:12 }}>{r.stateBoard}</span>
                </div>
                <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <span style={{ background:'#fee2e2', color:'#b91c1c', padding:'2px 10px', borderRadius:999, fontSize:12, fontWeight:700 }}>{r.criticalGaps} Critical</span>
                  <span style={{ color:'#64748b', fontSize:13 }}>{r.totalGapsFound} total gaps</span>
                  <Link to={`/gap-finder`} style={{ color:'#f97316', fontWeight:600, fontSize:13 }}>View →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, marginBottom:16 }}>Recent Localisations</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {history.slice(0,3).map(h => (
              <div key={h._id} className="card" style={{ padding:'16px 20px' }}>
                <div style={{ display:'flex', gap:8, marginBottom:8, flexWrap:'wrap' }}>
                  <span style={{ background:'#fff7ed', color:'#c2410c', padding:'2px 10px', borderRadius:999, fontSize:12, fontWeight:700 }}>{h.region}</span>
                  <span style={{ background:'#f1f5f9', color:'#475569', padding:'2px 10px', borderRadius:999, fontSize:12, fontWeight:600 }}>{h.subject}</span>
                </div>
                <p style={{ fontSize:14, color:'#64748b', fontStyle:'italic' }}>{h.original_text?.slice(0,120)}{h.original_text?.length > 120 ? '…' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
