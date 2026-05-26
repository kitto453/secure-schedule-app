import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The server responded with a status code outside 2xx
      const { status, data } = error.response;

      // If 401 and not on auth routes, redirect to login
      if (status === 401) {
        const isAuthRoute =
          window.location.pathname === '/login' ||
          window.location.pathname === '/register';
        if (!isAuthRoute) {
          window.location.href = '/login';
        }
      }

      // Re-throw with the server's error message
      const message = data?.error || data?.message || 'An error occurred';
      const enhancedError = new Error(message);
      enhancedError.status = status;
      enhancedError.details = data?.details;
      enhancedError.response = error.response;
      return Promise.reject(enhancedError);
    } else if (error.request) {
      // Request was made but no response received
      const networkError = new Error(
        'Unable to connect to the server. Please check your internet connection.'
      );
      networkError.isNetworkError = true;
      return Promise.reject(networkError);
    } else {
      return Promise.reject(error);
    }
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Schedules API
export const schedulesAPI = {
  getAll: (params) => api.get('/schedules', { params }),
  getByDate: (date) => api.get('/schedules', { params: { date } }),
  getByWeek: (weekStart) => api.get('/schedules', { params: { week: weekStart } }),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
};

// Activity API
export const activityAPI = {
  getAll: (params) => api.get('/activity', { params }),
};

export default api;
