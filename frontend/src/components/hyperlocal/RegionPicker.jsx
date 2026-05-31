import React from 'react';

const REGIONS = [
  { key: 'rajasthan',      label: 'Rajasthan',      flag: '🏜️', color: '#FFE8B8' },
  { key: 'kerala',         label: 'Kerala',         flag: '🌴', color: '#B8FFE8' },
  { key: 'punjab',         label: 'Punjab',         flag: '🌾', color: '#FFD4B8' },
  { key: 'west_bengal',    label: 'West Bengal',    flag: '🐅', color: '#FFB5C8' },
  { key: 'tamil_nadu',     label: 'Tamil Nadu',     flag: '🏛️', color: '#D4B8FF' },
  { key: 'andhra_pradesh', label: 'Andhra Pradesh', flag: '🌶️', color: '#B8D4FF' },
];

export default function RegionPicker({ value, onChange, multi = false }) {
  const isSelected = k => multi ? value.includes(k) : value === k;

  const toggle = k => {
    if (!multi) { onChange(k); return; }
    if (value.includes(k)) onChange(value.filter(v => v !== k));
    else onChange([...value, k]);
  };

  return (
    <div>
      {/* Hidden native select for accessibility / form compat when not multi */}
      {!multi && (
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label>Student's region</label>
          <div style={{ position: 'relative' }}>
            <select value={value} onChange={e => onChange(e.target.value)} style={{ paddingRight: 28 }}>
              <option value="">Select region…</option>
              {REGIONS.map(r => <option key={r.key} value={r.key}>{r.flag} {r.label}</option>)}
            </select>
            <span style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)',
              pointerEvents:'none', color:'rgba(255,248,240,0.28)', fontSize:10 }}>▾</span>
          </div>
        </div>
      )}

      {/* Visual pill buttons */}
      {multi && (
        <div className="form-group" style={{ marginBottom: 10 }}>
          <label>Regions (select multiple)</label>
        </div>
      )}
      <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
        {REGIONS.map(({ key, label, flag, color }) => {
          const sel = isSelected(key);
          return (
            <button key={key} type="button" onClick={() => toggle(key)} style={{
              padding: '8px 16px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontWeight: sel ? 600 : 400,
              background: sel ? `${color}20` : 'rgba(255,248,240,0.04)',
              color:  sel ? color : 'rgba(255,248,240,0.52)',
              border: sel ? `1.5px solid ${color}45` : '1.5px solid rgba(255,248,240,0.10)',
              boxShadow: sel ? `0 0 16px ${color}22` : 'none',
              transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              {flag} {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}