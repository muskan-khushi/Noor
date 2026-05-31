import React, { useState } from 'react';
import GapModule from './GapModule';

const P_STYLE = {
  CRITICAL: { bar: '#dc2626', badge: 'badge-critical', bg: 'rgba(255,100,100,0.05)' },
  HIGH:     { bar: '#d97706', badge: 'badge-high',     bg: 'rgba(255,200,100,0.04)' },
  MEDIUM:   { bar: '#2563eb', badge: 'badge-medium',   bg: 'rgba(140,180,255,0.04)' },
};

/* Three signal mini-bars */
function SignalBars({ s }) {
  if (!s) return null;
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
      {[
        { label: 'Semantic', val: s.dense_cosine,  color: '#D4B8FF' },
        { label: 'Lexical',  val: s.bm25_lexical,  color: '#B8D4FF' },
        { label: 'N-gram',   val: s.ngram_jaccard, color: '#FFD4B8' },
      ].map(({ label, val, color }) => (
        <div key={label} title={`${label}: ${Math.round((val||0)*100)}%`} style={{ flex: 1 }}>
          <div style={{ fontSize: 9.5, color: 'rgba(255,248,240,0.28)', marginBottom: 3,
            textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{label}</div>
          <div style={{ height: 3, background: 'rgba(255,248,240,0.07)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              width: `${Math.round((val||0)*100)}%`, height: '100%',
              background: `linear-gradient(90deg, ${color}70, ${color})`,
              borderRadius: 99, transition: 'width 0.6s ease',
            }} />
          </div>
          <div style={{ fontSize: 9.5, color: 'rgba(255,248,240,0.28)', marginTop: 2 }}>
            {Math.round((val||0)*100)}%
          </div>
        </div>
      ))}
    </div>
  );
}

/* Confidence pill */
function ConfidencePill({ ci }) {
  if (!ci || ci.length < 2) return null;
  const narrow = (ci[1] - ci[0]) < 0.10;
  return (
    <span title={`95% CI: [${Math.round(ci[0]*100)}%, ${Math.round(ci[1]*100)}%]`}
      style={{
        fontSize: 10.5, fontWeight: 600, cursor: 'help',
        color: narrow ? '#B8FFE8' : '#FFE8B8',
      }}>
      {narrow ? '● high confidence' : '◐ borderline'}
    </span>
  );
}

export default function GapCard({ gap }) {
  const [open, setOpen] = useState(false);
  const p = P_STYLE[gap.priority] || P_STYLE.MEDIUM;

  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden',
      border: '1px solid rgba(255,212,184,0.09)',
      borderLeft: `3px solid ${p.bar}`,
      background: open ? p.bg : 'rgba(255,248,240,0.02)',
      transition: 'all 0.20s ease',
    }}>
      {/* Header row — clickable */}
      <div
        style={{ padding: '16px 20px', cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
      >
        {/* Badge row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8, flexWrap: 'wrap' }}>
          <span className={`badge ${p.badge}`}>{gap.priority}</span>
          <span style={{ fontSize: 11.5, color: 'rgba(255,248,240,0.38)', fontWeight: 500 }}>
            Match {Math.round(((gap.fused_score||gap.similarity_score)||0)*100)}%
          </span>
          <ConfidencePill ci={gap.confidence_interval} />
          {gap.exam_frequency && (
            <span style={{ fontSize: 11, color: 'rgba(255,248,240,0.28)' }}>
              · {Math.round(gap.exam_frequency*100)}% exam freq
            </span>
          )}
          {gap.composite_priority && (
            <span style={{ fontSize: 10.5, color: 'rgba(255,248,240,0.22)', marginLeft: 'auto' }}>
              Priority score {Math.round(gap.composite_priority*100)}
            </span>
          )}
        </div>

        {/* Topic */}
        <h3 style={{
          fontSize: 14, fontWeight: 500,
          color: 'rgba(255,248,240,0.84)', lineHeight: 1.5, marginBottom: 6,
        }}>{gap.topic}</h3>

        {/* Closest state match */}
        {gap.closest_state_topic && (
          <p style={{ fontSize: 11.5, color: 'rgba(255,248,240,0.28)', marginBottom: 4, lineHeight: 1.5 }}>
            Closest in your syllabus:{' '}
            <em style={{ color: 'rgba(255,248,240,0.38)' }}>
              {gap.closest_state_topic.slice(0, 110)}{gap.closest_state_topic.length > 110 ? '…' : ''}
            </em>
          </p>
        )}

        <SignalBars s={gap.signal_breakdown} />

        {/* Expand toggle */}
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 12.5, color: '#FFD4B8', fontWeight: 500 }}>
            {open
              ? '▲ Collapse'
              : gap.studyModule ? '▼ View study module' : '▼ View details'
            }
          </span>
          {gap.studyModule && (
            <span style={{
              background: '#FFD4B8', color: '#1A0F2E',
              fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 4,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>AI Module</span>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {open && (
        gap.studyModule
          ? <GapModule module={gap.studyModule} accentColor={p.bar} />
          : (
            <div style={{
              borderTop: '1px solid rgba(255,212,184,0.08)',
              padding: '13px 20px', fontSize: 13,
              color: 'rgba(255,248,240,0.34)', fontWeight: 300, lineHeight: 1.7,
            }}>
              {gap.priority === 'CRITICAL'
                ? 'Study module generation failed for this gap. Use the Hyperlocal Generator to get an explanation in your regional context.'
                : `Study modules are auto-generated for CRITICAL gaps only. Tackle CRITICAL topics first, then return to ${gap.priority.toLowerCase()} priority gaps.`}
            </div>
          )
      )}
    </div>
  );
}