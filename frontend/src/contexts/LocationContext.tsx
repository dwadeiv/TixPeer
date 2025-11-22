'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { City } from '@/utils/cities';

interface LocationContextType {
  location: City | null;
  setLocation: (city: City | null) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<City | null>(null);

  // Load location from localStorage on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        setLocation(JSON.parse(savedLocation));
      } catch (error) {
        console.error('Error loading location:', error);
      }
    }
  }, []);

  // Save location to localStorage when it changes
  const handleSetLocation = (city: City | null) => {
    setLocation(city);
    if (city) {
      localStorage.setItem('userLocation', JSON.stringify(city));
    } else {
      localStorage.removeItem('userLocation');
    }
  };

  return (
    <LocationContext.Provider value={{ location, setLocation: handleSetLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
