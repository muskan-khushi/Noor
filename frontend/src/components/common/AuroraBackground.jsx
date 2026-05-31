import React, { useEffect } from 'react';

const BLOBS = [
  { color:'rgba(255,181,200,0.12)', left:'8%',  top:'4%',  w:'58%', h:'44%', dur:'18s', delay:'0s'   },
  { color:'rgba(212,184,255,0.10)', left:'52%', top:'8%',  w:'54%', h:'48%', dur:'22s', delay:'-7s'  },
  { color:'rgba(184,212,255,0.09)', left:'28%', top:'48%', w:'48%', h:'38%', dur:'25s', delay:'-12s' },
  { color:'rgba(255,232,184,0.08)', left:'58%', top:'58%', w:'44%', h:'34%', dur:'20s', delay:'-5s'  },
  { color:'rgba(184,255,232,0.07)', left:'4%',  top:'62%', w:'38%', h:'34%', dur:'27s', delay:'-9s'  },
];

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  size: Math.random() * 4 + 2,
  x: Math.random() * 100,
  y: Math.random() * 100,
  dur: Math.random() * 10 + 8,
  delay: -(Math.random() * 15),
  color: ['#FFD4B8','#FFB5C8','#D4B8FF','#B8D4FF','#B8FFE8','#FFE8B8'][Math.floor(Math.random()*6)],
  opacity: Math.random() * 0.35 + 0.12,
}));

export default function AuroraBackground() {
  return (
    <div id="noor-aurora" aria-hidden="true">
      {/* Base gradient */}
      <div style={{
        position:'absolute', inset:0,
        background:'radial-gradient(ellipse at 22% 18%, #2D1F4E 0%, #1A0F2E 62%)',
      }} />

      {/* Aurora blobs */}
      {BLOBS.map((b, i) => (
        <div key={i} style={{
          position:'absolute',
          left: b.left, top: b.top,
          width: b.w, height: b.h,
          background: `radial-gradient(ellipse, ${b.color} 0%, transparent 70%)`,
          filter: 'blur(40px)',
          animation: `aurora ${b.dur} ${b.delay} ease-in-out infinite`,
        }} />
      ))}

      {/* Floating light motes */}
      {PARTICLES.map(p => (
        <div key={p.id} style={{
          position:'absolute',
          left:`${p.x}%`, top:`${p.y}%`,
          width: p.size, height: p.size,
          borderRadius:'50%',
          background: p.color,
          opacity: p.opacity,
          boxShadow:`0 0 ${p.size*3}px ${p.color}`,
          animation:`float-particle ${p.dur}s ${p.delay}s ease-in-out infinite`,
        }} />
      ))}

      {/* Grain overlay */}
      <div style={{
        position:'absolute', inset:0, opacity:0.45,
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
      }} />
    </div>
  );
}