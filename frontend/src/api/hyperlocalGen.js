import axios from 'axios';
const BASE = process.env.REACT_APP_API_URL;
export const generateHyperlocal = (payload) => axios.post(`${BASE}/api/hyperlocal/generate`, payload).then(r => r.data);
export const getRegions = () => axios.get(`${BASE}/api/hyperlocal/regions`).then(r => r.data);
export const getHistory = () => axios.get(`${BASE}/api/hyperlocal/history`).then(r => r.data);
