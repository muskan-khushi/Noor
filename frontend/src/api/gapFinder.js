import { api } from '../context/AuthContext';
export const analyseGap = (formData) => api.post('/api/gap/analyse', formData).then(r => r.data);
export const getReports = () => api.get('/api/gap/reports').then(r => r.data);
export const getReport  = (id) => api.get(`/api/gap/reports/${id}`).then(r => r.data);
