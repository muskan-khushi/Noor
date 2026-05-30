import React, { useState } from 'react';

const BLOOM_COLORS = {
  Remember:   { bg: '#f0fdf4', text: '#166534', border: '#86efac' },
  Understand: { bg: '#eff6ff', text: '#1e40af', border: '#93c5fd' },
  Apply:      { bg: '#fff7ed', text: '#9a3412', border: '#fdba74' },
  Analyse:    { bg: '#fdf4ff', text: '#6b21a8', border: '#d8b4fe' },
  Evaluate:   { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' },
  Create:     { bg: '#f0fdfa', text: '#134e4a', border: '#5eead4' },
};

function BloomBadge({ level }) {
  if (!level) return null;
  const style = BLOOM_COLORS[level] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
      background: style.bg, color: style.text, border: `1px solid ${style.border}`,
      letterSpacing: '0.03em',
    }}>
      Bloom: {level}
    </span>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={handleCopy} style={{
      fontSize: 11, padding: '3px 10px', borderRadius: 6,
      border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer',
      color: copied ? '#22c55e' : '#64748b', fontWeight: 600,
    }}>
      {copied ? '✓ Copied' : '⧉ Copy'}
    </button>
  );
}

function Section({ emoji, title, badge, children, copyText }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>
          {emoji} {title}
        </h4>
        {badge}
        {copyText && <CopyButton text={copyText} />}
      </div>
      {children}
    </div>
  );
}

export default function GapModule({ module: m }) {
  if (!m) return null;

  const moduleText = [
    m.explanation && `EXPLANATION:\n${m.explanation}`,
    m.key_points?.length && `KEY POINTS:\n${m.key_points.map((kp, i) => `${i+1}. ${kp}`).join('\n')}`,
    m.example_problem && `EXAMPLE PROBLEM:\n${m.example_problem}`,
    m.solution && `SOLUTION:\n${m.solution}`,
    m.common_mistake && `COMMON MISTAKE:\n${m.common_mistake}`,
  ].filter(Boolean).join('\n\n');

  return (
    <div style={{ borderTop: '1px solid #e2e8f0', background: '#fafafa' }}>

      {/* Module header */}
      <div style={{
        padding: '12px 20px', background: '#1e293b', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>AI Study Module</span>
          {m.bloom_level && <BloomBadge level={m.bloom_level} />}
          {m.difficulty_estimate && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
              Difficulty: {m.difficulty_estimate}
            </span>
          )}
        </div>
        <CopyButton text={moduleText} />
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 4 }}>

        {/* Prerequisites */}
        {m.prerequisite_concepts?.length > 0 && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1e40af', marginBottom: 6 }}>
              📋 Revise first:
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {m.prerequisite_concepts.map((c, i) => (
                <span key={i} style={{
                  background: '#fff', border: '1px solid #93c5fd',
                  borderRadius: 4, padding: '2px 8px', fontSize: 12, color: '#1e40af',
                }}>→ {c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Explanation */}
        <Section emoji="📖" title="From Scratch Explanation">
          <p style={{ fontSize: 14, lineHeight: 1.8, color: '#374151', margin: 0 }}>{m.explanation}</p>
        </Section>

        {/* Mnemonic */}
        {m.mnemonics && (
          <div style={{ background: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6b21a8' }}>🧠 Memory trick: </span>
            <span style={{ fontSize: 13, color: '#581c87' }}>{m.mnemonics}</span>
          </div>
        )}

        {/* Key Points */}
        {m.key_points?.length > 0 && (
          <Section emoji="🔑" title="Must-Remember Points">
            <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {m.key_points.map((kp, i) => (
                <li key={i} style={{ fontSize: 14, lineHeight: 1.6, color: '#374151' }}>{kp}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* Example + Solution */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 8 }}>
          <Section
            emoji="📝"
            title="Exam-Style Question"
            badge={m.example_problem_bloom ? <BloomBadge level={m.example_problem_bloom} /> : null}
            copyText={m.example_problem}
          >
            <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0, fontWeight: 500 }}>{m.example_problem}</p>
          </Section>

          <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 12, marginTop: 4 }}>
            <Section emoji="✅" title="Step-by-Step Solution" copyText={m.solution}>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: '#166534', margin: 0, whiteSpace: 'pre-line' }}>
                {m.solution}
              </p>
            </Section>
          </div>
        </div>

        {/* Common Mistake */}
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: 16, marginBottom: 8 }}>
          <Section emoji="⚠️" title="Common Mistake">
            <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>{m.common_mistake}</p>
            {m.common_mistake_why && (
              <p style={{ fontSize: 12, color: '#92400e', marginTop: 6, fontStyle: 'italic' }}>
                Why it happens: {m.common_mistake_why}
              </p>
            )}
          </Section>
        </div>

        {/* Related topics */}
        {m.similar_topics?.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>🔗 Related topics to study next:</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {m.similar_topics.map((t, i) => (
                <span key={i} style={{
                  background: '#f1f5f9', border: '1px solid #e2e8f0',
                  borderRadius: 6, padding: '3px 10px', fontSize: 12, color: '#475569',
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Generation note */}
        {m._generation_note === 'auto_generated_fallback' && (
          <p style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginTop: 8 }}>
            ⚠ Module auto-generated with fallback. For full details, consult NCERT and official coaching material.
          </p>
        )}
      </div>
    </div>
  );
}