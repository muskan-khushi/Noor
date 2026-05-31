import React from 'react';

export default function Loader({ message = 'Loading…' }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', gap:20, padding:'72px 24px',
    }}>
      {/* Orbital spinner */}
      <div style={{ position:'relative', width:52, height:52 }}>
        <div style={{
          position:'absolute', inset:0, borderRadius:'50%',
          border:'2px solid rgba(255,212,184,0.10)',
          borderTopColor:'#FFD4B8',
          animation:'spin 1s linear infinite',
        }} />
        <div style={{
          position:'absolute', inset:7, borderRadius:'50%',
          border:'1.5px solid rgba(212,184,255,0.08)',
          borderTopColor:'#D4B8FF',
          animation:'spin 1.5s linear infinite reverse',
        }} />
        <div style={{
          position:'absolute', inset:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:14, color:'rgba(255,248,240,0.45)',
        }}>نور</div>
      </div>
      <p style={{
        fontFamily:"'DM Sans', sans-serif",
        fontSize:13, fontWeight:300, color:'rgba(255,248,240,0.42)',
        textAlign:'center', maxWidth:360, lineHeight:1.75,
      }}>{message}</p>
    </div>
  );
}