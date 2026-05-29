import React, { useState } from 'react';
import GapCard from './GapCard';

const FILTERS = ['ALL','CRITICAL','HIGH','MEDIUM'];

export default function GapReport({ data, onReset }) {
  const [filter, setFilter] = useState('ALL');
  const shown = filter === 'ALL' ? data.gaps : data.gaps.filter(g => g.priority === filter);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
        <div>
          <h2 style={{ fontSize:26, fontWeight:800 }}>Your Gap Report</h2>
          <p style={{ color:'#64748b', marginTop:4, maxWidth:600 }}>{data.summary}</p>
        </div>
        <button className="btn btn-outline" onClick={onReset}>↩ New Analysis</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {[
          { num:data.criticalGaps, label:'Critical Gaps',  bg:'#fee2e2' },
          { num:data.highGaps||0,  label:'High Priority',  bg:'#fef3c7' },
          { num:data.totalGapsFound, label:'Total Gaps',   bg:'#dbeafe' },
        ].map(({ num, label, bg }) => (
          <div key={label} style={{ background:bg, borderRadius:12, padding:'20px', textAlign:'center' }}>
            <div style={{ fontSize:38, fontWeight:800 }}>{num}</div>
            <div style={{ fontSize:13, fontWeight:600, color:'#64748b', textTransform:'uppercase', marginTop:4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:'6px 16px', borderRadius:999, fontSize:13, fontWeight:600, cursor:'pointer',
            background: filter===f ? '#1e293b' : '#fff',
            color: filter===f ? '#fff' : '#1e293b',
            border: filter===f ? '1.5px solid #1e293b' : '1.5px solid #e2e8f0',
          }}>{f}</button>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {shown.length === 0
          ? <p style={{ color:'#64748b', textAlign:'center', padding:32 }}>No gaps found for this filter.</p>
          : shown.map((gap, i) => <GapCard key={i} gap={gap} />)}
      </div>
    </div>
  );
}
