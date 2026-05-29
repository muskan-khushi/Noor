import { api } from '../context/AuthContext';
export const generateHyperlocal = (payload) => api.post('/api/hyperlocal/generate', payload).then(r => r.data);
export const getRegions = () => api.get('/api/hyperlocal/regions').then(r => r.data);
export const getHistory = () => api.get('/api/hyperlocal/history').then(r => r.data);
