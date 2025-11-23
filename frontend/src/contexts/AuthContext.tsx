/**
 * AuthContext
 * Provides authentication state and functions throughout the app
 *
 * Features:
 * - Persists authentication state using localStorage
 * - Automatic token injection into API requests
 * - Login/logout functionality
 * - User profile data management
 */
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Initialize auth state on mount
   * Checks localStorage for existing token and validates it
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
          // Set token for API requests
          api.setToken(token);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear invalid data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login user with email and password
   * Stores auth token and user data in localStorage
   * Sets up API client with token for authenticated requests
   */
  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);

      // Store token and user data
      localStorage.setItem('authToken', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Set token for API client
      api.setToken(response.access_token);

      // Update state
      setUser(response.user);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  /**
   * Register new user account
   * Automatically logs in after successful registration
   */
  const register = async (email: string, password: string, name: string) => {
    try {
      await api.register(email, password, name);
      // Auto-login after registration
      await login(email, password);
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  /**
   * Logout current user
   * Clears all auth data from localStorage and state
   */
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    api.setToken(null);
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 * Must be used within AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
