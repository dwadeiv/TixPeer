'use client';

import { LocationProvider } from '@/contexts/LocationContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { MessagesProvider } from '@/contexts/MessagesContext';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <MessagesProvider>
        <LocationProvider>{children}</LocationProvider>
      </MessagesProvider>
    </AuthProvider>
  );
}
