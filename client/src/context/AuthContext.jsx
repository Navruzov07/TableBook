import { createContext, useContext, useState } from 'react';
import { authAPI } from '../api/index.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const refreshUser = async () => {
    try {
      const res = await authAPI.me();
      localStorage.setItem('user', JSON.stringify(res.data));
      setUser(res.data);
      return res.data;
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    console.log("LOGIN RESPONSE", res.data);
    const { token, user: userData } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    console.log("REGISTER RESPONSE", res.data);
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

  const isCEO = user?.role === 'ceo';
  const isAdmin = user?.role === 'admin' || isCEO; // CEO can do everything admin can
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, isCEO, isAdmin, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
