import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Polyfill for atob in React Native
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const atob = (input) => {
  let str = input.replace(/=+$/, '');
  let output = '';
  for (let bc = 0, bs, buffer, idx = 0; buffer = str.charAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
    buffer = chars.indexOf(buffer);
  }
  return output;
};

export const useStore = create((set) => ({
  token: null,
  user: null,
  language: 'EN',
  setAuth: (token, user) => set({ token, user }),
  logout: async () => {
    await AsyncStorage.removeItem('jwt');
    set({ token: null, user: null });
  },
  setLanguage: async (lang) => {
    await AsyncStorage.setItem('language', lang);
    set({ language: lang });
  },
  loadSettings: async () => {
    try {
      const token = await AsyncStorage.getItem('jwt');
      const lang = await AsyncStorage.getItem('language');
      let user = null;
      if (token) {
        try {
          const payload = token.split('.')[1];
          const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
          const decoded = JSON.parse(decodeURIComponent(escape(atob(base64))));
          user = decoded;
        } catch (e) {
          console.error("Failed to decode token", e);
        }
      }
      set({ token, user, language: lang || 'EN' });
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  }
}));
