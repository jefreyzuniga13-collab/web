import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
const BASE_URLPCG = import.meta.env.VITE_API_URLPCG?.replace(/\/+$/, '');
// const VITE_API_URLPowerTranz = import.meta.env.VITE_API_URLPowerTranz?.replace(/\/+$/, '');
  
//api con cookies
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

//empresa no mas quemada, esta viene desde la sesión del usuario.
const apiPCG = axios.create({
  baseURL: BASE_URLPCG,
  headers: {
    Accept: 'application/json',
    //incluir en el middlewire o interceptor
  },
  timeout: 120000,
});

export default api;
export { apiPCG, 
};