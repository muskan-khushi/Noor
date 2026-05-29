import React, { useState } from 'react';
import RegionPicker from './RegionPicker';
import { generateHyperlocal } from '../../api/hyperlocalGen';
import Loader from '../common/Loader';
import ErrorBanner from '../common/ErrorBanner';

const SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','Economics'];
const CLASSES  = ['9','10','11','12'];

export default function HyperForm({ onResult }) {
  const [text,setText]       = useState('');
  const [concept,setConcept] = useState('');
  const [subject,setSubject] = useState('');
  const [cls,setCls]         = useState('11');
  const [region,setRegion]   = useState('');
  const [loading,setLoading] = useState(false);
  const [error,setError]     = useState('');

  const handleSubmit = async () => {
    if (!text.trim() || !concept.trim() || !subject || !region) {
      setError('Please fill all fields.'); return;
    }
    setLoading(true); setError('');
    try {
      const result = await generateHyperlocal({ original_text:text, concept, subject, class_level:cls, region_key:region });
      onResult(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Generation failed. Please try again.');
    } finally { setLoading(false); }
  };

  if (loading) return <Loader message="Rewriting with local context… this takes 10-15 seconds" />;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div className="form-group">
        <label>Paste textbook text / word problem</label>
        <textarea
          rows={6} value={text} onChange={e => setText(e.target.value)}
          placeholder="Paste any textbook paragraph, word problem, or explanation here…"
          style={{ padding:12, border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:14, resize:'vertical', lineHeight:1.7 }}
        />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16 }}>
        <div className="form-group">
          <label>Concept / Topic</label>
          <input value={concept} onChange={e => setConcept(e.target.value)} placeholder="e.g. Speed and Distance" />
        </div>
        <div className="form-group">
          <label>Subject</label>
          <select value={subject} onChange={e => setSubject(e.target.value)}>
            <option value="">Select…</option>
            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Class</label>
          <select value={cls} onChange={e => setCls(e.target.value)}>
            {CLASSES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <RegionPicker value={region} onChange={setRegion} />
      <ErrorBanner message={error} />
      <button className="btn btn-primary btn-lg" onClick={handleSubmit} style={{ alignSelf:'flex-start' }}>
        Localise This →
      </button>
    </div>
  );
}
