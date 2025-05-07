// src/services/apiConfig.ts
import axios, { type AxiosInstance } from 'axios'

// Base URL limpia (quita cualquier ‘/’ al final)
const BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, '') ||
  'http://localhost:7108/api/v1'

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10_000,
})

export default api