import React, { useState } from 'react';
import GapUploadForm from '../components/gap/GapUploadForm';
import GapReport from '../components/gap/GapReport';

export default function GapFinderPage() {
  const [result, setResult] = useState(null);

  return (
    <div className="page container" style={{ maxWidth:860 }}>
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontSize:32, fontWeight:800, marginBottom:8 }}>🔍 Textbook Gap Finder</h1>
        <p style={{ color:'#64748b', fontSize:16, lineHeight:1.7 }}>
          Upload your state board syllabus PDF and select your target national exam.
          Noor will find every topic you've never been taught — ranked by priority.
        </p>
      </div>
      <div className="card">
        {result
          ? <GapReport data={result} onReset={() => setResult(null)} />
          : <GapUploadForm onResult={setResult} />
        }
      </div>
    </div>
  );
}
