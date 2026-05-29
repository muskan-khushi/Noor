import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const s = {
  nav: { position:'sticky', top:0, zIndex:100, background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid #e2e8f0', height:64 },
  inner: { maxWidth:1100, margin:'0 auto', padding:'0 24px', height:'100%', display:'flex', alignItems:'center', justifyContent:'space-between' },
  brand: { display:'flex', alignItems:'center', gap:8 },
  arabic: { fontSize:22, color:'#f97316', fontWeight:700 },
  latin: { fontSize:18, fontWeight:800, color:'#1e293b', letterSpacing:'-0.5px' },
  links: { display:'flex', alignItems:'center', gap:20 },
  navLink: { fontSize:15, fontWeight:500, color:'#64748b' },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };
  return (
    <nav style={s.nav}>
      <div style={s.inner}>
        <Link to="/" style={s.brand}>
          <span style={s.arabic}>نور</span>
          <span style={s.latin}>Noor</span>
        </Link>
        <div style={s.links}>
          {user ? (
            <>
              <Link to="/gap-finder" style={s.navLink}>Gap Finder</Link>
              <Link to="/hyperlocal" style={s.navLink}>Localise</Link>
              <Link to="/dashboard" style={s.navLink}>Dashboard</Link>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" style={s.navLink}>Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
