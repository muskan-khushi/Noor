const axios = require('axios');

const AI_URL = () => process.env.AI_ENGINE_URL || 'http://localhost:8000';

// Default timeouts (ms)
const TIMEOUTS = {
  gap:       130_000,   // ~2 min for full gap analysis cold start
  hyperlocal: 55_000,
  regions:    10_000,
};

/**
 * Make a request to the AI engine and translate errors into structured
 * Error objects with `isAiServiceError: true` so the error middleware
 * can return a clean JSON response.
 */
async function aiRequest(method, path, data, headers = {}, timeout = 30_000) {
  const url = `${AI_URL()}${path}`;
  try {
    const response = await axios({
      method, url, data, headers,
      timeout,
      maxContentLength: 50 * 1024 * 1024,
    });
    return response.data;
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      const e = new Error('AI engine is not reachable. Please start the Python service (uvicorn main:app --port 8000).');
      e.isAiServiceError = true; e.aiStatus = 503;
      throw e;
    }
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      const e = new Error('AI engine timed out. The request took too long — please try again.');
      e.isAiServiceError = true; e.aiStatus = 504;
      throw e;
    }
    if (err.response) {
      const detail = err.response.data?.detail || err.response.data?.message || 'AI engine error.';
      const e = new Error(detail);
      e.isAiServiceError = true;
      e.aiStatus  = err.response.status;
      e.aiMessage = detail;
      throw e;
    }
    throw err;
  }
}

/** Forward gap analysis PDF + metadata to the AI engine */
async function analyseGap(formData, formHeaders) {
  return aiRequest('POST', '/gap/analyse', formData, formHeaders, TIMEOUTS.gap);
}

/** Generate a single hyperlocal rewrite */
async function generateHyperlocal(payload) {
  return aiRequest('POST', '/hyperlocal/generate', payload, {}, TIMEOUTS.hyperlocal);
}

/** Batch hyperlocal generation for multiple regions */
async function generateHyperlocalBatch(payload) {
  return aiRequest('POST', '/hyperlocal/generate/batch', payload, {}, TIMEOUTS.gap);
}

/** Fetch available region list from AI engine */
async function listRegions() {
  return aiRequest('GET', '/hyperlocal/regions', null, {}, TIMEOUTS.regions);
}

/** Health check */
async function ping() {
  return aiRequest('GET', '/health', null, {}, 5_000);
}

module.exports = { analyseGap, generateHyperlocal, generateHyperlocalBatch, listRegions, ping };