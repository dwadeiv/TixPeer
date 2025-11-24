/**
 * Homepage Component
 * Main landing page for TixPeer marketplace that displays:
 * 1. Trending events with active listing counts
 * 2. Recent marketplace listings (offers and requests)
 *
 * Features:
 * - Search filtering via URL query params (?search=...)
 * - Location-based filtering from LocationContext
 * - Tab-based listing type filtering (all/offer/request)
 * - All data from backend API - NO mock/hardcoded data
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MapPin, MessageSquare, Star, ArrowRight, Search as SearchIcon, CalendarDays, X } from 'lucide-react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { useLocation } from '@/contexts/LocationContext';
import { api } from '@/lib/api';
import { Event, Listing } from '@/types';

export default function Home() {
  // Listing type filter for marketplace feed (all offers, just offers, or just requests)
  const [filter, setFilter] = useState<'all' | 'offer' | 'request'>('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date filtering state - allows users to filter events by time period
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // Location from global context - allows users to filter events by city
  const { location } = useLocation();

  // Search query from URL params - supports deep linking to search results
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  /**
   * Fetch all events and listings on mount
   * Uses Promise.all to make parallel API requests for faster loading
   * Includes timeout protection to prevent indefinite loading states
   * This is critical for good UX - users see all data at once
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Add 5 second timeout to prevent indefinite loading
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout - server may be starting up')), 5000)
        );

        // Parallel fetching - much faster than sequential API calls
        const dataPromise = Promise.all([
          api.getEvents(),
          api.getListings()
        ]);

        // Race between data fetch and timeout
        const [eventsData, listingsData] = await Promise.race([dataPromise, timeoutPromise]) as [any, any];

        setEvents(eventsData);
        setListings(listingsData);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /**
   * Helper function to get date range based on selected filter
   * Supports quick filters (today, week, month) and custom ranges
   */
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateFilter) {
      case 'today':
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        };
      case 'week':
        return {
          start: today,
          end: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        };
      case 'month':
        return {
          start: today,
          end: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
        };
      case 'custom':
        return customDateRange;
      default:
        return { start: null, end: null };
    }
  };

  /**
   * Event Filtering Logic
   * Applied in FOUR stages for better UX:
   * 1. Past events filter - hide events that have already occurred (unless specifically searching for them)
   * 2. Search filter - narrows down by keyword (name/venue/category)
   * 3. Location filter - further narrows by city
   * 4. Date filter - filters by date range
   *
   * This order matters: searching "Taylor Swift" in "Los Angeles" should
   * show all Taylor Swift events in LA, not LA events matching "Taylor Swift"
   *
   * TODO: Future Enhancement - Personalized Recommendation Algorithm
   * Currently sorted by popularity (activeListings count) as a proxy for demand.
   * Plan to implement ML-based personalization that considers:
   * - User's past event views and ticket requests
   * - User's genre/category preferences
   * - Social graph (events friends are attending)
   * - Time-based patterns (weekday vs weekend preferences)
   * - Price sensitivity based on past listing interactions
   * - Geographic preferences (how far user typically travels)
   * This will provide each user a personalized feed of suggested events
   */
  let filteredEvents = events;

  // Stage 1: Hide past events by default (keeps them accessible for future forum feature)
  // Only show past events if user is specifically searching for them
  // Shows events happening today and in the future
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today (midnight)
  if (!searchQuery) {
    // No search query - hide events before today, but include all events happening today or later
    filteredEvents = filteredEvents.filter(event => new Date(event.date) >= today);
  }

  // Stage 2: Filter by search query (case-insensitive match on name, venue, or category)
  if (searchQuery) {
    filteredEvents = filteredEvents.filter(event =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Stage 3: Filter by location (applies to both search results and general browsing)
  if (location) {
    filteredEvents = filteredEvents.filter(event => event.city === location.name);
  }

  // Stage 4: Filter by date range
  const dateRange = getDateRange();
  if (dateRange.start || dateRange.end) {
    filteredEvents = filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      if (dateRange.start && eventDate < dateRange.start) return false;
      if (dateRange.end && eventDate > dateRange.end) return false;
      return true;
    });
  }

  const locationFilteredEvents = filteredEvents;

  /**
   * Listing Filtering
   * Two-stage filtering for listings feed:
   * 1. Location filter - only show listings for events in the selected location
   * 2. Type filter - show all, offers only, or requests only
   *
   * This ensures listings match the events being displayed above
   */
  // Get event IDs that match the current location/search filters
  const filteredEventIds = new Set(locationFilteredEvents.map(event => event.id));

  const filteredListings = listings.filter(listing => {
    // Stage 1: Filter by location - only show listings for visible events
    const matchesLocation = filteredEventIds.has(listing.eventId);

    // Stage 2: Filter by type (all/offer/request)
    const matchesType = filter === 'all' || listing.type === filter;

    return matchesLocation && matchesType;
  });

  /**
   * Retry function to allow users to manually reload data if initial fetch fails
   */
  const retryFetch = () => {
    window.location.reload();
  };

  /**
   * Error State
   * Shown when API requests fail or timeout
   * Provides clear message and retry option
   */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="bg-red-100 p-4 rounded-full">
          <svg className="size-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Unable to Load Data</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={retryFetch} className="gap-2">
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  /**
   * Loading State
   * Shows spinner for seamless loading experience
   * Centered layout maintains visual stability during page load
   */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p className="text-slate-600 text-sm">Loading events and listings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl mb-2">Welcome to TixPeer</h1>
        <p className="text-purple-100 mb-6">
          The social marketplace where fans connect to barter and exchange tickets
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/create?type=offer">
            <Button variant="secondary" className="gap-2">
              Offer Tickets
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link href="/create?type=request">
            <Button variant="outline" className="gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20">
              Request Tickets
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Date Filter Section */}
      <section>
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <CalendarDays className="size-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Filter by Date:</h3>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={dateFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter('all')}
            >
              All Dates
            </Button>
            <Button
              variant={dateFilter === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter('today')}
            >
              Today
            </Button>
            <Button
              variant={dateFilter === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter('week')}
            >
              This Week
            </Button>
            <Button
              variant={dateFilter === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter('month')}
            >
              This Month
            </Button>
            <Button
              variant={dateFilter === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
            >
              <CalendarDays className="size-4 mr-1" />
              Custom Range
            </Button>
          </div>
          {dateFilter !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFilter('all');
                setShowCustomDatePicker(false);
                setCustomDateRange({ start: null, end: null });
              }}
              className="gap-1"
            >
              <X className="size-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Custom Date Range Picker */}
        {showCustomDatePicker && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold mb-3">Select Custom Date Range</h4>
            <div className="flex gap-4 flex-wrap items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm text-slate-600 mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={customDateRange.start ? customDateRange.start.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    setCustomDateRange({ ...customDateRange, start: date });
                  }}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm text-slate-600 mb-1">End Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={customDateRange.end ? customDateRange.end.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    setCustomDateRange({ ...customDateRange, end: date });
                  }}
                />
              </div>
              <Button
                onClick={() => {
                  if (customDateRange.start || customDateRange.end) {
                    setDateFilter('custom');
                  }
                }}
                disabled={!customDateRange.start && !customDateRange.end}
              >
                Apply
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Trending Events Section */}
      <section>
        {/* Dynamic Header - changes based on active filters */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl">
            {/* Show most specific filter first: search + location > search > location > default */}
            {searchQuery && location
              ? `Search Results for "${searchQuery}" in ${location.name}`
              : searchQuery
              ? `Search Results for "${searchQuery}"`
              : location
              ? `Events in ${location.name}`
              : 'Trending Events'}
          </h2>
          {searchQuery && (
            <Link href="/">
              <Button variant="ghost" size="sm">Clear Search</Button>
            </Link>
          )}
        </div>

        {/* Empty State - different messages for search vs location filtering */}
        {locationFilteredEvents.length === 0 ? (
          <Card className="p-12 text-center">
            {searchQuery ? (
              <>
                <SearchIcon className="size-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600 mb-2">
                  No events found for "{searchQuery}"{location ? ` in ${location.name}` : ''}
                </p>
                <p className="text-sm text-slate-500 mb-4">
                  Try searching for an artist name, sports team, or event type
                  {location && ' or change your location'}
                </p>
                <Link href="/">
                  <Button>View All Events</Button>
                </Link>
              </>
            ) : (
              <>
                <MapPin className="size-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600 mb-2">No events found in {location?.name}</p>
                <p className="text-sm text-slate-500 mb-4">
                  Try selecting a different city or check back later for new events
                </p>
              </>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sort events by popularity (activeListings) - higher count = more marketplace activity */}
            {locationFilteredEvents
              .sort((a, b) => b.activeListings - a.activeListings)
              .map(event => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="aspect-video relative">
                  <ImageWithFallback
                    src={event.image}
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Active listings badge - shows marketplace activity for this event */}
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-white/90">
                      {event.activeListings} listings
                    </Badge>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                    {event.category}
                  </Badge>
                  <h3 className="line-clamp-1">{event.name}</h3>
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <Calendar className="size-4" />
                    {new Date(event.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <MapPin className="size-4" />
                    {event.location}
                  </div>
                </div>
              </Card>
            </Link>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Events - Shows next events chronologically */}
      <section>
        <h2 className="text-2xl mb-4">Upcoming Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sort events by date and show upcoming ones */}
          {locationFilteredEvents
            .filter(event => new Date(event.date) >= new Date())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 6)
            .map(event => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex gap-4 p-4">
                    {/* Date badge */}
                    <div className="flex flex-col items-center justify-center bg-purple-100 rounded-lg px-4 py-3 min-w-[80px]">
                      <div className="text-3xl font-bold text-purple-900">
                        {new Date(event.date).getDate()}
                      </div>
                      <div className="text-sm text-purple-700 uppercase">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-xs text-purple-600">
                        {new Date(event.date).getFullYear()}
                      </div>
                    </div>

                    {/* Event details */}
                    <div className="flex-1 min-w-0">
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 mb-2">
                        {event.category}
                      </Badge>
                      <h3 className="font-semibold line-clamp-1 mb-1">{event.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-slate-600 mb-1">
                        <MapPin className="size-3" />
                        <span className="line-clamp-1">{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <MessageSquare className="size-3" />
                        <span>{event.activeListings} active listing{event.activeListings !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Event image thumbnail */}
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <ImageWithFallback
                        src={event.image}
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
        </div>

        {/* Show message if no upcoming events */}
        {locationFilteredEvents.filter(event => new Date(event.date) >= new Date()).length === 0 && (
          <Card className="p-12 text-center">
            <CalendarDays className="size-12 mx-auto mb-4 text-slate-400" />
            <p className="text-slate-600 mb-2">No upcoming events found</p>
            <p className="text-sm text-slate-500">
              {dateFilter !== 'all' ? 'Try adjusting your date filter' : 'Check back later for new events'}
            </p>
          </Card>
        )}
      </section>

      {/* Listings Feed - Shows all active marketplace listings */}
      <section>
        <h2 className="text-2xl mb-4">Marketplace Activity</h2>
        <Tabs value={filter} onValueChange={(v: string) => setFilter(v as 'all' | 'offer' | 'request')}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Listings</TabsTrigger>
            <TabsTrigger value="offer">Offers</TabsTrigger>
            <TabsTrigger value="request">Requests</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="space-y-4">
            {filteredListings.slice(0, 5).map(listing => (
              <Card key={listing.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Event Image - uses denormalized event data stored on listing */}
                  <Link href={`/listings/${listing.id}`} className="md:w-48 flex-shrink-0">
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <ImageWithFallback
                        src={listing.eventImage}
                        alt={listing.eventName}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  </Link>

                  {/* Listing Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {/* Type badge with color coding: green for offers, blue for requests */}
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={listing.type === 'offer' ? 'default' : 'secondary'}
                            className={listing.type === 'offer' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
                          >
                            {listing.type === 'offer' ? 'Offering' : 'Requesting'}
                          </Badge>
                          <span className="text-slate-600">{listing.ticketCount} ticket{listing.ticketCount > 1 ? 's' : ''}</span>
                        </div>
                        <Link href={`/listings/${listing.id}`}>
                          <h3 className="text-xl hover:text-purple-600 transition-colors">
                            {listing.eventName}
                          </h3>
                        </Link>
                        {/* Section info - optional, more common for "offer" listings where user has specific seats */}
                        {listing.sectionInfo && (
                          <p className="text-slate-600">{listing.sectionInfo}</p>
                        )}
                      </div>
                    </div>

                    <p className="text-slate-700">{listing.description}</p>

                    {/* "Looking for" field - helps facilitate trades and barter */}
                    {listing.lookingFor && (
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm text-slate-600">
                          <strong>Looking for:</strong> {listing.lookingFor}
                        </p>
                      </div>
                    )}

                    {/* User Info & Actions - displays trust score and completed trades to build confidence */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <Link href={`/users/${listing.userId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <Avatar>
                          <AvatarImage src={listing.user.avatar} />
                          <AvatarFallback>{listing.user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p>{listing.user.name}</p>
                          {/* Trust system - shows reliability based on completed trades and ratings */}
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Star className="size-3 fill-yellow-400 text-yellow-400" />
                            {listing.user.trustScore} • {listing.user.completedTrades} trades
                          </div>
                        </div>
                      </Link>

                      <Link href={`/listings/${listing.id}`}>
                        <Button className="gap-2">
                          <MessageSquare className="size-4" />
                          Start Chat
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
