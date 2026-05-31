import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function login(credentials) {
  const { data } = await axios.post(`${BASE}/api/auth/login`, credentials);
  return data; // { token, user }
}

export async function register(payload) {
  const { data } = await axios.post(`${BASE}/api/auth/register`, payload);
  return data; // { token, user }
}

export async function getMe() {
  const { data } = await axios.get(`${BASE}/api/auth/me`);
  return data;
}