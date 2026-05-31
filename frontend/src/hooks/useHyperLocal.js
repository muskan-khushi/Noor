import { useState, useCallback } from 'react';
import { analyseGap } from '../api/gapFinder';

export function useGapAnalysis() {
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const analyse = useCallback(async (formData) => {
    setLoading(true);
    setError('');
    try {
      const data = await analyseGap(formData);
      setResult(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Analysis failed.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError('');
  }, []);

  return { result, loading, error, analyse, reset };
}