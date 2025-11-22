'use client';

import { LocationProvider } from '@/contexts/LocationContext';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return <LocationProvider>{children}</LocationProvider>;
}
