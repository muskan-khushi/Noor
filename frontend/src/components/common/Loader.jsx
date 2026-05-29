import React from 'react';
export default function Loader({ message = 'Loading...' }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16, padding:'60px 24px' }}>
      <div style={{ width:44, height:44, borderRadius:'50%', border:'4px solid #e2e8f0', borderTopColor:'#f97316', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ color:'#64748b', fontSize:15, fontWeight:500, textAlign:'center', maxWidth:400 }}>{message}</p>
    </div>
  );
}
