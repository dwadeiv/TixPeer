'use client';

import { LocationProvider } from '@/contexts/LocationContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <LocationProvider>{children}</LocationProvider>
    </AuthProvider>
  );
}
