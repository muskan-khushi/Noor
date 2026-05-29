import React, { useState } from 'react';
import HyperForm from '../components/hyperlocal/HyperForm';
import HyperOutput from '../components/hyperlocal/HyperOutput';

export default function HyperLocalPage() {
  const [result, setResult] = useState(null);

  return (
    <div className="page container" style={{ maxWidth:960 }}>
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontSize:32, fontWeight:800, marginBottom:8 }}>🌍 Hyperlocal Content Generator</h1>
        <p style={{ color:'#64748b', fontSize:16, lineHeight:1.7 }}>
          Paste any textbook problem or explanation. Pick your region.
          Noor rewrites it with your local foods, places, occupations — same concept, your world.
        </p>
      </div>
      <div className="card">
        {result
          ? <HyperOutput data={result} onReset={() => setResult(null)} />
          : <HyperForm onResult={setResult} />
        }
      </div>
    </div>
  );
}
