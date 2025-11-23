'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Ticket, Search, Plus, User, MessageSquare, Home, MapPin, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { LocationSelector } from './LocationSelector';
import { useLocation } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card } from './ui/card';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { location, setLocation } = useLocation();
  const { isAuthenticated } = useAuth();
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [events, setEvents] = useState<any[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch events when component mounts
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsData = await api.getEvents();
        setEvents(eventsData);
      } catch (error) {
        console.error('Error fetching events for search:', error);
      }
    };

    fetchEvents();
  }, []);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // If a suggestion is selected, navigate to it
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      handleSuggestionClick(suggestions[selectedIndex].id);
      return;
    }

    // Otherwise, perform regular search
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  // Filter events based on search query
  const getSuggestions = () => {
    if (!searchQuery.trim()) return [];

    const filtered = events.filter(event =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Limit to 5 suggestions
    return filtered.slice(0, 5);
  };

  const suggestions = getSuggestions();

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchQuery]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (eventId: string) => {
    setShowSuggestions(false);
    setSearchQuery('');
    setSelectedIndex(-1);
    router.push(`/events/${eventId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
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
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-slate-400 z-10" />
                <Input
                  type="search"
                  placeholder="Search events"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                  onKeyDown={handleKeyDown}
                />

                {/* Search Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <Card className="absolute top-full mt-2 w-full shadow-lg border border-slate-200 z-50 max-h-96 overflow-y-auto">
                    {suggestions.map((event, index) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => handleSuggestionClick(event.id)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full p-3 transition-colors text-left border-b border-slate-100 last:border-b-0 ${
                          selectedIndex === index
                            ? 'bg-purple-50 border-l-2 border-l-purple-600'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-slate-900 truncate">
                              {event.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                              <Calendar className="size-3" />
                              <span>
                                {new Date(event.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                              <MapPin className="size-3" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </Card>
                )}
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Location Button/Display */}
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setLocationDialogOpen(true)}
              >
                <MapPin className="size-4" />
                <span className="hidden sm:inline">{location ? location.name : 'Any Location'}</span>
              </Button>

              <Link href="/create">
                <Button className="gap-2">
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">New Listing</span>
                </Button>
              </Link>
              {/* Profile button - redirects to login if not authenticated */}
              <Link href={isAuthenticated ? "/profile" : "/login"}>
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
          {/* Profile button - redirects to login if not authenticated */}
          <Link href={isAuthenticated ? "/profile" : "/login"} className="flex-1">
            <button
              className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
                isActive('/profile') || isActive('/login') ? 'text-purple-600' : 'text-slate-600'
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
