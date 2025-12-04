/**
 * AuthContext Tests
 *
 * Tests the authentication context provider and hook including:
 * - Initial loading state and auth initialization
 * - Login functionality
 * - Register functionality
 * - Logout functionality
 * - User state updates
 * - Token persistence in localStorage
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

// Mock the api module
jest.mock('@/lib/api', () => ({
  api: {
    login: jest.fn(),
    register: jest.fn(),
    getProfile: jest.fn(),
    setToken: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

// Test component that uses the auth context
function TestComponent() {
  const { user, isAuthenticated, isLoading, login, register, logout, updateUser } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'no-user'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => register('new@example.com', 'password', 'New User')}>Register</button>
      <button onClick={logout}>Logout</button>
      <button onClick={() => updateUser({ name: 'Updated Name' })}>Update User</button>
    </div>
  );
}

// Wrapper for rendering with provider
function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage mocks
    (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
    (window.localStorage.setItem as jest.Mock).mockClear();
    (window.localStorage.removeItem as jest.Mock).mockClear();
  });

  describe('Initial State', () => {
    it('should transition from loading to loaded', async () => {
      renderWithProvider();

      // The component will eventually finish loading
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });
    });

    it('should finish loading when no token exists', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });

    it('should restore auth state from localStorage', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
      (window.localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'authToken') return 'stored-token';
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });
      mockApi.getProfile.mockResolvedValue(mockUser);

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(mockApi.setToken).toHaveBeenCalledWith('stored-token');
      expect(mockApi.getProfile).toHaveBeenCalled();
    });

    it('should fall back to stored user if profile fetch fails', async () => {
      const storedUser = { id: 'user-1', email: 'test@example.com', name: 'Stored User' };
      (window.localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'authToken') return 'stored-token';
        if (key === 'user') return JSON.stringify(storedUser);
        return null;
      });
      mockApi.getProfile.mockRejectedValue(new Error('Token expired'));

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });
      expect(screen.getByTestId('user')).toHaveTextContent('Stored User');
    });
  });

  describe('Login', () => {
    it('should login user successfully', async () => {
      const user = userEvent.setup();
      const mockLoginResponse = {
        access_token: 'new-token',
        user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
      };
      mockApi.login.mockResolvedValue(mockLoginResponse);

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      await user.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      expect(mockApi.login).toHaveBeenCalledWith('test@example.com', 'password');
      expect(mockApi.setToken).toHaveBeenCalledWith('new-token');
      expect(window.localStorage.setItem).toHaveBeenCalledWith('authToken', 'new-token');
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(mockLoginResponse.user)
      );
    });

    it('should remain unauthenticated on login failure', async () => {
      const user = userEvent.setup();
      mockApi.login.mockRejectedValue({
        response: { data: { message: 'Invalid credentials' } },
      });

      // Create a component that catches the login error
      function TestComponentWithErrorHandling() {
        const { isAuthenticated, isLoading, login } = useAuth();

        const handleLogin = async () => {
          try {
            await login('test@example.com', 'password');
          } catch {
            // Error is expected - component handles it
          }
        };

        return (
          <div>
            <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
            <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
            <button onClick={handleLogin}>Login</button>
          </div>
        );
      }

      render(
        <AuthProvider>
          <TestComponentWithErrorHandling />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      await user.click(screen.getByText('Login'));

      // User should remain unauthenticated
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      });
    });
  });

  describe('Register', () => {
    it('should register user successfully', async () => {
      const user = userEvent.setup();
      mockApi.register.mockResolvedValue({ message: 'Registration successful' });

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      await user.click(screen.getByText('Register'));

      expect(mockApi.register).toHaveBeenCalledWith('new@example.com', 'password', 'New User');
      // Note: Registration doesn't auto-login - user must verify email
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    });
  });

  describe('Logout', () => {
    it('should logout user and clear state', async () => {
      const user = userEvent.setup();
      const mockLoginResponse = {
        access_token: 'token',
        user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
      };
      mockApi.login.mockResolvedValue(mockLoginResponse);

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      // Login first
      await user.click(screen.getByText('Login'));
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      // Then logout
      await user.click(screen.getByText('Logout'));

      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockApi.setToken).toHaveBeenCalledWith(null);
    });
  });

  describe('Update User', () => {
    it('should update user data in state and localStorage', async () => {
      const user = userEvent.setup();
      const mockLoginResponse = {
        access_token: 'token',
        user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
      };
      mockApi.login.mockResolvedValue(mockLoginResponse);

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      // Login first
      await user.click(screen.getByText('Login'));
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      // Clear mock to only capture updateUser calls
      (window.localStorage.setItem as jest.Mock).mockClear();

      // Update user
      await user.click(screen.getByText('Update User'));

      expect(screen.getByTestId('user')).toHaveTextContent('Updated Name');
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'user',
        expect.stringContaining('Updated Name')
      );
    });

    it('should not update if user is not logged in', async () => {
      const user = userEvent.setup();

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      // Try to update without being logged in
      await user.click(screen.getByText('Update User'));

      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });
  });

  describe('useAuth Hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
