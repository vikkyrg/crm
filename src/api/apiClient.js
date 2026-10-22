import axios from 'axios';

// Support custom API URL for cloud deployment (e.g. Render, Railway, Vercel)
const rawBaseURL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim();
export const API_BASE_URL = rawBaseURL.replace(/\/+$/, ''); // without trailing slash

// Helper to construct full URL for document downloads / CSV exports (works both locally and in deployment)
export const getDownloadUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
  const token = localStorage.getItem('innomatrics_token');
  if (token && !base.includes('token=')) {
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}token=${encodeURIComponent(token)}`;
  }
  return base;
};

const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('innomatrics_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthenticated 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('innomatrics_token');
      localStorage.removeItem('innomatrics_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
