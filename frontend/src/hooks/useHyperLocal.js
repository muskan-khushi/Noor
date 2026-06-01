import { useState, useCallback } from 'react';
import { generateHyperlocal, batchGenerateHyperlocal } from '../api/hyperlocalGen';

export function useHyperlocal() {
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const generate = useCallback(async (payload) => {
    setLoading(true);
    setError('');
    try {
      const data = await generateHyperlocal(payload);
      setResult(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Generation failed.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateBatch = useCallback(async (payload) => {
    setLoading(true);
    setError('');
    try {
      const data = await batchGenerateHyperlocal(payload);
      setResult(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Batch generation failed.';
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

  return { result, loading, error, generate, generateBatch, reset };
}