import React, { useState, useMemo } from 'react';
import GapCard from './GapCard';

const FILTERS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'];

const PRIORITY_COLORS = {
  CRITICAL: { bg: '#fee2e2', text: '#b91c1c', border: '#ef4444', accent: '#dc2626' },
  HIGH:     { bg: '#fef3c7', text: '#92400e', border: '#f59e0b', accent: '#d97706' },
  MEDIUM:   { bg: '#dbeafe', text: '#1d4ed8', border: '#60a5fa', accent: '#2563eb' },
  COVERED:  { bg: '#d1fae5', text: '#065f46', border: '#34d399', accent: '#059669' },
};

// Compact circular progress ring
function RingProgress({ percent, color = '#f97316', size = 80, stroke = 8 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text
        x="50%" y="50%"
        textAnchor="middle" dominantBaseline="middle"
        style={{ transform: 'rotate(90deg)', transformOrigin: '50% 50%', fill: color, fontSize: 14, fontWeight: 700 }}
      >
        {percent}%
      </text>
    </svg>
  );
}

// Horizontal bar showing coverage breakdown
function CoverageBar({ report }) {
  const total = report.total_national_topics || 1;
  const { CRITICAL = 0, HIGH = 0, MEDIUM = 0, COVERED = 0 } = report.coverage_by_band || {};
  const segments = [
    { label: 'CRITICAL', count: CRITICAL, ...PRIORITY_COLORS.CRITICAL },
    { label: 'HIGH',     count: HIGH,     ...PRIORITY_COLORS.HIGH },
    { label: 'MEDIUM',   count: MEDIUM,   ...PRIORITY_COLORS.MEDIUM },
    { label: 'COVERED',  count: COVERED,  ...PRIORITY_COLORS.COVERED },
  ];
  return (
    <div>
      <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
        {segments.map(({ label, count, accent }) => {
          const pct = (count / total) * 100;
          if (pct === 0) return null;
          return (
            <div key={label} title={`${label}: ${count} topics`}
              style={{ width: `${pct}%`, background: accent, transition: 'width 0.6s ease' }} />
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {segments.map(({ label, count, text, bg }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: bg, border: `1.5px solid ${PRIORITY_COLORS[label]?.border}`, display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: '#64748b' }}>{label}: <strong style={{ color: text }}>{count}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Alignment score card
function AlignmentCard({ report }) {
  if (!report) return null;
  const coverageColor = report.alignment_score >= 75 ? '#22c55e'
                      : report.alignment_score >= 50 ? '#f59e0b'
                      : '#ef4444';
  return (
    <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', borderRadius: 16, padding: '24px', color: '#fff', marginBottom: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>
        Curriculum Alignment Analysis
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <RingProgress percent={report.alignment_score} color={coverageColor} size={90} stroke={9} />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Coverage</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Marks at Risk', value: `~${report.marks_at_risk_estimate}`, unit: 'marks' },
              { label: 'Study Time Needed', value: `~${report.study_hours_estimate}`, unit: 'hours' },
              { label: 'Topics Covered', value: `${report.coverage_by_band?.COVERED || 0}/${report.total_national_topics}`, unit: '' },
              { label: 'Weighted Coverage', value: `${report.weighted_alignment}%`, unit: '' },
            ].map(({ label, value, unit }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>
                  {value}<span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.5)', marginLeft: 3 }}>{unit}</span>
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

export default function GapReport({ data, onReset }) {
  const [filter, setFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('priority');  // 'priority' | 'frequency' | 'similarity'

  const gaps = data.gaps || [];
  const alignmentReport = data.alignment_report || null;

  const filteredGaps = useMemo(() => {
    let result = filter === 'ALL' ? gaps : gaps.filter(g => g.priority === filter);
    if (sortBy === 'frequency') {
      result = [...result].sort((a, b) => (b.exam_frequency || 0) - (a.exam_frequency || 0));
    } else if (sortBy === 'similarity') {
      result = [...result].sort((a, b) => (a.fused_score || 0) - (b.fused_score || 0));
    }
    // Default: already sorted by composite_priority from server
    return result;
  }, [gaps, filter, sortBy]);

  const criticalCount = gaps.filter(g => g.priority === 'CRITICAL').length;
  const highCount     = gaps.filter(g => g.priority === 'HIGH').length;
  const mediumCount   = gaps.filter(g => g.priority === 'MEDIUM').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Your Gap Report</h2>
          <p style={{ color: '#64748b', maxWidth: 640, lineHeight: 1.6 }}>{data.summary}</p>
        </div>
        <button className="btn btn-outline" onClick={onReset}>↩ New Analysis</button>
      </div>

      {/* Alignment dashboard */}
      {alignmentReport && <AlignmentCard report={alignmentReport} />}

      {/* Quick stats — shown only if no alignment report */}
      {!alignmentReport && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { num: criticalCount, label: 'Critical Gaps', bg: PRIORITY_COLORS.CRITICAL.bg, color: PRIORITY_COLORS.CRITICAL.text },
            { num: highCount,     label: 'High Priority', bg: PRIORITY_COLORS.HIGH.bg,     color: PRIORITY_COLORS.HIGH.text },
            { num: gaps.length,   label: 'Total Gaps',    bg: '#f1f5f9',                   color: '#475569' },
          ].map(({ num, label, bg, color }) => (
            <div key={label} style={{ background: bg, borderRadius: 12, padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: 38, fontWeight: 800, color }}>{num}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters + sort */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FILTERS.map(f => {
            const count = f === 'ALL' ? gaps.length
                        : f === 'CRITICAL' ? criticalCount
                        : f === 'HIGH' ? highCount
                        : mediumCount;
            return (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                background: filter === f ? '#1e293b' : '#fff',
                color: filter === f ? '#fff' : '#1e293b',
                border: filter === f ? '1.5px solid #1e293b' : '1.5px solid #e2e8f0',
              }}>
                {f}
                <span style={{
                  background: filter === f ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                  borderRadius: 999, padding: '0 6px', fontSize: 11,
                }}>{count}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>Sort:</span>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ fontSize: 13, padding: '6px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff' }}>
            <option value="priority">Composite Priority</option>
            <option value="frequency">Exam Frequency</option>
            <option value="similarity">Similarity Score</option>
          </select>
        </div>
      </div>

      {/* Gap cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredGaps.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <p style={{ fontSize: 16, fontWeight: 600 }}>No {filter !== 'ALL' ? filter : ''} gaps found.</p>
              {filter !== 'ALL' && (
                <button className="btn btn-outline btn-sm" onClick={() => setFilter('ALL')} style={{ marginTop: 12 }}>
                  Show all gaps
                </button>
              )}
            </div>
          )
          : filteredGaps.map((gap, i) => <GapCard key={`${gap.topic}-${i}`} gap={gap} />)
        }
      </div>

      {/* Footer note */}
      <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', paddingTop: 8 }}>
        Gap detection uses multi-signal semantic similarity (dense embeddings + BM25 + n-gram Jaccard).
        Marks-at-risk estimates are based on 2018–2024 exam paper frequency analysis.
      </div>
    </div>
  );
}