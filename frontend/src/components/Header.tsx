'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Ticket, Search, Plus, User, MessageSquare, Home, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { LocationSelector } from './LocationSelector';
import { useLocation } from '@/contexts/LocationContext';

export default function Header() {
  const pathname = usePathname();
  const { location, setLocation } = useLocation();
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-xl">
                <Ticket className="size-6 text-white" />
              </div>
              <span className="text-xl">TixPeer</span>
            </Link>

            {/* Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Search events, users, or listings..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Location Button/Display */}
              {location ? (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setLocationDialogOpen(true)}
                >
                  <MapPin className="size-4" />
                  <span className="hidden sm:inline">{location.name}</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setLocationDialogOpen(true)}
                >
                  <MapPin className="size-4" />
                  <span className="hidden sm:inline">Set Location</span>
                </Button>
              )}

              <Link href="/create">
                <Button className="gap-2">
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">New Listing</span>
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" size="icon">
                  <User className="size-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Location Selector Dialog */}
      <LocationSelector
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        currentLocation={location}
        onLocationSelect={setLocation}
      />

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
        <div className="flex items-center justify-around h-16">
          <Link href="/" className="flex-1">
            <button
              className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
                isActive('/') ? 'text-purple-600' : 'text-slate-600'
              }`}
            >
              <Home className="size-5" />
              <span className="text-xs">Home</span>
            </button>
          </Link>
          <Link href="/messages" className="flex-1">
            <button
              className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
                isActive('/messages') ? 'text-purple-600' : 'text-slate-600'
              }`}
            >
              <MessageSquare className="size-5" />
              <span className="text-xs">Messages</span>
            </button>
          </Link>
          <Link href="/create" className="flex-1">
            <button className="flex flex-col items-center justify-center w-full h-full gap-1 text-purple-600">
              <div className="bg-purple-600 rounded-full p-2">
                <Plus className="size-5 text-white" />
              </div>
            </button>
          </Link>
          <Link href="/profile" className="flex-1">
            <button
              className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
                isActive('/profile') ? 'text-purple-600' : 'text-slate-600'
              }`}
            >
              <User className="size-5" />
              <span className="text-xs">Profile</span>
            </button>
          </Link>
        </div>
      </nav>
    </>
  );
}
