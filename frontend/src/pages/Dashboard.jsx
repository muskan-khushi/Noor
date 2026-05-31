import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getReports } from '../api/gapFinder';
import { getHistory } from '../api/hyperlocalGen';
import Loader from '../components/common/Loader';

export default function Dashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getReports().then(r => setReports(Array.isArray(r) ? r : r?.reports || [])).catch(() => {}),
      getHistory().then(setHistory).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader message="Loading your dashboard…" />;

  const firstName = user?.name?.split(' ')[0] || 'Student';

  return (
    <div className="page container">

      {/* Greeting */}
      <div className="fade-up" style={{ marginBottom:44 }}>
        <div style={{
          fontSize:10.5, letterSpacing:'0.16em', textTransform:'uppercase',
          color:'rgba(255,212,184,0.42)', marginBottom:9, fontWeight:600,
        }}>Welcome back</div>
        <h1 style={{
          fontFamily:"'Cormorant Garamond', serif",
          fontSize:'clamp(30px,5vw,50px)', fontWeight:400,
          color:'rgba(255,248,240,0.92)', lineHeight:1.1, marginBottom:9,
        }}>{firstName} ✦</h1>
        <p style={{ color:'rgba(255,248,240,0.38)', fontSize:13.5, fontWeight:300 }}>
          {user?.stateBoard} Board · {user?.targetExam || '—'} · {user?.district}
        </p>
      </div>

      {/* Feature cards */}
      <div className="fade-up-1" style={{
        display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',
        gap:18, marginBottom:44,
      }}>
        {[
          { to:'/gap-finder', icon:'◈', color:'#FFB5C8',
            title:'Gap Finder',
            desc:'Discover every topic your textbook never covered, ranked by exam priority.',
            action:'Analyse your syllabus →' },
          { to:'/hyperlocal', icon:'◉', color:'#D4B8FF',
            title:'Localise Content',
            desc:'Rewrite any problem using your regions geography, food and occupations.',
            action:'Localise now →' },
        ].map(({ to, icon, color, title, desc, action }) => (
          <Link key={to} to={to} style={{ textDecoration:'none' }}>
            <div className="glass" style={{
              borderRadius:22, padding:'32px 28px',
              position:'relative', overflow:'hidden', height:'100%',
              transition:'all 0.32s cubic-bezier(0.34,1.56,0.64,1)',
              cursor:'pointer',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 16px 40px ${color}22, 0 0 60px ${color}10`;
                e.currentTarget.style.borderColor = `${color}35`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(255,212,184,0.14)';
              }}
            >
              <div style={{
                position:'absolute', top:-28, right:-28,
                width:120, height:120,
                background:`radial-gradient(ellipse, ${color}20, transparent 70%)`,
                borderRadius:'50%', filter:'blur(20px)',
              }} />
              <div style={{ fontSize:30, color, marginBottom:16,
                filter:`drop-shadow(0 0 10px ${color}70)` }}>{icon}</div>
              <h3 style={{
                fontFamily:"'Cormorant Garamond', serif",
                fontSize:20, fontWeight:500, color:'rgba(255,248,240,0.90)', marginBottom:8,
              }}>{title}</h3>
              <p style={{ fontSize:13, color:'rgba(255,248,240,0.42)', marginBottom:22, lineHeight:1.7, fontWeight:300 }}>
                {desc}
              </p>
              <span style={{ fontSize:13, color, fontWeight:500 }}>{action}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent gap reports */}
      {reports.length > 0 && (
        <div className="fade-up-2" style={{ marginBottom:36 }}>
          <SectionHead label="Recent gap reports" />
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {reports.slice(0, 5).map(r => (
              <div key={r._id} className="glass" style={{
                borderRadius:14, padding:'14px 20px',
                display:'flex', justifyContent:'space-between',
                alignItems:'center', flexWrap:'wrap', gap:12,
              }}>
                <div>
                  <span style={{ fontWeight:500, fontSize:14, color:'rgba(255,248,240,0.85)' }}>
                    {r.targetExam} — {r.subject}
                  </span>
                  <span style={{ color:'rgba(255,248,240,0.35)', fontSize:12.5, marginLeft:10 }}>
                    {r.stateBoard}
                  </span>
                </div>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <span className="badge badge-critical">{r.criticalGaps} critical</span>
                  <span style={{ color:'rgba(255,248,240,0.32)', fontSize:12 }}>{r.totalGapsFound} total</span>
                  <Link to="/gap-finder" style={{ color:'#FFD4B8', fontWeight:500, fontSize:12.5 }}>View →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent localisations */}
      {history.length > 0 && (
        <div className="fade-up-3">
          <SectionHead label="Recent localisations" />
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {history.slice(0, 3).map(h => (
              <div key={h._id} className="glass" style={{ borderRadius:14, padding:'14px 20px' }}>
                <div style={{ display:'flex', gap:7, marginBottom:8, flexWrap:'wrap' }}>
                  <span style={{
                    background:'rgba(212,184,255,0.14)', color:'#D4B8FF',
                    border:'1px solid rgba(212,184,255,0.22)',
                    borderRadius:999, padding:'2px 10px', fontSize:11, fontWeight:600,
                  }}>{h.region}</span>
                  <span style={{
                    background:'rgba(255,248,240,0.06)', color:'rgba(255,248,240,0.45)',
                    border:'1px solid rgba(255,248,240,0.10)',
                    borderRadius:999, padding:'2px 10px', fontSize:11, fontWeight:500,
                  }}>{h.subject}</span>
                </div>
                <p style={{ fontSize:13, color:'rgba(255,248,240,0.40)', fontStyle:'italic', fontWeight:300, lineHeight:1.6 }}>
                  {h.original_text?.slice(0, 120)}{h.original_text?.length > 120 ? '…' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

function SectionHead({ label }) {
  return (
    <div style={{
      fontSize:10.5, letterSpacing:'0.12em', textTransform:'uppercase',
      color:'rgba(255,212,184,0.40)', marginBottom:14, fontWeight:600,
    }}>{label}</div>
  );
}