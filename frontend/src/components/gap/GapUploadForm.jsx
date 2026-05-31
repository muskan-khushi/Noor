import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { analyseGap } from '../../api/gapFinder';
import Loader from '../common/Loader';
import ErrorBanner from '../common/ErrorBanner';

const STATE_BOARDS  = ['Maharashtra','Tamil Nadu','Rajasthan','Kerala','Punjab','West Bengal','Andhra Pradesh','Karnataka','Gujarat','Uttar Pradesh'];
const NATIONAL_EXAMS = ['NEET','JEE Mains','CUET'];
const SUBJECTS = {
  'NEET':      ['Chemistry','Physics','Biology'],
  'JEE Mains': ['Mathematics','Chemistry','Physics'],
  'CUET':      ['Chemistry'],
};

export default function GapUploadForm({ onResult }) {
  const [file, setFile]       = useState(null);
  const [board, setBoard]     = useState('');
  const [exam, setExam]       = useState('');
  const [subject, setSubject] = useState('');
  const [maxMods, setMaxMods] = useState('5');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDrop: files => { if (files.length) { setFile(files[0]); setError(''); } },
    onDropRejected: rej => {
      const code = rej[0]?.errors?.[0]?.code;
      setError(code === 'file-too-large' ? 'File too large — max 10 MB.' : 'Only PDF files are accepted.');
    },
  });

  const handleSubmit = async () => {
    if (!file || !board || !exam || !subject) {
      setError('Please fill all fields and upload your syllabus PDF.');
      return;
    }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('syllabus', file);
      fd.append('board',    board);
      fd.append('exam',     exam);
      fd.append('subject',  subject);
      fd.append('max_module_generation', maxMods);
      const result = await analyseGap(fd);
      onResult(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally { setLoading(false); }
  };

  if (loading) return (
    <Loader message="Analysing your syllabus against national exam topics… comparing with 3-signal semantic alignment. This takes ~30 seconds." />
  );

  const dropStyle = {
    border: `2px dashed ${isDragActive ? '#FFB5C8' : file ? '#B8FFE8' : 'rgba(255,212,184,0.22)'}`,
    borderRadius: 16,
    padding: '38px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    background: isDragActive ? 'rgba(255,181,200,0.06)' : file ? 'rgba(184,255,232,0.04)' : 'rgba(255,248,240,0.02)',
    transition: 'all 0.22s ease',
    marginBottom: 24,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Drop zone */}
      <div {...getRootProps()} style={dropStyle}>
        <input {...getInputProps()} />
        <div style={{
          fontSize: 28, marginBottom: 10,
          filter: `drop-shadow(0 0 10px ${file ? '#B8FFE8' : '#FFD4B8'}60)`,
        }}>
          {file ? '✦' : '◈'}
        </div>
        {file ? (
          <>
            <p style={{ fontSize: 13.5, fontWeight: 500, color: '#B8FFE8', marginBottom: 4 }}>{file.name}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,248,240,0.30)' }}>Click to change file</p>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: 'rgba(255,248,240,0.58)', marginBottom: 5 }}>
              Drop your <strong style={{ color: '#FFD4B8' }}>syllabus PDF</strong> here
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,248,240,0.28)' }}>or click to browse · PDF only · max 10 MB</p>
          </>
        )}
      </div>

      {/* Selects grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
        <SelectField
          label="State board" value={board} onChange={setBoard}
          options={STATE_BOARDS} placeholder="Select board…"
        />
        <SelectField
          label="Target exam" value={exam}
          onChange={v => { setExam(v); setSubject(''); }}
          options={NATIONAL_EXAMS} placeholder="Select exam…"
        />
        <SelectField
          label="Subject" value={subject} onChange={setSubject}
          options={SUBJECTS[exam] || []} placeholder={exam ? 'Select subject…' : 'Choose exam first'}
          disabled={!exam}
        />
        <SelectField
          label="Study modules" value={maxMods} onChange={setMaxMods}
          options={['1','2','3','4','5','6','7','8','9','10']}
          placeholder="Max modules…"
        />
      </div>

      <ErrorBanner message={error} />

      <button
        className="btn btn-primary btn-lg"
        onClick={handleSubmit}
        style={{ alignSelf: 'flex-start' }}
      >
        Find my gaps ↗
      </button>
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder, disabled }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          style={{ opacity: disabled ? 0.38 : 1, paddingRight: 32 }}
        >
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
        <span style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none', color: 'rgba(255,248,240,0.30)', fontSize: 10,
        }}>▾</span>
      </div>
    </div>
  );
}