import React, { useState } from 'react';
import GapModule from './GapModule';

const COLORS = { CRITICAL:'#b91c1c', HIGH:'#92400e', MEDIUM:'#1d4ed8' };
const BG     = { CRITICAL:'#fee2e2', HIGH:'#fef3c7', MEDIUM:'#dbeafe' };
const BORDER = { CRITICAL:'#ef4444', HIGH:'#f59e0b', MEDIUM:'#0ea5e9' };

export default function GapCard({ gap }) {
  const [open, setOpen] = useState(false);
  const p = gap.priority;
  return (
    <div style={{ background:'#fff', borderRadius:12, border:'1.5px solid #e2e8f0', borderLeft:`4px solid ${BORDER[p]||'#e2e8f0'}`, overflow:'hidden', transition:'box-shadow 0.15s' }}>
      <div style={{ padding:'16px 20px', cursor:'pointer' }} onClick={() => setOpen(!open)}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <span style={{ display:'inline-block', padding:'2px 10px', borderRadius:999, fontSize:12, fontWeight:700, textTransform:'uppercase', background:BG[p], color:COLORS[p] }}>{p}</span>
          <span style={{ fontSize:12, color:'#64748b', fontWeight:600 }}>Similarity: {((gap.similarity_score || 0)*100).toFixed(0)}%</span>
        </div>
        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:6, lineHeight:1.4 }}>{gap.topic}</h3>
        <p style={{ fontSize:13, color:'#64748b', marginBottom:10 }}>
          Closest match in your syllabus: <em>{gap.closest_state_topic?.slice(0,100)}{gap.closest_state_topic?.length > 100 ? '…' : ''}</em>
        </p>
        <span style={{ fontSize:13, color:'#f97316', fontWeight:600 }}>
          {open ? '▲ Hide Study Module' : '▼ View Study Module'}
        </span>
      </div>
      {open && gap.studyModule && <GapModule module={gap.studyModule} />}
      {open && !gap.studyModule && (
        <div style={{ padding:'12px 20px', borderTop:'1px solid #e2e8f0', color:'#64748b', fontSize:14 }}>
          Study module not available for this priority level. Only CRITICAL gaps get auto-generated modules.
        </div>
      )}
    </div>
  );
}
