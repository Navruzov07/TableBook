import axios from 'axios';
import { useStore } from '../store';
import { Alert } from 'react-native';

const api = axios.create({
  baseURL: 'https://table-b00k-26r1.onrender.com/api',
});

api.interceptors.request.use((config) => {
  const token = useStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.message || error.message || "An error occurred";
    Alert.alert("Error", msg);
    return Promise.reject(error);
  }
);

export const sendOTP = (phone) => api.post('/auth/send-otp', { phone });
export const verifyOTP = (phone, otp) => api.post('/auth/verify-otp', { phone, otp });

export const getRestaurants = () => api.get('/restaurants');
export const getRestaurantById = (id) => api.get(`/restaurants/${id}`);

export const createBooking = (data) => api.post('/bookings', data);
export const getMyBookings = () => api.get('/bookings/my');
export const cancelBooking = (id) => api.delete(`/bookings/${id}`);

export default api;
