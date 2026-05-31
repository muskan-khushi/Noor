import React, { useState } from 'react';
import RegionPicker from './RegionPicker';
import { generateHyperlocal, batchGenerateHyperlocal } from '../../api/hyperlocalGen';
import Loader from '../common/Loader';
import ErrorBanner from '../common/ErrorBanner';

const SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','Economics'];
const CLASSES  = ['9','10','11','12'];

export default function HyperForm({ onResult }) {
  const [text, setText]       = useState('');
  const [concept, setConcept] = useState('');
  const [subject, setSubject] = useState('');
  const [cls, setCls]         = useState('11');
  const [region, setRegion]   = useState('');
  const [regions, setRegions] = useState([]);
  const [batch, setBatch]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async () => {
    if (!text.trim() || !concept.trim() || !subject) { setError('Please fill all fields.'); return; }
    if (batch && regions.length === 0) { setError('Select at least one region.'); return; }
    if (!batch && !region) { setError('Please select a region.'); return; }
    setLoading(true); setError('');
    try {
      let result;
      if (batch) {
        result = await batchGenerateHyperlocal({ original_text: text, concept, subject, class_level: cls, region_keys: regions });
      } else {
        result = await generateHyperlocal({ original_text: text, concept, subject, class_level: cls, region_key: region });
      }
      onResult(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Generation failed. Please try again.');
    } finally { setLoading(false); }
  };

  if (loading) return (
    <Loader message="Rewriting with local cultural context… applying Cognitive Load Theory. This takes 10–15 seconds." />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Main textarea */}
      <div className="form-group">
        <label>Textbook text or word problem</label>
        <textarea
          rows={6}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste any textbook paragraph, word problem, or explanation here…"
        />
      </div>

      {/* Metadata row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
        <div className="form-group">
          <label>Concept / topic</label>
          <input value={concept} onChange={e => setConcept(e.target.value)} placeholder="e.g. Speed and Distance" />
        </div>
        <div className="form-group">
          <label>Subject</label>
          <div style={{ position: 'relative' }}>
            <select value={subject} onChange={e => setSubject(e.target.value)} style={{ paddingRight: 28 }}>
              <option value="">Select…</option>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
            <Caret />
          </div>
        </div>
        <div className="form-group">
          <label>Class</label>
          <div style={{ position: 'relative' }}>
            <select value={cls} onChange={e => setCls(e.target.value)} style={{ paddingRight: 28 }}>
              {CLASSES.map(c => <option key={c}>{c}</option>)}
            </select>
            <Caret />
          </div>
        </div>
      </div>

      {/* Batch toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
        <div onClick={() => setBatch(b => !b)} style={{
          width: 36, height: 20, borderRadius: 999, cursor: 'pointer',
          background: batch ? 'linear-gradient(135deg, #FFB5C8, #D4B8FF)' : 'rgba(255,248,240,0.10)',
          border: '1px solid rgba(255,248,240,0.16)',
          position: 'relative', transition: 'all 0.25s ease', flexShrink: 0,
        }}>
          <div style={{
            position: 'absolute', top: 3, left: batch ? 18 : 3,
            width: 12, height: 12, borderRadius: '50%',
            background: batch ? '#1A0F2E' : 'rgba(255,248,240,0.45)',
            transition: 'left 0.22s ease',
          }} />
        </div>
        <span style={{ fontSize: 13, color: 'rgba(255,248,240,0.55)', fontWeight: 500 }}>
          Generate for multiple regions simultaneously
        </span>
      </label>

      {/* Region picker */}
      <RegionPicker
        value={batch ? regions : region}
        onChange={batch ? setRegions : setRegion}
        multi={batch}
      />

      <ErrorBanner message={error} />

      <button
        className="btn btn-primary btn-lg"
        onClick={handleSubmit}
        style={{ alignSelf: 'flex-start' }}
      >
        {batch ? 'Batch localise ↗' : 'Localise this ↗'}
      </button>
    </div>
  );
}

function Caret() {
  return (
    <span style={{
      position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
      pointerEvents: 'none', color: 'rgba(255,248,240,0.28)', fontSize: 10,
    }}>▾</span>
  );
}