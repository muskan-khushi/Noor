import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * POST /api/hyperlocal/generate
 */
export async function generateHyperlocal(payload) {
  const { data } = await axios.post(`${BASE}/api/hyperlocal/generate`, payload, {
    timeout: 60_000,
  });
  return data;
}

/**
 * POST /api/hyperlocal/generate/batch
 * payload.region_keys — array of up to 6 region keys
 */
export async function batchGenerateHyperlocal(payload) {
  const { data } = await axios.post(`${BASE}/api/hyperlocal/generate/batch`, payload, {
    timeout: 120_000,
  });
  return data;
}

/**
 * GET /api/hyperlocal/regions
 */
export async function getRegions() {
  const { data } = await axios.get(`${BASE}/api/hyperlocal/regions`);
  return data.regions || [];
}

/**
 * GET /api/hyperlocal/history
 */
export async function getHistory() {
  const { data } = await axios.get(`${BASE}/api/hyperlocal/history`);
  return data?.history || [];
}