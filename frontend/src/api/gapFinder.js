import axios from 'axios';
const BASE = process.env.REACT_APP_API_URL;
export const analyseGap = (formData) => axios.post(`${BASE}/api/gap/analyse`, formData).then(r => r.data);
export const getReports = () => axios.get(`${BASE}/api/gap/reports`).then(r => r.data);
export const getReport  = (id) => axios.get(`${BASE}/api/gap/reports/${id}`).then(r => r.data);
