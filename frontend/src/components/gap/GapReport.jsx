import React, { useState, useMemo } from 'react';
import GapCard from './GapCard';

const PRIORITY_ACCENT = {
  CRITICAL: '#FFB5B5',
  HIGH:     '#FFE8B8',
  MEDIUM:   '#B8D4FF',
  COVERED:  '#B8FFE8',
};

/* ── Ring progress ─────────────────────────────────────────── */
function Ring({ pct, color, size = 88, stroke = 9 }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,248,240,0.07)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={off}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.9s ease' }} />
      <text x="50%" y="50%"
        textAnchor="middle" dominantBaseline="middle"
        style={{
          transform: 'rotate(90deg)', transformOrigin: '50% 50%',
          fill: color, fontSize: 15, fontWeight: 700,
          fontFamily: "'Cormorant Garamond', serif",
        }}>
        {pct}%
      </text>
    </svg>
  );
}

/* ── Horizontal coverage bar ───────────────────────────────── */
function CoverageBar({ report }) {
  const total = report.total_national_topics || 1;
  const bands = [
    { key: 'CRITICAL', color: '#dc2626' },
    { key: 'HIGH',     color: '#d97706' },
    { key: 'MEDIUM',   color: '#2563eb' },
    { key: 'COVERED',  color: '#059669' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
        {bands.map(({ key, color }) => {
          const pct = ((report.coverage_by_band?.[key] || 0) / total) * 100;
          if (!pct) return null;
          return (
            <div key={key} title={`${key}: ${report.coverage_by_band[key]}`}
              style={{ width: `${pct}%`, background: color, transition: 'width 0.7s ease' }} />
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {bands.map(({ key, color }) => {
          const n = report.coverage_by_band?.[key] || 0;
          if (!n) return null;
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
              <span style={{ fontSize: 11, color: 'rgba(255,248,240,0.40)' }}>
                {key}: <strong style={{ color: PRIORITY_ACCENT[key] }}>{n}</strong>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Alignment panel ───────────────────────────────────────── */
function AlignmentPanel({ report }) {
  if (!report) return null;
  const coverColor = report.alignment_score >= 75 ? '#B8FFE8'
                   : report.alignment_score >= 50 ? '#FFE8B8' : '#FFB5B5';
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,181,200,0.07), rgba(212,184,255,0.06), rgba(184,212,255,0.05))',
      border: '1px solid rgba(255,212,184,0.12)',
      borderRadius: 20, padding: '26px 24px', marginBottom: 24,
    }}>
      <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'rgba(255,212,184,0.40)', marginBottom: 20, fontWeight: 600 }}>
        Curriculum Alignment Analysis
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Ring pct={report.alignment_score} color={coverColor} />
          <div style={{ fontSize: 10.5, color: 'rgba(255,248,240,0.35)', marginTop: 5, letterSpacing: '0.06em' }}>
            COVERAGE
          </div>
        </div>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Marks at risk',    val: `~${report.marks_at_risk_estimate}`, unit: 'marks', color: '#FFB5B5' },
              { label: 'Study time',       val: `~${report.study_hours_estimate}`,   unit: 'hrs',   color: '#D4B8FF' },
              { label: 'Topics covered',   val: `${report.coverage_by_band?.COVERED || 0}/${report.total_national_topics}`, unit: '', color: '#FFE8B8' },
              { label: 'Weighted align',   val: `${report.weighted_alignment}%`,     unit: '',      color: '#B8D4FF' },
            ].map(({ label, val, unit, color }) => (
              <div key={label} style={{
                background: 'rgba(255,248,240,0.04)', borderRadius: 10,
                padding: '10px 13px',
              }}>
                <div style={{ fontSize: 10, color: 'rgba(255,248,240,0.35)', marginBottom: 4,
                  letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 22, fontWeight: 400, color, lineHeight: 1,
                }}>
                  {val}
                  {unit && <span style={{ fontSize: 11, color: 'rgba(255,248,240,0.30)', marginLeft: 3 }}>{unit}</span>}
                </div>
              </div>
            ))}
          </div>
          <CoverageBar report={report} />
        </div>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function GapReport({ data, onReset }) {
  const [filter, setFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('priority');

  const gaps = data.gaps || [];
  const ar   = data.alignment_report || null;

  const counts = useMemo(() => ({
    ALL:      gaps.length,
    CRITICAL: gaps.filter(g => g.priority === 'CRITICAL').length,
    HIGH:     gaps.filter(g => g.priority === 'HIGH').length,
    MEDIUM:   gaps.filter(g => g.priority === 'MEDIUM').length,
  }), [gaps]);

  const shown = useMemo(() => {
    let list = filter === 'ALL' ? gaps : gaps.filter(g => g.priority === filter);
    if (sortBy === 'frequency') list = [...list].sort((a,b) => (b.exam_frequency||0) - (a.exam_frequency||0));
    if (sortBy === 'similarity') list = [...list].sort((a,b) => (a.fused_score||0) - (b.fused_score||0));
    return list;
  }, [gaps, filter, sortBy]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 32, fontWeight: 400, color: 'rgba(255,248,240,0.92)', marginBottom: 6,
          }}>Your Gap Report</h2>
          <p style={{ color: 'rgba(255,248,240,0.42)', fontSize: 13.5, lineHeight: 1.7, maxWidth: 600, fontWeight: 300 }}>
            {data.summary}
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={onReset}>↩ New analysis</button>
      </div>

      {/* Alignment panel */}
      {ar && <AlignmentPanel report={ar} />}

      {/* Fallback stat chips when no alignment report */}
      {!ar && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[
            { n: counts.CRITICAL, label: 'Critical',    color: '#FFB5B5', bg: 'rgba(255,100,100,0.10)' },
            { n: counts.HIGH,     label: 'High',        color: '#FFE8B8', bg: 'rgba(255,200,100,0.10)' },
            { n: counts.ALL,      label: 'Total gaps',  color: '#D4B8FF', bg: 'rgba(212,184,255,0.10)' },
          ].map(({ n, label, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: 14, padding: '18px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 400, color }}>{n}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,248,240,0.38)', textTransform: 'uppercase',
                letterSpacing: '0.08em', fontWeight: 600, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter + sort row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {['ALL','CRITICAL','HIGH','MEDIUM'].map(f => {
            const accent = { ALL: 'rgba(255,248,240,0.70)', CRITICAL: '#FFB5B5', HIGH: '#FFE8B8', MEDIUM: '#B8D4FF' }[f];
            return (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '7px 15px', borderRadius: 999,
                fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                fontFamily: "'DM Sans', sans-serif",
                background: filter===f ? `${accent}20` : 'rgba(255,248,240,0.03)',
                color:      filter===f ? accent : 'rgba(255,248,240,0.38)',
                border:     filter===f ? `1px solid ${accent}38` : '1px solid rgba(255,248,240,0.08)',
                transition: 'all 0.18s',
              }}>
                {f} ({counts[f]})
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 11.5, color: 'rgba(255,248,240,0.32)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Sort</span>
          <div className="form-group" style={{ margin: 0 }}>
            <div style={{ position: 'relative' }}>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ fontSize: 12.5, padding: '7px 28px 7px 12px' }}>
                <option value="priority">Composite Priority</option>
                <option value="frequency">Exam Frequency</option>
                <option value="similarity">Match Score</option>
              </select>
              <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                pointerEvents:'none', color:'rgba(255,248,240,0.28)', fontSize:9 }}>▾</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gap cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '44px 20px', color: 'rgba(255,248,240,0.35)' }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.6 }}>✦</div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 400 }}>
              No {filter !== 'ALL' ? filter.toLowerCase() : ''} gaps found.
            </p>
            {filter !== 'ALL' && (
              <button className="btn btn-outline btn-sm" onClick={() => setFilter('ALL')} style={{ marginTop: 14 }}>
                Show all
              </button>
            )}
          </div>
        ) : (
          shown.map((gap, i) => <GapCard key={`${gap.topic}-${i}`} gap={gap} />)
        )}
      </div>

      {/* Footer note */}
      <p style={{ fontSize: 11, color: 'rgba(255,248,240,0.22)', textAlign: 'center', lineHeight: 1.7 }}>
        Gap detection uses multi-signal semantic similarity: dense embeddings + BM25 + n-gram Jaccard.
        Marks-at-risk estimates are based on 2018–2024 exam paper frequency analysis.
      </p>
    </div>
  );
}