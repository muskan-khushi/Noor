const axios = require('axios');
const AI_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

async function analyseGap(formData, headers) {
  try {
    const res = await axios.post(`${AI_URL}/gap/analyse`, formData, { headers, timeout: 120000 });
    return res.data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || 'AI service unavailable';
    const error = new Error(message);
    error.status = err.response?.status || 503;
    throw error;
  }
}

async function generateHyperlocal(payload) {
  try {
    const res = await axios.post(`${AI_URL}/hyperlocal/generate`, payload, { timeout: 60000 });
    return res.data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || 'AI service unavailable';
    const error = new Error(message);
    error.status = err.response?.status || 503;
    throw error;
  }
}

async function batchGenerateHyperlocal(payload) {
  try {
    const res = await axios.post(`${AI_URL}/hyperlocal/batch-generate`, payload, { timeout: 120000 });
    return res.data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || 'AI service unavailable';
    const error = new Error(message);
    error.status = err.response?.status || 503;
    throw error;
  }
}

async function listRegions() {
  try {
    const res = await axios.get(`${AI_URL}/hyperlocal/regions`, { timeout: 10000 });
    return res.data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || 'AI service unavailable';
    const error = new Error(message);
    error.status = err.response?.status || 503;
    throw error;
  }
}

module.exports = { analyseGap, generateHyperlocal, batchGenerateHyperlocal, listRegions };
