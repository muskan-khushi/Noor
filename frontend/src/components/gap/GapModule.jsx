import React from 'react';

export default function GapModule({ module: m }) {
  const sec = (emoji, title, content) => (
    <div style={{ marginBottom:16 }}>
      <h4 style={{ fontSize:14, fontWeight:700, marginBottom:8 }}>{emoji} {title}</h4>
      {content}
    </div>
  );
  return (
    <div style={{ padding:'20px', borderTop:'1px solid #e2e8f0', background:'#fafafa', display:'flex', flexDirection:'column', gap:4 }}>
      {sec('📖','Explanation', <p style={{ fontSize:14, lineHeight:1.7 }}>{m.explanation}</p>)}
      {sec('🔑','Key Points',
        <ul style={{ paddingLeft:20 }}>
          {(m.key_points||[]).map((kp,i) => <li key={i} style={{ fontSize:14, marginBottom:4 }}>{kp}</li>)}
        </ul>
      )}
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, padding:16, marginBottom:4 }}>
        {sec('📝','Example Problem', <p style={{ fontSize:14 }}>{m.example_problem}</p>)}
        {sec('✅','Solution', <p style={{ fontSize:14, color:'#166534' }}>{m.solution}</p>)}
      </div>
      <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:8, padding:16 }}>
        {sec('⚠️','Common Mistake', <p style={{ fontSize:14 }}>{m.common_mistake}</p>)}
      </div>
    </div>
  );
}
