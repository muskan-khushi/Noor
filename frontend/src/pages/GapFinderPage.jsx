import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import GapUploadForm from '../components/gap/GapUploadForm';
import GapReport from '../components/gap/GapReport';
import Loader from '../components/common/Loader';
import ErrorBanner from '../components/common/ErrorBanner';
import { getReport } from '../api/gapFinder';
import { normalizeSavedReport } from '../utils/gapReport';

export default function GapFinderPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const reportId = searchParams.get('reportId');

  const [result, setResult] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!reportId) return;
    let cancelled = false;
    setLoadingReport(true);
    setLoadError('');
    getReport(reportId)
      .then(r => {
        if (!cancelled) setResult(normalizeSavedReport(r));
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load this report. It may have been deleted.');
      })
      .finally(() => {
        if (!cancelled) setLoadingReport(false);
      });
    return () => { cancelled = true; };
  }, [reportId]);

  const handleReset = () => {
    setResult(null);
    setLoadError('');
    if (reportId) setSearchParams({});
  };

  if (loadingReport) {
    return (
      <div className="page container" style={{ maxWidth: 880 }}>
        <Loader message="Loading your saved gap report…" />
      </div>
    );
  }

  return (
    <div className="page container" style={{ maxWidth: 880 }}>
      <div className="fade-up" style={{ marginBottom: 36 }}>
        <div style={{
          fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'rgba(255,212,184,0.42)', marginBottom: 9, fontWeight: 600,
        }}>Module 01</div>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(26px,4.5vw,42px)', fontWeight: 400,
          color: 'rgba(255,248,240,0.92)', marginBottom: 9,
        }}>Textbook Gap Finder</h1>
        <p style={{
          color: 'rgba(255,248,240,0.44)', fontSize: 15, lineHeight: 1.78,
          maxWidth: 560, fontWeight: 300,
        }}>
          Upload your state board syllabus PDF and select your target national exam.
          Noor will find every topic you&apos;ve never been taught — ranked by priority.
        </p>
      </div>

      {loadError && <ErrorBanner message={loadError} onDismiss={() => setLoadError('')} />}

      <div className="fade-up-1 glass" style={{ borderRadius: 24, padding: '34px' }}>
        {result
          ? <GapReport data={result} onReset={handleReset} />
          : <GapUploadForm onResult={setResult} />
        }
      </div>
    </div>
  );
}
