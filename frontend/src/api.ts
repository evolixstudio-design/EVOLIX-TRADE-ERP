import axios from 'axios';
import { useAuthStore } from './store/authStore';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const state = useAuthStore.getState() as any;
  if (state.session_id) {
    config.headers['Authorization'] = `Bearer ${state.session_id}`;
  }
  if (state.activeCompanyId) {
    config.headers['X-Company-Id'] = state.activeCompanyId;
  }
  if (state.activeBranchId) {
    config.headers['X-Branch-Id'] = state.activeBranchId;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // If it's 401, token might be invalid or expired.
      if (error.response.status === 401 && window.location.pathname !== '/login') {
         useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
