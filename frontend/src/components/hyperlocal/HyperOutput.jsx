import React, { useState } from 'react';

function InvarianceWarning({ invariance }) {
  if (!invariance || invariance.invariant) return null;
  return (
    <div style={{
      background: '#fef3c7', border: '1px solid #fbbf24',
      borderRadius: 8, padding: '10px 14px', marginBottom: 16,
      display: 'flex', gap: 8, alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 16 }}>⚠️</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>Mathematical Invariance Warning</div>
        <div style={{ fontSize: 12, color: '#92400e', marginTop: 2 }}>
          {invariance.warning}. Verify that all numbers match the original before using this with students.
        </div>
      </div>
    </div>
  );
}

function ChangesTable({ changes }) {
  if (!changes || changes.length === 0) return null;
  return (
    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 16 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: '#065f46', marginBottom: 12 }}>
        🔄 Substitutions Made ({changes.length})
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {changes.map((change, i) => {
          // Try to parse "X → Y" format
          const parts = change.split(/\s*(?:→|->)\s*/);
          if (parts.length === 2) {
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  background: '#fee2e2', color: '#991b1b',
                  borderRadius: 4, padding: '2px 8px', fontSize: 12,
                  fontFamily: 'monospace', textDecoration: 'line-through', opacity: 0.8,
                }}>{parts[0]}</span>
                <span style={{ color: '#64748b' }}>→</span>
                <span style={{
                  background: '#d1fae5', color: '#065f46',
                  borderRadius: 4, padding: '2px 8px', fontSize: 12, fontFamily: 'monospace',
                }}>{parts[1]}</span>
              </div>
            );
          }
          return (
            <div key={i} style={{ fontSize: 13, color: '#166534' }}>• {change}</div>
          );
        })}
      </div>
    </div>
  );
}

function CLTPanel({ cognitiveLoad, whyHelps }) {
  const [expanded, setExpanded] = useState(false);
  if (!cognitiveLoad && !whyHelps) return null;
  return (
    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 14 }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: 0,
        }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1e40af' }}>
          🧠 Cognitive Load Theory Analysis
        </span>
        <span style={{ fontSize: 12, color: '#3b82f6' }}>{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {whyHelps && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Why this helps</div>
              <p style={{ fontSize: 13, color: '#1e3a8a', margin: 0 }}>{whyHelps}</p>
            </div>
          )}
          {cognitiveLoad && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Extraneous load removed</div>
              <p style={{ fontSize: 13, color: '#1e3a8a', margin: 0 }}>{cognitiveLoad}</p>
            </div>
          )}
          <div style={{ fontSize: 11, color: '#60a5fa', marginTop: 4 }}>
            Based on Sweller (1988) Cognitive Load Theory. Familiar context reduces extraneous load,
            freeing working memory for intrinsic learning.
          </div>
        </div>
      )}
    </div>
  );
}

export default function HyperOutput({ data, onReset }) {
  const [view, setView] = useState('side-by-side');  // 'side-by-side' | 'original' | 'localised'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
              Localised for {data.region}
            </h2>
            <span style={{
              background: '#fff7ed', color: '#c2410c',
              border: '1px solid #fed7aa', borderRadius: 6,
              padding: '2px 8px', fontSize: 11, fontWeight: 700,
            }}>{data.language_hint || 'Hindi/English'}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {data.subject && (
              <span style={{ background: '#f1f5f9', color: '#475569', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
                {data.subject}
              </span>
            )}
            {data.concept && (
              <span style={{ background: '#eff6ff', color: '#1d4ed8', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
                {data.concept}
              </span>
            )}
          </div>
        </div>
        <button className="btn btn-outline" onClick={onReset}>↩ Try Another</button>
      </div>

      {/* Invariance warning */}
      <InvarianceWarning invariance={data.mathematical_invariance} />

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { key: 'side-by-side', label: '⊟ Side by Side' },
          { key: 'original',     label: '📖 Original' },
          { key: 'localised',    label: '✨ Localised' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setView(key)} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
            background: view === key ? '#1e293b' : '#fff',
            color: view === key ? '#fff' : '#475569',
            border: `1.5px solid ${view === key ? '#1e293b' : '#e2e8f0'}`,
          }}>{label}</button>
        ))}
      </div>

      {/* Text panels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: view === 'side-by-side' ? '1fr 1fr' : '1fr',
        gap: 16,
      }}>
        {(view === 'side-by-side' || view === 'original') && (
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: 12 }}>
              📖 Original Textbook Version
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.9, color: '#374151', margin: 0 }}>{data.original_text}</p>
          </div>
        )}
        {(view === 'side-by-side' || view === 'localised') && (
          <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#c2410c', marginBottom: 12 }}>
              ✨ Localised — {data.region}
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.9, color: '#374151', margin: 0 }}>{data.rewritten_text}</p>
          </div>
        )}
      </div>

      {/* Changes table */}
      <ChangesTable changes={data.changes_made} />

      {/* CLT panel */}
      <CLTPanel
        cognitiveLoad={data.cognitive_load_reduction}
        whyHelps={data.why_this_helps}
      />

      {/* Cultural notes */}
      {data.cultural_authenticity_notes && data.cultural_authenticity_notes !== 'Localisation could not be completed automatically.' && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>📌 Cultural fidelity notes</div>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{data.cultural_authenticity_notes}</p>
        </div>
      )}
    </div>
  );
}