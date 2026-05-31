import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * POST /api/gap/analyse
 * @param {FormData} formData — includes syllabus PDF + board/exam/subject fields
 */
export async function analyseGap(formData) {
  const { data } = await axios.post(`${BASE}/api/gap/analyse`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120_000,  // 2 min — AI pipeline can be slow cold
  });
  return data;
}

/**
 * GET /api/gap/reports?page=1&limit=10
 */
export async function getReports({ page = 1, limit = 10 } = {}) {
  const { data } = await axios.get(`${BASE}/api/gap/reports`, {
    params: { page, limit },
  });
  return data;
}

/**
 * GET /api/gap/reports/:id
 */
export async function getReport(id) {
  const { data } = await axios.get(`${BASE}/api/gap/reports/${id}`);
  return data;
}

/**
 * DELETE /api/gap/reports/:id
 */
export async function deleteReport(id) {
  const { data } = await axios.delete(`${BASE}/api/gap/reports/${id}`);
  return data;
}