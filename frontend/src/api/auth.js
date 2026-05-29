import { api } from '../context/AuthContext';
export const register = (data) => api.post('/api/auth/register', data).then(r => r.data);
export const login    = (data) => api.post('/api/auth/login', data).then(r => r.data);
