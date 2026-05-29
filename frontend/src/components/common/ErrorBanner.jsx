import React from 'react';
export default function ErrorBanner({ message }) {
  if (!message) return null;
  return <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:8, padding:'12px 16px', color:'#b91c1c', fontWeight:500, fontSize:14, marginTop:4 }}>⚠️ {message}</div>;
}
