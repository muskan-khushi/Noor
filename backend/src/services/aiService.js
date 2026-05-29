const axios = require('axios');
const AI_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

async function analyseGap(formData, headers) {
  const res = await axios.post(`${AI_URL}/gap/analyse`, formData, { headers, timeout: 120000 });
  return res.data;
}

async function generateHyperlocal(payload) {
  const res = await axios.post(`${AI_URL}/hyperlocal/generate`, payload, { timeout: 60000 });
  return res.data;
}

async function listRegions() {
  const res = await axios.get(`${AI_URL}/hyperlocal/regions`);
  return res.data;
}

module.exports = { analyseGap, generateHyperlocal, listRegions };
