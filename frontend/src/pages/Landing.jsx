import React from 'react';
import { Link } from 'react-router-dom';

const PROBLEMS = [
  { icon:'◈', color:'#FFB5C8',
    title:'Invisible curriculum gaps',
    desc:'State board syllabi miss entire topic families that national exams test. Students find out in the exam hall, not before.' },
  { icon:'◇', color:'#D4B8FF',
    title:'The cognitive context tax',
    desc:'Word problems set in unfamiliar cities force students to decode geography before they can even begin the mathematics.' },
  { icon:'◉', color:'#B8D4FF',
    title:'One-size textbooks for 29 states',
    desc:'250 million students — but every textbook speaks the same dialect of distant urban India. The gap is structural, not personal.' },
];

const STEPS = [
  { n:'01', color:'#FFD4B8',
    title:'Upload your syllabus',
    desc:'Drop your state board syllabus PDF. Our multi-strategy parser extracts every topic with structural context preserved.' },
  { n:'02', color:'#D4B8FF',
    title:'See your gaps, ranked',
    desc:'Three-signal semantic alignment — dense embeddings, BM25, n-gram Jaccard — identifies exactly what is missing and how critical it is.' },
  { n:'03', color:'#B8D4FF',
    title:'Learn it in your language',
    desc:'Paste any problem. Pick your region. Noor rewrites it with your geography, your foods, your world — same maths, your context.' },
];

const STATS = [
  { num:'250M', label:'state board students', color:'#FFD4B8' },
  { num:'14+',  label:'topics missed per exam', color:'#FFB5C8' },
  { num:'60%',  label:'NEET failures from board gaps', color:'#D4B8FF' },
  { num:'6',    label:'regions localised', color:'#B8D4FF' },
];

export default function Landing() {
  return (
    <div style={{ position:'relative' }}>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section style={{
        minHeight:'100vh', display:'flex', alignItems:'center',
        justifyContent:'center', padding:'110px 24px 72px',
        position:'relative', overflow:'hidden',
      }}>
        {/* Central radial glow behind the letter */}
        <div style={{
          position:'absolute', left:'50%', top:'42%',
          transform:'translate(-50%,-50%)',
          width:560, height:560,
          background:'radial-gradient(ellipse, rgba(255,181,200,0.10) 0%, rgba(212,184,255,0.08) 38%, transparent 68%)',
          filter:'blur(36px)',
          pointerEvents:'none',
        }} />

        <div style={{ textAlign:'center', maxWidth:780, position:'relative', zIndex:1 }}>
          {/* Arabic letter — the centrepiece */}
          <div className="fade-up" style={{
            fontFamily:"'Cormorant Garamond', serif",
            fontSize:'clamp(96px,16vw,164px)',
            lineHeight:1, fontWeight:300,
            background:'linear-gradient(150deg, #FFD4B8 0%, #FFB5C8 30%, #D4B8FF 62%, #B8D4FF 100%)',
            WebkitBackgroundClip:'text', backgroundClip:'text',
            WebkitTextFillColor:'transparent',
            animation:'noor-glow 4s ease-in-out infinite, fade-up 0.8s ease both',
            display:'block', marginBottom:10,
          }}>نور</div>

          {/* Ripple rings behind the letter */}
          {[1,2,3].map(i => (
            <div key={i} aria-hidden="true" style={{
              position:'absolute', left:'50%', top:'16%',
              transform:'translate(-50%,-50%)',
              width: i*110, height: i*110, borderRadius:'50%',
              border:`1px solid rgba(255,212,184,${0.11/i})`,
              animation:`ripple ${2.4+i*0.75}s ${i*0.38}s ease-out infinite`,
              pointerEvents:'none',
            }} />
          ))}

          <h1 className="fade-up-1" style={{
            fontFamily:"'Cormorant Garamond', serif",
            fontSize:'clamp(34px,6vw,66px)',
            fontWeight:300, lineHeight:1.15, letterSpacing:'-0.02em',
            color:'rgba(255,248,240,0.94)', marginBottom:22,
          }}>
            Light on the path.<br />
            <em style={{ color:'rgba(255,212,184,0.75)', fontStyle:'italic' }}>
              Knowledge rooted in your world.
            </em>
          </h1>

          <p className="fade-up-2" style={{
            fontSize:16, lineHeight:1.85, fontWeight:300,
            color:'rgba(255,248,240,0.50)',
            maxWidth:520, margin:'0 auto 48px',
          }}>
            Noor finds what your state board textbook never taught you —
            and explains it in the language your world already speaks.
          </p>

          <div className="fade-up-3" style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-xl">
              Begin your journey ↗
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ────────────────────────────────────── */}
      <section style={{ padding:'0 24px 88px' }}>
        <div className="container">
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',
            border:'1px solid rgba(255,212,184,0.11)',
            borderRadius:20, overflow:'hidden',
          }}>
            {STATS.map(({ num, label, color }, i) => (
              <div key={i} style={{
                padding:'30px 20px', textAlign:'center',
                background:'rgba(255,248,240,0.025)',
                borderRight: i < STATS.length-1 ? '1px solid rgba(255,212,184,0.08)' : 'none',
              }}>
                <div style={{
                  fontFamily:"'Cormorant Garamond', serif",
                  fontSize:42, fontWeight:400, color,
                  lineHeight:1, textShadow:`0 0 28px ${color}55`,
                  marginBottom:8,
                }}>{num}</div>
                <div style={{
                  fontSize:11, color:'rgba(255,248,240,0.38)',
                  letterSpacing:'0.07em', textTransform:'uppercase', fontWeight:500,
                }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEM SECTION ────────────────────────────────── */}
      <section style={{ padding:'16px 24px 96px' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <div style={{ fontSize:10.5, letterSpacing:'0.18em', textTransform:'uppercase',
              color:'rgba(255,212,184,0.45)', marginBottom:12, fontWeight:600 }}>The problem</div>
            <h2 style={{
              fontFamily:"'Cormorant Garamond', serif",
              fontSize:'clamp(28px,4.5vw,46px)', fontWeight:400,
              color:'rgba(255,248,240,0.90)', letterSpacing:'-0.01em',
            }}>Two taxes every state board student pays</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:18 }}>
            {PROBLEMS.map(({ icon, color, title, desc }, i) => (
              <div key={i} className="glass" style={{ borderRadius:22, padding:'30px 26px', position:'relative', overflow:'hidden' }}>
                <div style={{
                  position:'absolute', top:-24, right:-24,
                  width:110, height:110,
                  background:`radial-gradient(ellipse, ${color}22, transparent 70%)`,
                  borderRadius:'50%', filter:'blur(18px)',
                }} />
                <div style={{
                  fontSize:26, color, marginBottom:16,
                  filter:`drop-shadow(0 0 8px ${color}70)`,
                }}>{icon}</div>
                <h3 style={{
                  fontSize:16, fontWeight:500, color:'rgba(255,248,240,0.88)',
                  marginBottom:10, lineHeight:1.35,
                }}>{title}</h3>
                <p style={{
                  fontSize:13.5, color:'rgba(255,248,240,0.46)',
                  lineHeight:1.78, fontWeight:300,
                }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section style={{ padding:'16px 24px 108px' }}>
        <div className="container" style={{ maxWidth:760 }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div style={{ fontSize:10.5, letterSpacing:'0.18em', textTransform:'uppercase',
              color:'rgba(212,184,255,0.45)', marginBottom:12, fontWeight:600 }}>How it works</div>
            <h2 style={{
              fontFamily:"'Cormorant Garamond', serif",
              fontSize:'clamp(26px,4vw,42px)', fontWeight:400,
              color:'rgba(255,248,240,0.90)',
            }}>Find the gap. Fill it in your language.</h2>
          </div>
          {STEPS.map(({ n, color, title, desc }, i) => (
            <div key={i} style={{ display:'flex', gap:26, alignItems:'flex-start', marginBottom:36, position:'relative' }}>
              {i < STEPS.length-1 && (
                <div style={{
                  position:'absolute', left:26, top:50,
                  width:1, height:'calc(100% + 4px)',
                  background:`linear-gradient(180deg, ${color}35, transparent)`,
                }} />
              )}
              <div style={{
                width:52, height:52, borderRadius:'50%', flexShrink:0,
                background:`radial-gradient(ellipse, ${color}22, ${color}08)`,
                border:`1px solid ${color}38`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:"'Cormorant Garamond', serif",
                fontSize:14, color, fontWeight:500,
                boxShadow:`0 0 18px ${color}22`,
              }}>{n}</div>
              <div style={{ paddingTop:8 }}>
                <h3 style={{ fontSize:17, fontWeight:500, color:'rgba(255,248,240,0.88)', marginBottom:7 }}>{title}</h3>
                <p style={{ fontSize:13.5, color:'rgba(255,248,240,0.45)', lineHeight:1.78, fontWeight:300 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section style={{ padding:'0 24px 112px', textAlign:'center' }}>
        <div className="glass" style={{ maxWidth:580, margin:'0 auto', borderRadius:28, padding:'52px 44px' }}>
          <div style={{ fontSize:44, marginBottom:14, filter:'drop-shadow(0 0 18px rgba(255,212,184,0.40))' }}>نور</div>
          <h2 style={{
            fontFamily:"'Cormorant Garamond', serif", fontSize:32, fontWeight:400,
            color:'rgba(255,248,240,0.90)', marginBottom:12,
          }}>Every child deserves a light.</h2>
          <p style={{ color:'rgba(255,248,240,0.40)', fontSize:14, marginBottom:34, lineHeight:1.75, fontWeight:300 }}>
            Free. Open. Built for India's 250 million state board students.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Start learning for free ↗
          </Link>
        </div>
      </section>

    </div>
  );
}