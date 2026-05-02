import { createContext, useContext, useState } from 'react';
import { authAPI } from '../api/index.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const refreshUser = async () => {
    try {
      const res = await authAPI.me();
      const userData = res.data;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  };

  // Step 1 — send OTP to phone
  const sendOtp = async (phone) => {
    const res = await authAPI.sendOtp(phone);
    return res.data; // { sent: true, expiresIn: 300 }
  };

  // Step 2 — verify OTP, auto-create account if new user
  const verifyOtp = async (phone, code, name) => {
    const res = await authAPI.verifyOtp(phone, code, name);
    const { token, user: userData } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  // CEO passphrase login
  const ceoLogin = async (passphrase) => {
    const res = await authAPI.ceoLogin(passphrase);
    const { token, user: userData } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isCEO          = user?.role === 'ceo';
  const isAdmin        = user?.role === 'admin' || isCEO;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      sendOtp,
      verifyOtp,
      ceoLogin,
      logout,
      refreshUser,
      isCEO,
      isAdmin,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
