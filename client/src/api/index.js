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
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data)
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

// === CEO ===
export const ceoAPI = {
  getRestaurants: () => api.get('/ceo/restaurants'),
  createRestaurant: (data) => api.post('/ceo/restaurants', data),
  updateRestaurant: (id, data) => api.put(`/ceo/restaurants/${id}`, data),
  deleteRestaurant: (id) => api.delete(`/ceo/restaurants/${id}`),
  getBookings: (params) => api.get('/ceo/bookings', { params }),
  getUsers: () => api.get('/ceo/users'),
  assignAdmin: (userId, restaurantId) => api.post('/ceo/assign-admin', { userId, restaurantId }),
  removeAdmin: (userId) => api.post('/ceo/remove-admin', { userId }),
  banUser: (userId, isBanned) => api.post(`/ceo/users/${userId}/ban`, { isBanned }),
  updateTrustScore: (userId, trustScore) => api.post(`/ceo/users/${userId}/trust-score`, { trustScore }),
  updateDepositRules: (restaurantId, data) => api.put(`/ceo/restaurants/${restaurantId}/deposit-rules`, data)
};

export default api;
