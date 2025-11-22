'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MapPin, MessageSquare, Star, ArrowRight, Search as SearchIcon } from 'lucide-react';
import { mockListings, mockEvents } from '@/utils/mockData';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { useLocation } from '@/contexts/LocationContext';

export default function Home() {
  const [filter, setFilter] = useState<'all' | 'offer' | 'request'>('all');
  const { location } = useLocation();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  // Filter events by search query first
  let filteredEvents = mockEvents;
  if (searchQuery) {
    filteredEvents = mockEvents.filter(event =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Then filter by location if set
  const locationFilteredEvents = location && !searchQuery
    ? filteredEvents.filter(event => event.city === location.name)
    : filteredEvents;

  const filteredListings = mockListings.filter(
    listing => filter === 'all' || listing.type === filter
  );

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

      {/* Trending Events */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl">
            {searchQuery
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
        {locationFilteredEvents.length === 0 ? (
          <Card className="p-12 text-center">
            {searchQuery ? (
              <>
                <SearchIcon className="size-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600 mb-2">No events found for "{searchQuery}"</p>
                <p className="text-sm text-slate-500 mb-4">
                  Try searching for an artist name, sports team, or event type
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

      {/* Listings Feed */}
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
                  {/* Event Image */}
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
                        {listing.sectionInfo && (
                          <p className="text-slate-600">{listing.sectionInfo}</p>
                        )}
                      </div>
                    </div>

                    <p className="text-slate-700">{listing.description}</p>

                    {listing.lookingFor && (
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm text-slate-600">
                          <strong>Looking for:</strong> {listing.lookingFor}
                        </p>
                      </div>
                    )}

                    {/* User Info & Actions */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <Link href={`/users/${listing.userId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <Avatar>
                          <AvatarImage src={listing.user.avatar} />
                          <AvatarFallback>{listing.user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p>{listing.user.name}</p>
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
