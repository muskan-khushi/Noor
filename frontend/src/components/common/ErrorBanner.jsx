import React from 'react';

export default function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div style={{
      background:'rgba(255,100,100,0.09)',
      border:'1px solid rgba(255,100,100,0.20)',
      borderRadius:12, padding:'11px 16px',
      display:'flex', alignItems:'flex-start', gap:10,
      color:'#FFB5B5', fontSize:13, fontWeight:400, lineHeight:1.55,
    }}>
      <span style={{ fontSize:15, flexShrink:0, marginTop:1 }}>⚠</span>
      <span>{message}</span>
    </div>
  );
}