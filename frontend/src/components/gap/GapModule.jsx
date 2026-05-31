import React, { useState } from 'react';

const BLOOM = {
  Remember:   { bg: 'rgba(184,255,232,0.12)', color: '#B8FFE8', border: 'rgba(184,255,232,0.22)' },
  Understand: { bg: 'rgba(184,212,255,0.12)', color: '#B8D4FF', border: 'rgba(184,212,255,0.22)' },
  Apply:      { bg: 'rgba(255,212,184,0.12)', color: '#FFD4B8', border: 'rgba(255,212,184,0.22)' },
  Analyse:    { bg: 'rgba(212,184,255,0.12)', color: '#D4B8FF', border: 'rgba(212,184,255,0.22)' },
  Evaluate:   { bg: 'rgba(255,181,200,0.12)', color: '#FFB5C8', border: 'rgba(255,181,200,0.22)' },
  Create:     { bg: 'rgba(255,232,184,0.12)', color: '#FFE8B8', border: 'rgba(255,232,184,0.22)' },
};

function BloomBadge({ level }) {
  if (!level) return null;
  const s = BLOOM[level] || BLOOM.Apply;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 999,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>Bloom: {level}</span>
  );
}

function CopyBtn({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(()=>setDone(false),1800); }}
      style={{
        fontSize: 10.5, padding: '3px 9px', borderRadius: 6,
        border: '1px solid rgba(255,212,184,0.16)',
        background: 'rgba(255,248,240,0.04)', cursor: 'pointer',
        color: done ? '#B8FFE8' : 'rgba(255,248,240,0.38)',
        fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
        transition: 'color 0.2s',
      }}>
      {done ? '✓ copied' : '⧉ copy'}
    </button>
  );
}

function SectionHead({ emoji, title, badge, copyText }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,248,240,0.32)',
        letterSpacing: '0.10em', textTransform: 'uppercase' }}>
        {emoji} {title}
      </span>
      {badge}
      {copyText && <CopyBtn text={copyText} />}
    </div>
  );
}

export default function GapModule({ module: m, accentColor = '#FFD4B8' }) {
  if (!m) return null;

  const fullText = [
    m.explanation && `EXPLANATION:\n${m.explanation}`,
    m.key_points?.length && `KEY POINTS:\n${m.key_points.map((k,i)=>`${i+1}. ${k}`).join('\n')}`,
    m.example_problem && `EXAMPLE PROBLEM:\n${m.example_problem}`,
    m.solution && `SOLUTION:\n${m.solution}`,
    m.common_mistake && `COMMON MISTAKE:\n${m.common_mistake}`,
  ].filter(Boolean).join('\n\n');

  return (
    <div style={{ borderTop: '1px solid rgba(255,212,184,0.08)' }}>
      {/* Module header bar */}
      <div style={{
        padding: '11px 20px',
        background: 'rgba(255,248,240,0.03)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: 'rgba(255,248,240,0.55)' }}>
            AI Study Module
          </span>
          <BloomBadge level={m.bloom_level} />
          {m.difficulty_estimate && (
            <span style={{ fontSize: 10.5, color: 'rgba(255,248,240,0.28)' }}>
              {m.difficulty_estimate}
            </span>
          )}
        </div>
        <CopyBtn text={fullText} />
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Prerequisites */}
        {m.prerequisite_concepts?.length > 0 && (
          <div style={{
            background: 'rgba(184,212,255,0.08)', border: '1px solid rgba(184,212,255,0.14)',
            borderRadius: 12, padding: '11px 15px',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(184,212,255,0.55)',
              letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 8 }}>
              📋 Revise first
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {m.prerequisite_concepts.map((c, i) => (
                <span key={i} style={{
                  background: 'rgba(255,248,240,0.05)', border: '1px solid rgba(184,212,255,0.18)',
                  borderRadius: 6, padding: '2px 9px', fontSize: 12, color: '#B8D4FF',
                }}>→ {c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Explanation */}
        <div>
          <SectionHead emoji="📖" title="From-scratch explanation" />
          <p style={{ fontSize: 13.5, lineHeight: 1.85, color: 'rgba(255,248,240,0.68)', fontWeight: 300 }}>
            {m.explanation}
          </p>
        </div>

        {/* Mnemonic */}
        {m.mnemonics && (
          <div style={{
            background: 'rgba(212,184,255,0.08)', border: '1px solid rgba(212,184,255,0.16)',
            borderRadius: 10, padding: '10px 14px',
          }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#D4B8FF' }}>🧠 Memory trick: </span>
            <span style={{ fontSize: 13, color: 'rgba(212,184,255,0.80)', fontWeight: 300 }}>{m.mnemonics}</span>
          </div>
        )}

        {/* Key points */}
        {m.key_points?.length > 0 && (
          <div>
            <SectionHead emoji="🔑" title="Must-remember points" />
            <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {m.key_points.map((kp, i) => (
                <li key={i} style={{ fontSize: 13.5, lineHeight: 1.7, color: 'rgba(255,248,240,0.62)', fontWeight: 300 }}>
                  {kp}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Example + solution */}
        <div style={{
          background: 'rgba(255,248,240,0.025)', border: '1px solid rgba(255,248,240,0.07)',
          borderRadius: 14, padding: '16px 18px',
        }}>
          <SectionHead
            emoji="📝" title="Exam-style question"
            badge={m.example_problem_bloom ? <BloomBadge level={m.example_problem_bloom} /> : null}
            copyText={m.example_problem}
          />
          <p style={{ fontSize: 13.5, lineHeight: 1.75, color: 'rgba(255,248,240,0.72)', marginBottom: 16, fontWeight: 400 }}>
            {m.example_problem}
          </p>

          <div style={{ borderTop: '1px dashed rgba(255,212,184,0.12)', paddingTop: 14 }}>
            <SectionHead emoji="✓" title="Step-by-step solution" copyText={m.solution} />
            <p style={{
              fontSize: 13.5, lineHeight: 1.82, fontWeight: 300, whiteSpace: 'pre-line',
              color: `${accentColor}CC`,
            }}>{m.solution}</p>
          </div>
        </div>

        {/* Common mistake */}
        <div style={{
          background: 'rgba(255,232,184,0.06)', border: '1px solid rgba(255,232,184,0.12)',
          borderRadius: 14, padding: '14px 18px',
        }}>
          <SectionHead emoji="⚠" title="Common mistake" />
          <p style={{ fontSize: 13.5, lineHeight: 1.75, color: 'rgba(255,232,184,0.72)', fontWeight: 300 }}>
            {m.common_mistake}
          </p>
          {m.common_mistake_why && (
            <p style={{ fontSize: 12, color: 'rgba(255,232,184,0.45)', marginTop: 7, fontStyle: 'italic', fontWeight: 300 }}>
              Why this happens: {m.common_mistake_why}
            </p>
          )}
        </div>

        {/* Related topics */}
        {m.similar_topics?.length > 0 && (
          <div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,248,240,0.30)', marginBottom: 8,
              textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 600 }}>
              🔗 Study next
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {m.similar_topics.map((t, i) => (
                <span key={i} style={{
                  background: 'rgba(255,248,240,0.05)', border: '1px solid rgba(255,248,240,0.10)',
                  borderRadius: 8, padding: '3px 11px', fontSize: 12, color: 'rgba(255,248,240,0.42)',
                }}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {m._generation_note === 'auto_generated_fallback' && (
          <p style={{ fontSize: 11, color: 'rgba(255,248,240,0.22)', fontStyle: 'italic' }}>
            ⚠ Module generated via fallback path. Verify with NCERT and official coaching material.
          </p>
        )}
      </div>
    </div>
  );
}