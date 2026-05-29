import React from 'react';
import './Loader.css';
export default function Loader({ message = 'Loading...' }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16, padding:'60px 24px' }}>
      <div style={{ width:44, height:44, borderRadius:'50%', border:'4px solid #e2e8f0', borderTopColor:'#f97316', animation:'spin 0.8s linear infinite' }} />

      <p style={{ color:'#64748b', fontSize:15, fontWeight:500, textAlign:'center', maxWidth:400 }}>{message}</p>
    </div>
  );
}
