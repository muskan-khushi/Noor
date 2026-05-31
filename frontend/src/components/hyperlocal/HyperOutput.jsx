import React, { useState } from 'react';

/* ── Invariance warning banner ─────────────────────────────── */
function InvarianceWarning({ inv }) {
  if (!inv || inv.invariant) return null;
  return (
    <div style={{
      background: 'rgba(255,200,100,0.09)', border: '1px solid rgba(255,200,100,0.20)',
      borderRadius: 12, padding: '11px 15px',
      display: 'flex', gap: 9, alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>⚠</span>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#FFE8B8', marginBottom: 3 }}>
          Mathematical Invariance Warning
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,232,184,0.70)', lineHeight: 1.6 }}>
          {inv.warning}. Verify all numbers match the original before using with students.
        </div>
      </div>
    </div>
  );
}

/* ── Substitution diff table ───────────────────────────────── */
function ChangesTable({ changes }) {
  if (!changes?.length) return null;
  return (
    <div style={{
      background: 'rgba(184,255,232,0.05)', border: '1px solid rgba(184,255,232,0.12)',
      borderRadius: 16, padding: '18px 20px',
    }}>
      <div style={{
        fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'rgba(184,255,232,0.45)', marginBottom: 14, fontWeight: 600,
      }}>🔄 Substitutions made ({changes.length})</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {changes.map((c, i) => {
          const parts = c.split(/\s*(?:→|->)\s*/);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
              {parts.length === 2 ? (
                <>
                  <span style={{
                    background: 'rgba(255,100,100,0.12)', color: 'rgba(255,181,200,0.80)',
                    borderRadius: 6, padding: '2px 9px', fontSize: 12,
                    fontFamily: 'monospace',
                    textDecoration: 'line-through', opacity: 0.8,
                  }}>{parts[0]}</span>
                  <span style={{ color: 'rgba(255,248,240,0.28)', fontSize: 11 }}>→</span>
                  <span style={{
                    background: 'rgba(184,255,232,0.12)', color: 'rgba(184,255,232,0.85)',
                    borderRadius: 6, padding: '2px 9px', fontSize: 12,
                    fontFamily: 'monospace',
                  }}>{parts[1]}</span>
                </>
              ) : (
                <span style={{ fontSize: 13, color: 'rgba(255,248,240,0.50)' }}>· {c}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── CLT panel ──────────────────────────────────────────────── */
function CLTPanel({ cogLoad, whyHelps }) {
  const [open, setOpen] = useState(false);
  if (!cogLoad && !whyHelps) return null;
  return (
    <div style={{
      background: 'rgba(184,212,255,0.05)', border: '1px solid rgba(184,212,255,0.12)',
      borderRadius: 14, padding: '14px 18px',
    }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
      }}>
        <span style={{
          fontSize: 10.5, fontWeight: 700, color: 'rgba(184,212,255,0.52)',
          letterSpacing: '0.11em', textTransform: 'uppercase',
        }}>🧠 Cognitive Load Theory Analysis</span>
        <span style={{ fontSize: 10, color: 'rgba(184,212,255,0.40)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {whyHelps && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(184,212,255,0.42)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Why this helps</div>
              <p style={{ fontSize: 13, color: 'rgba(255,248,240,0.55)', lineHeight: 1.72, fontWeight: 300, margin: 0 }}>
                {whyHelps}
              </p>
            </div>
          )}
          {cogLoad && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(184,212,255,0.42)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Extraneous load removed</div>
              <p style={{ fontSize: 13, color: 'rgba(255,248,240,0.55)', lineHeight: 1.72, fontWeight: 300, margin: 0 }}>
                {cogLoad}
              </p>
            </div>
          )}
          <p style={{ fontSize: 10.5, color: 'rgba(255,248,240,0.22)', fontStyle: 'italic', margin: 0 }}>
            Based on Sweller (1988) Cognitive Load Theory — familiar context reduces extraneous load.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Batch result view ──────────────────────────────────────── */
function BatchResults({ results, onReset }) {
  const [active, setActive] = useState(0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'rgba(212,184,255,0.45)', marginBottom: 7, fontWeight: 600 }}>Batch results</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 400,
            color: 'rgba(255,248,240,0.90)' }}>{results.length} regions localised</h2>
        </div>
        <button className="btn btn-outline btn-sm" onClick={onReset}>↩ Try another</button>
      </div>

      {/* Region tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {results.map((r, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            padding: '7px 16px', borderRadius: 999, fontSize: 12.5, fontWeight: 500,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            background: active === i ? 'rgba(212,184,255,0.16)' : 'rgba(255,248,240,0.04)',
            color: active === i ? '#D4B8FF' : 'rgba(255,248,240,0.45)',
            border: active === i ? '1px solid rgba(212,184,255,0.28)' : '1px solid rgba(255,248,240,0.08)',
            transition: 'all 0.18s',
          }}>{r.region}</button>
        ))}
      </div>

      {results[active] && <SingleResult data={results[active]} />}
    </div>
  );
}

/* ── Single result ──────────────────────────────────────────── */
function SingleResult({ data }) {
  const [view, setView] = useState('side');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 7 }}>
        {[
          ['side',     '⊟ Side by side'],
          ['original', '📖 Original'],
          ['local',    '✦ Localised'],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setView(k)} style={{
            padding: '7px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            background: view === k ? 'rgba(255,212,184,0.12)' : 'rgba(255,248,240,0.04)',
            color: view === k ? '#FFD4B8' : 'rgba(255,248,240,0.38)',
            border: view === k ? '1px solid rgba(255,212,184,0.22)' : '1px solid rgba(255,248,240,0.08)',
            transition: 'all 0.18s',
          }}>{l}</button>
        ))}
      </div>

      {/* Text panels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: view === 'side' ? '1fr 1fr' : '1fr',
        gap: 16,
      }}>
        {(view === 'side' || view === 'original') && (
          <div className="glass" style={{ borderRadius: 16, padding: '22px' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'rgba(255,248,240,0.28)', marginBottom: 13, fontWeight: 600 }}>📖 Original</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.9, color: 'rgba(255,248,240,0.62)', fontWeight: 300, margin: 0 }}>
              {data.original_text}
            </p>
          </div>
        )}
        {(view === 'side' || view === 'local') && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(212,184,255,0.08), rgba(184,212,255,0.06))',
            border: '1px solid rgba(212,184,255,0.16)',
            borderRadius: 16, padding: '22px',
          }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'rgba(212,184,255,0.50)', marginBottom: 13, fontWeight: 600 }}>
              ✦ Localised — {data.region}
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.9, color: 'rgba(255,248,240,0.78)', fontWeight: 300, margin: 0 }}>
              {data.rewritten_text}
            </p>
          </div>
        )}
      </div>

      <InvarianceWarning inv={data.mathematical_invariance} />
      <ChangesTable changes={data.changes_made} />
      <CLTPanel cogLoad={data.cognitive_load_reduction} whyHelps={data.why_this_helps} />

      {data.cultural_authenticity_notes &&
        !data.cultural_authenticity_notes.includes('could not be completed') && (
        <div style={{
          background: 'rgba(255,248,240,0.025)', border: '1px solid rgba(255,248,240,0.07)',
          borderRadius: 12, padding: '12px 16px',
        }}>
          <div style={{ fontSize: 10, letterSpacing: '0.10em', textTransform: 'uppercase',
            color: 'rgba(255,248,240,0.28)', marginBottom: 6, fontWeight: 600 }}>📌 Cultural notes</div>
          <p style={{ fontSize: 12.5, color: 'rgba(255,248,240,0.40)', lineHeight: 1.7, fontWeight: 300, margin: 0 }}>
            {data.cultural_authenticity_notes}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Main export ────────────────────────────────────────────── */
export default function HyperOutput({ data, onReset }) {
  // Batch result: has `results` array
  if (data?.results) {
    return <BatchResults results={data.results} onReset={onReset} />;
  }

  // Single result
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'rgba(212,184,255,0.45)', marginBottom: 7, fontWeight: 600 }}>Localised content</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 400,
            color: 'rgba(255,248,240,0.90)', marginBottom: 6 }}>For {data.region}</h2>
          {data.language_hint && (
            <span style={{
              background: 'rgba(255,212,184,0.10)', color: '#FFD4B8',
              border: '1px solid rgba(255,212,184,0.20)',
              borderRadius: 6, padding: '2px 9px', fontSize: 11, fontWeight: 600,
            }}>{data.language_hint}</span>
          )}
        </div>
        <button className="btn btn-outline btn-sm" onClick={onReset}>↩ Try another</button>
      </div>

      <SingleResult data={data} />
    </div>
  );
}