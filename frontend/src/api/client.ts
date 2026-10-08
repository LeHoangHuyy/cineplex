import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cineplex_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function upgradeHttpUrls(data: any): any {
  if (typeof data === 'string') {
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && data.startsWith('http://' + window.location.host)) {
      return data.replace(/^http:/, 'https:');
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(upgradeHttpUrls);
  }
  if (data !== null && typeof data === 'object') {
    const upgraded: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      upgraded[key] = upgradeHttpUrls(data[key]);
    }
    return upgraded;
  }
  return data;
}

api.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = upgradeHttpUrls(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Auto logout if expired
      const isAuthEndpoint = error.config.url?.includes('/auth/login') || error.config.url?.includes('/auth/register');
      if (!isAuthEndpoint) {
        localStorage.removeItem('cineplex_token');
        localStorage.removeItem('cineplex_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
