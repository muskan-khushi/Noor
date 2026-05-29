import React from 'react';

const REGIONS = [
  { key:'rajasthan',     label:'Rajasthan',      flag:'🏜️' },
  { key:'kerala',        label:'Kerala',         flag:'🌴' },
  { key:'punjab',        label:'Punjab',         flag:'🌾' },
  { key:'west_bengal',   label:'West Bengal',    flag:'🐅' },
  { key:'tamil_nadu',    label:'Tamil Nadu',     flag:'🏛️' },
  { key:'andhra_pradesh',label:'Andhra Pradesh', flag:'🌶️' },
];

export default function RegionPicker({ value, onChange, multi = false }) {
  const isSelected = (k) => multi ? value.includes(k) : value === k;
  const toggle = (k) => {
    if (!multi) return onChange(k);
    if (value.includes(k)) onChange(value.filter(v => v !== k));
    else onChange([...value, k]);
  };

  return (
    <div>
      <div className="form-group" style={{ marginBottom:12 }}>
        <label>Student's Region{multi && ' (Select multiple)'}</label>
        {!multi && (
          <select value={value} onChange={e => onChange(e.target.value)}>
            <option value="">Select region…</option>
            {REGIONS.map(r => <option key={r.key} value={r.key}>{r.flag} {r.label}</option>)}
          </select>
        )}
      </div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {REGIONS.map(r => (
          <button key={r.key} onClick={() => toggle(r.key)} style={{
            padding:'6px 14px', borderRadius:999, fontSize:13, fontWeight:600, cursor:'pointer',
            background: isSelected(r.key) ? '#f97316' : '#fff',
            color: isSelected(r.key) ? '#fff' : '#1e293b',
            border: isSelected(r.key) ? '1.5px solid #f97316' : '1.5px solid #e2e8f0',
            transition:'all 0.15s',
          }}>{r.flag} {r.label}</button>
        ))}
      </div>
    </div>
  );
}
