import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };
  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, zIndex:200,
      height:68,
      background: scrolled ? 'rgba(26,15,46,0.82)' : 'transparent',
      backdropFilter: scrolled ? 'blur(24px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,212,184,0.10)' : 'none',
      transition:'all 0.35s ease',
    }}>
      <div className="container" style={{
        height:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:12, textDecoration:'none' }}>
          <div style={{
            width:36, height:36, borderRadius:'50%',
            background:'linear-gradient(135deg, rgba(255,181,200,0.28), rgba(212,184,255,0.28))',
            border:'1px solid rgba(255,212,184,0.22)',
            boxShadow:'0 0 18px rgba(255,181,200,0.18)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:15,
            animation:'pulse-glow 3.2s ease-in-out infinite',
          }}>نور</div>
          <span style={{
            fontFamily:"'Cormorant Garamond', serif",
            fontSize:21, fontWeight:500, letterSpacing:'0.04em',
            color:'rgba(255,248,240,0.93)',
          }}>Noor</span>
        </Link>

        {/* Links */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {user ? (
            <>
              {[
                { to:'/gap-finder',  label:'Gap Finder' },
                { to:'/hyperlocal',  label:'Localise'   },
                { to:'/dashboard',   label:'Dashboard'  },
              ].map(({ to, label }) => (
                <Link key={to} to={to} style={{
                  padding:'7px 16px', borderRadius:'999px',
                  fontSize:13, fontWeight:500,
                  color: isActive(to) ? '#FFD4B8' : 'rgba(255,248,240,0.55)',
                  background: isActive(to) ? 'rgba(255,212,184,0.11)' : 'transparent',
                  border: isActive(to) ? '1px solid rgba(255,212,184,0.22)' : '1px solid transparent',
                  transition:'all 0.2s',
                  textDecoration:'none',
                }}>{label}</Link>
              ))}
              <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ marginLeft:6 }}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">Sign in</Link>
              <Link to="/register" className="btn btn-primary btn-sm" style={{ marginLeft:4 }}>Get started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}