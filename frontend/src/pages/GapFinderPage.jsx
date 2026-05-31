import React, { useState } from 'react';
import GapUploadForm from '../components/gap/GapUploadForm';
import GapReport from '../components/gap/GapReport';

export default function GapFinderPage() {
  const [result, setResult] = useState(null);

  return (
    <div className="page container" style={{ maxWidth:880 }}>
      <div className="fade-up" style={{ marginBottom:36 }}>
        <div style={{ fontSize:10.5, letterSpacing:'0.16em', textTransform:'uppercase',
          color:'rgba(255,212,184,0.42)', marginBottom:9, fontWeight:600 }}>Module 01</div>
        <h1 style={{
          fontFamily:"'Cormorant Garamond', serif",
          fontSize:'clamp(26px,4.5vw,42px)', fontWeight:400,
          color:'rgba(255,248,240,0.92)', marginBottom:9,
        }}>Textbook Gap Finder</h1>
        <p style={{ color:'rgba(255,248,240,0.44)', fontSize:15, lineHeight:1.78, maxWidth:560, fontWeight:300 }}>
          Upload your state board syllabus PDF and select your target national exam.
          Noor will find every topic you've never been taught — ranked by priority.
        </p>
      </div>

      <div className="fade-up-1 glass" style={{ borderRadius:24, padding:'34px' }}>
        {result
          ? <GapReport data={result} onReset={() => setResult(null)} />
          : <GapUploadForm onResult={setResult} />
        }
      </div>
    </div>
  );
}