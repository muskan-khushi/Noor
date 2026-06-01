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
  const isSelected = k => (multi ? value.includes(k) : value === k);

  const toggle = k => {
    if (!multi) {
      onChange(k);
      return;
    }
    if (value.includes(k)) onChange(value.filter(v => v !== k));
    else onChange([...value, k]);
  };

  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label>{multi ? 'Regions (select one or more)' : "Student's region"}</label>
      <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 10 }}>
        {REGIONS.map(({ key, label, flag, color }) => {
          const sel = isSelected(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              aria-pressed={sel}
              style={{
                padding: '8px 16px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontWeight: sel ? 600 : 400,
                background: sel ? `${color}20` : 'rgba(255,248,240,0.04)',
                color: sel ? color : 'rgba(255,248,240,0.52)',
                border: sel ? `1.5px solid ${color}45` : '1.5px solid rgba(255,248,240,0.10)',
                boxShadow: sel ? `0 0 16px ${color}22` : 'none',
                transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            >
              {flag} {label}
            </button>
          );
        })}
      </div>
      {!multi && !value && (
        <p style={{
          fontSize: 12, color: 'rgba(255,248,240,0.32)', marginTop: 10, marginBottom: 0,
        }}>
          Tap a region above to continue.
        </p>
      )}
    </div>
  );
}
