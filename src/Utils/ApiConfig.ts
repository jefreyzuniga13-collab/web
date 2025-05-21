import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, '') ??
  'http://localhost:7108/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 50_000,
});

export default api;