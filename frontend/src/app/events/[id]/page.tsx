'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, MapPin, Users, MessageSquare, Star } from 'lucide-react';
import { mockEvents } from '@/utils/mockData';
import { generateListingsForEvent } from '@/utils/generateListings';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { Listing } from '@/types';

export default function EventDetail() {
  const params = useParams();
  const router = useRouter();
  const event = mockEvents.find(e => e.id === params.id);
  const [eventListings, setEventListings] = useState<Listing[]>([]);

  useEffect(() => {
    if (event) {
      const listings = generateListingsForEvent(event);
      setEventListings(listings);
    }
  }, [event]);

  if (!event) {
    return <div>Event not found</div>;
  }

  const offers = eventListings.filter(l => l.type === 'offer');
  const requests = eventListings.filter(l => l.type === 'request');

  return (
    <div className="pb-20 md:pb-8">
      <Button
        variant="ghost"
        className="gap-2 mb-6"
        onClick={() => router.back()}
      >
        <ArrowLeft className="size-4" />
        Back
      </Button>

      {/* Event Header */}
      <Card className="overflow-hidden mb-6">
        <div className="aspect-[21/9] relative">
          <ImageWithFallback
            src={event.image}
            alt={event.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <Badge className="mb-3 bg-white/20 backdrop-blur">
              {event.category}
            </Badge>
            <h1 className="text-4xl mb-2">{event.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="size-4" />
                {new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-4" />
                {event.venue}, {event.location}
              </div>
              <div className="flex items-center gap-2">
                <Users className="size-4" />
                {event.activeListings} active listings
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Event Community */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="all">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">All ({eventListings.length})</TabsTrigger>
                <TabsTrigger value="offers">Offers ({offers.length})</TabsTrigger>
                <TabsTrigger value="requests">Requests ({requests.length})</TabsTrigger>
              </TabsList>
              <Link href={`/create?event=${params.id}`}>
                <Button>Post Listing</Button>
              </Link>
            </div>

            <TabsContent value="all" className="space-y-4">
              {eventListings.map(listing => (
                <Link key={listing.id} href={`/listings/${listing.id}`} className="block">
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <Badge
                          variant={listing.type === 'offer' ? 'default' : 'secondary'}
                          className={listing.type === 'offer' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
                        >
                          {listing.type === 'offer' ? 'Offering' : 'Requesting'} {listing.ticketCount} ticket{listing.ticketCount > 1 ? 's' : ''}
                        </Badge>
                        {listing.sectionInfo && (
                          <p className="text-slate-600 mt-2">{listing.sectionInfo}</p>
                        )}
                      </div>
                    </div>

                    <p className="text-slate-700 mb-4">{listing.description}</p>

                    {listing.lookingFor && (
                      <div className="bg-slate-50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-slate-600">
                          <strong>Looking for:</strong> {listing.lookingFor}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/users/${listing.userId}`);
                        }}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                      >
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
                      </div>

                      <Button
                        className="gap-2"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <MessageSquare className="size-4" />
                        Chat
                      </Button>
                    </div>
                  </Card>
                </Link>
              ))}
            </TabsContent>

            <TabsContent value="offers" className="space-y-4">
              {offers.map(listing => (
                <Link key={listing.id} href={`/listings/${listing.id}`} className="block">
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <Badge className="bg-green-100 text-green-700">
                          Offering {listing.ticketCount} ticket{listing.ticketCount > 1 ? 's' : ''}
                        </Badge>
                        {listing.sectionInfo && (
                          <p className="text-slate-600 mt-2">{listing.sectionInfo}</p>
                        )}
                      </div>
                    </div>

                    <p className="text-slate-700 mb-4">{listing.description}</p>

                    {listing.lookingFor && (
                      <div className="bg-slate-50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-slate-600">
                          <strong>Looking for:</strong> {listing.lookingFor}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/users/${listing.userId}`);
                        }}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                      >
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
                      </div>

                      <Button
                        className="gap-2"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <MessageSquare className="size-4" />
                        Chat
                      </Button>
                    </div>
                  </Card>
                </Link>
              ))}
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              {requests.map(listing => (
                <Link key={listing.id} href={`/listings/${listing.id}`} className="block">
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <Badge className="bg-blue-100 text-blue-700">
                        Requesting {listing.ticketCount} ticket{listing.ticketCount > 1 ? 's' : ''}
                      </Badge>
                    </div>

                    <p className="text-slate-700 mb-4">{listing.description}</p>

                    {listing.lookingFor && (
                      <div className="bg-slate-50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-slate-600">
                          <strong>Open to trading:</strong> {listing.lookingFor}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/users/${listing.userId}`);
                        }}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                      >
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
                      </div>

                      <Button
                        className="gap-2"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <MessageSquare className="size-4" />
                        Chat
                      </Button>
                    </div>
                  </Card>
                </Link>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-24">
            <h3 className="mb-4">Event Community</h3>
            <p className="text-sm text-slate-600 mb-4">
              {event.activeListings} people are actively trading tickets for this event
            </p>
            <div className="space-y-3">
              <Link href={`/create?event=${params.id}&type=offer`}>
                <Button variant="outline" className="w-full">
                  I have tickets
                </Button>
              </Link>
              <Link href={`/create?event=${params.id}&type=request`}>
                <Button variant="outline" className="w-full">
                  I need tickets
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
