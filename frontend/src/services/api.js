import axios from 'axios';

// Configuração da URL base baseada no ambiente
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://rpg-online-backend.vercel.app'  // ⚠️ IMPORTANTE: Substitua pela sua URL do backend após deploy
  : 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de admin automaticamente
api.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('adminToken');
  if (adminToken && config.url.includes('/admin/')) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  }
  return config;
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
