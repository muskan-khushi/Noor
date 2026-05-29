import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { analyseGap } from '../../api/gapFinder';
import Loader from '../common/Loader';
import ErrorBanner from '../common/ErrorBanner';

const STATE_BOARDS = ['Maharashtra','Tamil Nadu','Rajasthan','Kerala','Punjab','West Bengal','Andhra Pradesh','Karnataka','Gujarat','Uttar Pradesh'];
const NATIONAL_EXAMS = ['NEET','JEE Mains','CUET'];
const SUBJECTS = { NEET:['Chemistry','Physics','Biology'], 'JEE Mains':['Mathematics','Chemistry','Physics'], CUET:['Chemistry'] };

const cs = {
  form: { display:'flex', flexDirection:'column', gap:20 },
  dropzone: { border:'2px dashed #e2e8f0', borderRadius:12, padding:'40px 24px', textAlign:'center', cursor:'pointer', transition:'all 0.2s', background:'#fafafa' },
  dropzoneActive: { borderColor:'#f97316', background:'#fff7ed' },
  dropzoneDone: { borderColor:'#22c55e', background:'#f0fdf4' },
  icon: { fontSize:32, marginBottom:8 },
  row: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 },
};

export default function GapUploadForm({ onResult }) {
  const [file,setFile]       = useState(null);
  const [board,setBoard]     = useState('');
  const [exam,setExam]       = useState('');
  const [subject,setSubject] = useState('');
  const [loading,setLoading] = useState(false);
  const [error,setError]     = useState('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept:{'application/pdf':['.pdf']}, maxFiles:1,
    maxSize: 10 * 1024 * 1024,
    onDrop: files => { if (files.length) { setFile(files[0]); setError(''); } },
    onDropRejected: (rejections) => {
      const err = rejections[0]?.errors?.[0];
      if (err?.code === 'file-too-large') setError('File is too large. Maximum size is 10MB.');
      else setError(err?.message || 'File rejected. Please upload a valid PDF under 10MB.');
    },
  });

  const handleSubmit = async () => {
    if (!file || !board || !exam || !subject) { setError('Please fill all fields and upload your syllabus PDF.'); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('syllabus', file); fd.append('board', board);
      fd.append('exam', exam);     fd.append('subject', subject);
      const result = await analyseGap(fd);
      onResult(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally { setLoading(false); }
  };

  if (loading) return <Loader message="Analysing your syllabus against national exam topics… this takes ~30 seconds" />;

  const dzStyle = { ...cs.dropzone, ...(isDragActive ? cs.dropzoneActive : {}), ...(file ? cs.dropzoneDone : {}) };
  return (
    <div style={cs.form}>
      <div {...getRootProps()} style={dzStyle}>
        <input {...getInputProps()} />
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
          <span style={cs.icon}>{file ? '✅' : '📄'}</span>
          {file ? <span style={{ fontWeight:600 }}>{file.name}</span>
                : <span>Drop your <strong>state board syllabus PDF</strong> here<br /><small style={{ color:'#64748b' }}>or click to browse — PDF only, max 10MB</small></span>}
        </div>
      </div>

      <div style={cs.row}>
        {[
          { label:'State Board', value:board, set:setBoard, opts:STATE_BOARDS, placeholder:'Select board…' },
          { label:'Target Exam', value:exam, set:(v)=>{ setExam(v); setSubject(''); }, opts:NATIONAL_EXAMS, placeholder:'Select exam…' },
          { label:'Subject', value:subject, set:setSubject, opts:SUBJECTS[exam]||[], placeholder:'Select subject…', disabled:!exam },
        ].map(({ label, value, set, opts, placeholder, disabled }) => (
          <div className="form-group" key={label}>
            <label>{label}</label>
            <select value={value} onChange={e => set(e.target.value)} disabled={disabled}>
              <option value="">{placeholder}</option>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>

      <ErrorBanner message={error} />
      <button className="btn btn-primary btn-lg" onClick={handleSubmit} style={{ alignSelf:'flex-start' }}>
        Find My Gaps →
      </button>
    </div>
  );
}
