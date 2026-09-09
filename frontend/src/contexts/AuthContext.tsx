import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string; phone?: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { fullName: string; phone?: string; currentPassword?: string; newPassword?: string }) => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  authModalMode: 'login' | 'register';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cineplex_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cineplex_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          setUser(res.data);
          localStorage.setItem('cineplex_user', JSON.stringify(res.data));
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const userData = res.data;
    setUser(userData);
    setToken(userData.token || '');
    localStorage.setItem('cineplex_token', userData.token || '');
    localStorage.setItem('cineplex_user', JSON.stringify(userData));
    setIsAuthModalOpen(false);
  };

  const register = async (data: { email: string; password: string; fullName: string; phone?: string }) => {
    const res = await authApi.register(data);
    const userData = res.data;
    setUser(userData);
    setToken(userData.token || '');
    localStorage.setItem('cineplex_token', userData.token || '');
    localStorage.setItem('cineplex_user', JSON.stringify(userData));
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cineplex_token');
    localStorage.removeItem('cineplex_user');
  };

  const updateProfile = async (data: { fullName: string; phone?: string; currentPassword?: string; newPassword?: string }) => {
    const res = await authApi.updateProfile(data);
    const updated = res.data;
    setUser(updated);
    if (updated.token) {
      setToken(updated.token);
      localStorage.setItem('cineplex_token', updated.token);
    }
    localStorage.setItem('cineplex_user', JSON.stringify(updated));
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const isAdmin = user?.role === 'ROLE_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        login,
        register,
        logout,
        updateProfile,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authModalMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
