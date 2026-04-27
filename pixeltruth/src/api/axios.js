import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: false, // not using cookies, using Bearer token
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle errors globally — but don't redirect on 401 from /auth/me (that's expected when logged out)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthMe = err.config?.url?.includes('/auth/me');
    if (err.response?.status === 401 && !isAuthMe) {
      localStorage.removeItem('pt_token');
      localStorage.removeItem('pt_user');
      // Only redirect if not already on login/signup
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
