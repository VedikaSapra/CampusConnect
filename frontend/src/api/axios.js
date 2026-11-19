import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem('cc_tokens');
    if (tokens) {
      try {
        const { access } = JSON.parse(tokens);
        if (access) {
          config.headers.Authorization = `Bearer ${access}`;
        }
      } catch (err) {
        console.error('Error parsing tokens from storage', err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const tokens = localStorage.getItem('cc_tokens');
      if (tokens) {
        try {
          const { refresh } = JSON.parse(tokens);
          if (refresh) {
            const res = await axios.post(
              `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'}/auth/token/refresh/`,
              { refresh }
            );
            const newAccess = res.data.access;
            const updatedTokens = { refresh, access: newAccess };
            localStorage.setItem('cc_tokens', JSON.stringify(updatedTokens));
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          localStorage.removeItem('cc_tokens');
          localStorage.removeItem('cc_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
