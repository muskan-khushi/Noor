import React, { useState } from 'react';
import GapModule from './GapModule';

const PRIORITY_STYLES = {
  CRITICAL: { bg: '#fee2e2', text: '#b91c1c', border: '#ef4444', leftBar: '#dc2626' },
  HIGH:     { bg: '#fef3c7', text: '#92400e', border: '#f59e0b', leftBar: '#d97706' },
  MEDIUM:   { bg: '#dbeafe', text: '#1d4ed8', border: '#60a5fa', leftBar: '#2563eb' },
};

// Mini bar showing three signal scores
function SignalBreakdown({ signals }) {
  if (!signals) return null;
  const bars = [
    { label: 'Dense',  key: 'dense_cosine',  color: '#8b5cf6', help: 'Semantic embedding similarity' },
    { label: 'Lexical', key: 'bm25_lexical', color: '#0ea5e9', help: 'BM25 keyword overlap' },
    { label: 'N-gram', key: 'ngram_jaccard', color: '#f97316', help: 'Character bigram Jaccard' },
  ];
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
      {bars.map(({ label, key, color, help }) => {
        const val = signals[key] || 0;
        return (
          <div key={key} title={help} style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3 }}>{label}</div>
            <div style={{ background: '#f1f5f9', borderRadius: 3, height: 6, overflow: 'hidden' }}>
              <div style={{
                width: `${(val * 100).toFixed(0)}%`, height: '100%',
                background: color, borderRadius: 3,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{(val * 100).toFixed(0)}%</div>
          </div>
        );
      })}
    </div>
  );
}

// Confidence interval indicator
function ConfidenceBar({ ci, fused }) {
  if (!ci || ci.length < 2) return null;
  const [low, high] = ci;
  const range = high - low;
  const isNarrow = range < 0.10;
  return (
    <span title={`95% CI: [${(low*100).toFixed(0)}%, ${(high*100).toFixed(0)}%]`}
      style={{
        fontSize: 11, fontWeight: 600,
        color: isNarrow ? '#22c55e' : '#f59e0b',
        marginLeft: 8,
        cursor: 'help',
      }}>
      {isNarrow ? '● High confidence' : '◐ Borderline'}
    </span>
  );
}

// Exam frequency badge
function FrequencyBadge({ frequency }) {
  if (!frequency) return null;
  const pct = Math.round(frequency * 100);
  const color = pct >= 90 ? '#dc2626' : pct >= 80 ? '#d97706' : '#6b7280';
  return (
    <span title={`Appears in ~${pct}% of recent ${'"'}exam${'"'} papers`}
      style={{ fontSize: 11, color, fontWeight: 600, marginLeft: 8 }}>
      📊 {pct}% exam freq
    </span>
  );
}

export default function GapCard({ gap }) {
  const [open, setOpen] = useState(false);
  const p = gap.priority || 'MEDIUM';
  const styles = PRIORITY_STYLES[p] || PRIORITY_STYLES.MEDIUM;

  const hasModule = !!gap.studyModule;
  const compositeScore = gap.composite_priority
    ? `${(gap.composite_priority * 100).toFixed(0)}`
    : null;

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      border: '1.5px solid #e2e8f0',
      borderLeft: `4px solid ${styles.leftBar}`,
      overflow: 'hidden',
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Card header */}
      <div style={{ padding: '16px 20px', cursor: 'pointer' }} onClick={() => setOpen(!open)}>

        {/* Top row: badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-block', padding: '2px 10px',
            borderRadius: 999, fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.04em',
            background: styles.bg, color: styles.text,
          }}>{p}</span>

          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
            Match: {((gap.fused_score || gap.similarity_score || 0) * 100).toFixed(0)}%
          </span>

          <ConfidenceBar ci={gap.confidence_interval} fused={gap.fused_score} />
          <FrequencyBadge frequency={gap.exam_frequency} />

          {compositeScore && (
            <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>
              Priority score: {compositeScore}
            </span>
          )}
        </div>

        {/* Topic */}
        <h3 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, marginBottom: 8, color: '#1e293b' }}>
          {gap.topic}
        </h3>

        {/* Closest state match */}
        {gap.closest_state_topic && (
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
            Closest in your syllabus:{' '}
            <em style={{ color: '#64748b' }}>
              {gap.closest_state_topic.slice(0, 120)}
              {gap.closest_state_topic.length > 120 ? '…' : ''}
            </em>
          </p>
        )}

        {/* Signal breakdown */}
        {gap.signal_breakdown && (
          <SignalBreakdown signals={gap.signal_breakdown} />
        )}

        {/* Expand/collapse */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#f97316', fontWeight: 600 }}>
            {open
              ? '▲ Hide Study Module'
              : hasModule
                ? '▼ View AI-Generated Study Module'
                : '▼ View Details'
            }
          </span>
          {hasModule && (
            <span style={{
              background: '#f97316', color: '#fff',
              fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>AI Module</span>
          )}
        </div>
      </div>

      {/* Expanded: study module or message */}
      {open && (
        hasModule
          ? <GapModule module={gap.studyModule} />
          : (
            <div style={{
              padding: '12px 20px', borderTop: '1px solid #e2e8f0',
              background: '#f8fafc', color: '#64748b', fontSize: 14,
            }}>
              {p === 'CRITICAL'
                ? 'AI study module could not be generated for this gap. Try the Hyperlocal Generator to get a localised explanation of this concept.'
                : `Study modules are auto-generated for CRITICAL gaps only. This is a ${p} priority gap — address it after completing CRITICAL topics.`
              }
            </div>
          )
      )}
    </div>
  );
}