import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to all requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Don't redirect if on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// === Auth ===
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me')
};

// === Restaurants ===
export const restaurantAPI = {
  list: (params) => api.get('/restaurants', { params }),
  get: (id) => api.get(`/restaurants/${id}`),
  menu: (id) => api.get(`/restaurants/${id}/menu`),
  availability: (id, date, time) => api.get(`/restaurants/${id}/availability`, { params: { date, time } })
};

// === Bookings ===
export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  mine: () => api.get('/bookings/mine'),
  get: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.patch(`/bookings/${id}/cancel`)
};

// === Admin ===
export const adminAPI = {
  updateFloorPlan: (floorPlan) => api.put('/admin/floor-plan', { floorPlan }),
  getBookings: (params) => api.get('/admin/bookings', { params }),
  updateBookingStatus: (id, status) => api.patch(`/admin/bookings/${id}/status`, { status }),
  addMenuItem: (data) => api.post('/admin/menu', data),
  updateMenuItem: (id, data) => api.put(`/admin/menu/${id}`, data),
  deleteMenuItem: (id) => api.delete(`/admin/menu/${id}`)
};

export default api;
