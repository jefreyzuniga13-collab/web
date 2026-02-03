import axios from 'axios';

// Normalizar URLs eliminando barras sobrantes
const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
const BASE_URLPCG = import.meta.env.VITE_API_URLPCG?.replace(/\/+$/, '');

// API CRM
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
  },
  timeout: 9000000,
});

// API PCG
const apiPCG = axios.create({
  baseURL: BASE_URLPCG,
  headers: {
    Accept: 'application/json',
  },
  timeout: 120000,
});

export default api;
export { apiPCG };