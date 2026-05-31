import React, { useState } from 'react';
import HyperForm from '../components/hyperlocal/HyperForm';
import HyperOutput from '../components/hyperlocal/HyperOutput';

export default function HyperLocalPage() {
  const [result, setResult] = useState(null);

  return (
    <div className="page container" style={{ maxWidth: 960 }}>
      <div className="fade-up" style={{ marginBottom: 36 }}>
        <div style={{
          fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'rgba(212,184,255,0.45)', marginBottom: 9, fontWeight: 600,
        }}>Module 02</div>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(26px,4.5vw,42px)', fontWeight: 400,
          color: 'rgba(255,248,240,0.92)', marginBottom: 9,
        }}>Hyperlocal Content Generator</h1>
        <p style={{
          color: 'rgba(255,248,240,0.44)', fontSize: 15,
          lineHeight: 1.78, maxWidth: 580, fontWeight: 300,
        }}>
          Paste any textbook problem or explanation. Pick your region.
          Noor rewrites it with your local foods, places, occupations —
          the exact same mathematics, your exact world.
        </p>
      </div>

      <div className="fade-up-1 glass" style={{ borderRadius: 24, padding: '34px' }}>
        {result
          ? <HyperOutput data={result} onReset={() => setResult(null)} />
          : <HyperForm onResult={setResult} />
        }
      </div>
    </div>
  );
}