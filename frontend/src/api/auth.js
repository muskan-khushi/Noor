import axios from 'axios';
const BASE = process.env.REACT_APP_API_URL;
export const register = (data) => axios.post(`${BASE}/api/auth/register`, data).then(r => r.data);
export const login    = (data) => axios.post(`${BASE}/api/auth/login`, data).then(r => r.data);
