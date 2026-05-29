import React from 'react';

export default function HyperOutput({ data, onReset }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:24, fontWeight:800 }}>Localised for {data.region}</h2>
          <p style={{ color:'#64748b', marginTop:4, fontSize:15, fontStyle:'italic' }}>"{data.why_this_helps}"</p>
        </div>
        <button className="btn btn-outline" onClick={onReset}>↩ Try Another</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div style={{ background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:12, padding:20 }}>
          <h3 style={{ fontSize:14, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'#64748b', marginBottom:12 }}>📖 Original Textbook Version</h3>
          <p style={{ fontSize:14, lineHeight:1.8, color:'#374151' }}>{data.original_text}</p>
        </div>
        <div style={{ background:'#fff7ed', border:'1.5px solid #fed7aa', borderRadius:12, padding:20 }}>
          <h3 style={{ fontSize:14, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'#c2410c', marginBottom:12 }}>✨ Localised Version</h3>
          <p style={{ fontSize:14, lineHeight:1.8, color:'#374151' }}>{data.rewritten_text}</p>
        </div>
      </div>

      {data.changes_made?.length > 0 && (
        <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:20 }}>
          <h3 style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>🔄 Changes Made</h3>
          <ul style={{ paddingLeft:20, display:'flex', flexDirection:'column', gap:6 }}>
            {data.changes_made.map((c,i) => <li key={i} style={{ fontSize:14, color:'#166534' }}>{c}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
