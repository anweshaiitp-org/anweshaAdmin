'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { setAuthCookie, getAuthCookie, removeAuthCookie } from '@/auth';

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API URL configurable via environment variable or fallback to same origin
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Set Authorization header for all axios requests
  const setAxiosHeader = (tokenStr: string | null) => {
    if (tokenStr) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokenStr}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Helper to perform logout state cleanup
  const handleLogout = (sessionExpired = false) => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    setAxiosHeader(null);
    removeAuthCookie();

    if (sessionExpired) {
      toast.error('Session expired. Please log in again.');
    } else {
      toast.success('Successfully logged out!');
    }
    
    router.push('/login');
  };

  // Initialize auth state from local storage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        let storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');

        if (!storedToken) {
          const cookieToken = await getAuthCookie();
          if (cookieToken) {
            storedToken = cookieToken;
            localStorage.setItem('auth_token', cookieToken);
          }
        }

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setAxiosHeader(storedToken);

          // Verify token with backend
          try {
            const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
              headers: { Authorization: `Bearer ${storedToken}` }
            });
            if (response.data?.user) {
              setUser(response.data.user);
              localStorage.setItem('auth_user', JSON.stringify(response.data.user));
            }
          } catch (err) {
            console.error('Failed to verify token on boot:', err);
            // If verification fails with 401, clean up session
            if (axios.isAxiosError(err) && err.response?.status === 401) {
              handleLogout(true);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Configure response interceptor to catch any global 401 Unauthorized API responses
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          handleLogout(true);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const toastId = toast.loading('Logging in...');
    try {
      const response = await axios.post(`${BACKEND_URL}/auth/admin/login`, {
        email_id: email,
        password,
      });

      const responseData = response.data?.data || response.data;
      const receivedToken = responseData?.token || responseData?.access_token || responseData?.jwt || (typeof responseData === 'string' ? responseData : null);
      const receivedUser = responseData?.user || responseData?.admin || { id: 'admin', email, role: 'admin' };

      if (!receivedToken) {
        throw new Error('Invalid response from server. Missing token.');
      }

      localStorage.setItem('auth_token', receivedToken);
      localStorage.setItem('auth_user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);
      setAxiosHeader(receivedToken);
      await setAuthCookie(receivedToken);

      toast.success('Successfully logged in!', { id: toastId });
      router.push('/');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please check your credentials.';
      toast.error(errorMessage, { id: toastId });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    handleLogout(false);
  };

  const updateUser = (updatedFields: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updatedFields };
      setUser(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
