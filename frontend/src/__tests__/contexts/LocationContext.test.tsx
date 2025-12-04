/**
 * LocationContext Tests
 *
 * Tests the location context provider and hook including:
 * - Initial state loading from localStorage
 * - Setting and persisting location
 * - Clearing location
 * - Error handling for invalid localStorage data
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationProvider, useLocation } from '@/contexts/LocationContext';

// Test component that uses the location context
function TestComponent() {
  const { location, setLocation } = useLocation();

  return (
    <div>
      <div data-testid="location">
        {location ? `${location.name}, ${location.state}` : 'no-location'}
      </div>
      <button
        onClick={() =>
          setLocation({ name: 'Austin', state: 'TX', label: 'Austin, TX', lat: 30.27, lng: -97.74 })
        }
      >
        Set Austin
      </button>
      <button
        onClick={() =>
          setLocation({ name: 'New York', state: 'NY', label: 'New York, NY', lat: 40.71, lng: -74.01 })
        }
      >
        Set New York
      </button>
      <button onClick={() => setLocation(null)}>Clear Location</button>
    </div>
  );
}

// Wrapper for rendering with provider
function renderWithProvider() {
  return render(
    <LocationProvider>
      <TestComponent />
    </LocationProvider>
  );
}

describe('LocationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
    (window.localStorage.setItem as jest.Mock).mockClear();
    (window.localStorage.removeItem as jest.Mock).mockClear();
  });

  describe('Initial State', () => {
    it('should start with no location when localStorage is empty', () => {
      renderWithProvider();

      expect(screen.getByTestId('location')).toHaveTextContent('no-location');
    });

    it('should load location from localStorage on mount', async () => {
      const savedLocation = { name: 'Austin', state: 'TX', label: 'Austin, TX', lat: 30.27, lng: -97.74 };
      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(savedLocation));

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('location')).toHaveTextContent('Austin, TX');
      });
    });

    it('should handle invalid JSON in localStorage gracefully', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('invalid-json');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('location')).toHaveTextContent('no-location');
      });
      expect(consoleSpy).toHaveBeenCalledWith('Error loading location:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Set Location', () => {
    it('should set location and save to localStorage', async () => {
      const user = userEvent.setup();

      renderWithProvider();

      await user.click(screen.getByText('Set Austin'));

      expect(screen.getByTestId('location')).toHaveTextContent('Austin, TX');
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'userLocation',
        expect.stringContaining('Austin')
      );
    });

    it('should update location when changed', async () => {
      const user = userEvent.setup();

      renderWithProvider();

      await user.click(screen.getByText('Set Austin'));
      expect(screen.getByTestId('location')).toHaveTextContent('Austin, TX');

      await user.click(screen.getByText('Set New York'));
      expect(screen.getByTestId('location')).toHaveTextContent('New York, NY');
    });
  });

  describe('Clear Location', () => {
    it('should clear location and remove from localStorage', async () => {
      const user = userEvent.setup();

      renderWithProvider();

      // Set location first
      await user.click(screen.getByText('Set Austin'));
      expect(screen.getByTestId('location')).toHaveTextContent('Austin, TX');

      // Clear location
      await user.click(screen.getByText('Clear Location'));

      expect(screen.getByTestId('location')).toHaveTextContent('no-location');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('userLocation');
    });
  });

  describe('useLocation Hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useLocation must be used within a LocationProvider');

      consoleSpy.mockRestore();
    });
  });
});
