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
import { Calendar, MapPin, MessageSquare, Star, ArrowRight, Search as SearchIcon } from 'lucide-react';
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

  // Location from global context - allows users to filter events by city
  const { location } = useLocation();

  // Search query from URL params - supports deep linking to search results
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  /**
   * Fetch all events and listings on mount
   * Uses Promise.all to make parallel API requests for faster loading
   * This is critical for good UX - users see all data at once
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Parallel fetching - much faster than sequential API calls
        const [eventsData, listingsData] = await Promise.all([
          api.getEvents(),
          api.getListings()
        ]);
        setEvents(eventsData);
        setListings(listingsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /**
   * Event Filtering Logic
   * Applied in TWO stages for better UX:
   * 1. Search filter - narrows down by keyword (name/venue/category)
   * 2. Location filter - further narrows by city
   *
   * This order matters: searching "Taylor Swift" in "Los Angeles" should
   * show all Taylor Swift events in LA, not LA events matching "Taylor Swift"
   */
  let filteredEvents = events;

  // Stage 1: Filter by search query (case-insensitive match on name, venue, or category)
  if (searchQuery) {
    filteredEvents = filteredEvents.filter(event =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Stage 2: Filter by location (applies to both search results and general browsing)
  if (location) {
    filteredEvents = filteredEvents.filter(event => event.city === location.name);
  }

  const locationFilteredEvents = filteredEvents;

  /**
   * Listing Type Filtering
   * Simple client-side filter for tabs - shows all, offers only, or requests only
   * Filters already-fetched data rather than making new API calls for better performance
   */
  const filteredListings = listings.filter(
    listing => filter === 'all' || listing.type === filter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-600">Loading...</p>
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
            {locationFilteredEvents.map(event => (
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

      {/* Listings Feed - Shows all active marketplace listings */}
      <section>
        <h2 className="text-2xl mb-4">Recent Listings</h2>
        <Tabs value={filter} onValueChange={(v: string) => setFilter(v as 'all' | 'offer' | 'request')}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Listings</TabsTrigger>
            <TabsTrigger value="offer">Offers</TabsTrigger>
            <TabsTrigger value="request">Requests</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="space-y-4">
            {filteredListings.map(listing => (
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
