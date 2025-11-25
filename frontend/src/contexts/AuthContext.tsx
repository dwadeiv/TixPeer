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
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Initialize auth state on mount
   * Checks localStorage for existing token and fetches fresh user data from API
   * This ensures we always have the latest user info (including avatar)
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');

        if (token) {
          // Set token for API requests
          api.setToken(token);

          // Fetch fresh user data from API to get latest avatar and other fields
          try {
            const freshUser = await api.getProfile();
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          } catch (error) {
            // If API call fails (e.g., token expired), fall back to stored user
            console.error('Error fetching fresh user data:', error);
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              setUser(JSON.parse(storedUser));
            } else {
              // Token is invalid and no stored user, clear auth
              localStorage.removeItem('authToken');
              api.setToken(null);
            }
          }
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
   * Does NOT auto-login - user must verify email first
   */
  const register = async (email: string, password: string, name: string) => {
    try {
      await api.register(email, password, name);
      // No auto-login - user must verify email before logging in
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

  /**
   * Update user data in state and localStorage
   * Used when user profile is updated (e.g., avatar upload)
   */
  const updateUser = (userData: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
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
