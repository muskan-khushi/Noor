import React from 'react';
import { Link } from 'react-router-dom';

const problems = [
  { icon:'📚', title:'Invisible Gaps', desc:'State board textbooks miss entire topics that national exams test. Nobody tells students.' },
  { icon:'🗺️', title:'Alien Examples', desc:'Word problems set in cities students have never seen. Extra cognitive load before the math even starts.' },
  { icon:'🎯', title:'Noor Fixes Both', desc:'Finds the gaps. Fills them with explanations your world understands.' },
];

const steps = [
  { n:'01', title:'Upload Your Syllabus', desc:'Drop your state board syllabus PDF. Choose your target exam.' },
  { n:'02', title:'See Your Gaps',       desc:'AI compares your syllabus to the national exam. Every missing topic, prioritised.' },
  { n:'03', title:'Learn in Your World', desc:'Paste any problem. Pick your region. Get it rewritten with your local context.' },
];

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section style={{ background:'linear-gradient(135deg,#1e293b 0%,#f97316 100%)', color:'#fff', padding:'100px 24px', textAlign:'center' }}>
        <div style={{ maxWidth:700, margin:'0 auto' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>نور</div>
          <h1 style={{ fontSize:52, fontWeight:900, letterSpacing:'-2px', marginBottom:20, lineHeight:1.1 }}>
            Light on<br />the path.
          </h1>
          <p style={{ fontSize:20, opacity:0.85, marginBottom:40, lineHeight:1.7 }}>
            Noor finds the topics your state board textbook never taught you —<br />
            and explains them in a language your world understands.
          </p>
          <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg" style={{ background:'#fff', color:'#f97316' }}>Get Started — Free</Link>
            <Link to="/register" className="btn btn-lg" style={{ border:'2px solid rgba(255,255,255,0.4)', color:'#fff', background:'transparent' }}>See a Demo →</Link>
          </div>
        </div>
      </section>

      {/* Problem section */}
      <section style={{ padding:'80px 24px', background:'#f8fafc' }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <h2 style={{ textAlign:'center', fontSize:36, fontWeight:800, marginBottom:48 }}>India's invisible education gap</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
            {problems.map(({ icon, title, desc }) => (
              <div key={title} className="card" style={{ textAlign:'center' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>{icon}</div>
                <h3 style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>{title}</h3>
                <p style={{ color:'#64748b', lineHeight:1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding:'80px 24px', background:'#fff' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <h2 style={{ textAlign:'center', fontSize:36, fontWeight:800, marginBottom:48 }}>How Noor works</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
            {steps.map(({ n, title, desc }) => (
              <div key={n} style={{ display:'flex', gap:24, alignItems:'flex-start' }}>
                <div style={{ width:56, height:56, borderRadius:12, background:'#f97316', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, flexShrink:0 }}>{n}</div>
                <div>
                  <h3 style={{ fontSize:20, fontWeight:700, marginBottom:6 }}>{title}</h3>
                  <p style={{ color:'#64748b', fontSize:16, lineHeight:1.7 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:'80px 24px', background:'#1e293b', textAlign:'center', color:'#fff' }}>
        <h2 style={{ fontSize:36, fontWeight:800, marginBottom:16 }}>Every child deserves a light on their path.</h2>
        <p style={{ color:'rgba(255,255,255,0.7)', fontSize:18, marginBottom:32 }}>Free. Open. Built for India's 250 million school students.</p>
        <Link to="/register" className="btn btn-primary btn-lg">Start Learning →</Link>
      </section>
    </div>
  );
}
