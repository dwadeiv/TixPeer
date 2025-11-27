'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, MapPin, Star, Flag, Share2, Send } from 'lucide-react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { api } from '@/lib/api';
import { Listing } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessagesContext';

export default function ListingDetail() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();
  const { conversations } = useMessages();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const listingId = params.id as string;

        // Fetch listing data
        const listingData = await api.getListing(listingId);
        setListing(listingData);
      } catch (error) {
        console.error('Error fetching listing:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!listing) {
    return <div>Listing not found</div>;
  }

  /**
   * Handle clicking "Contact Seller" button
   * - Redirects to login if not authenticated
   * - Navigates to existing conversation if one exists
   * - Otherwise creates new conversation flow
   */
  const handleContactSeller = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + window.location.pathname);
      return;
    }

    // Don't allow messaging yourself
    if (currentUser?.id === listing.userId) {
      alert("You can't message yourself!");
      return;
    }

    // Check if conversation already exists with listing owner
    const existingConversation = conversations.find(
      (conv) =>
        (conv.user1Id === listing.userId && conv.user2Id === currentUser?.id) ||
        (conv.user2Id === listing.userId && conv.user1Id === currentUser?.id)
    );

    if (existingConversation) {
      // Navigate to existing conversation
      router.push(`/messages?conversationId=${existingConversation.id}`);
    } else {
      // Start new conversation with listing owner
      router.push(`/messages?userId=${listing.userId}`);
    }
  };

  return (
    <div className="pb-20 md:pb-8">
      <Button
        variant="ghost"
        className="gap-2 mb-6"
        onClick={() => router.back()}
      >
        <ArrowLeft className="size-4" />
        Back to listings
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Image */}
          <Card className="overflow-hidden">
            <div className="aspect-video relative">
              <ImageWithFallback
                src={listing.eventImage}
                alt={listing.eventName}
                className="w-full h-full object-cover"
              />
            </div>
          </Card>

          {/* Listing Details */}
          <Card className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <Badge
                  variant={listing.type === 'offer' ? 'default' : 'secondary'}
                  className={listing.type === 'offer' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
                >
                  {listing.type === 'offer' ? 'Offering' : 'Requesting'} {listing.ticketCount} ticket{listing.ticketCount > 1 ? 's' : ''}
                </Badge>
                <Link href={`/events/${listing.eventId}`}>
                  <h1 className="text-3xl hover:text-purple-600 transition-colors cursor-pointer">{listing.eventName}</h1>
                </Link>
                <div className="flex flex-wrap gap-4 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4" />
                    {new Date(listing.eventDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4" />
                    {listing.eventVenue}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Share2 className="size-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Flag className="size-4" />
                </Button>
              </div>
            </div>

            {listing.sectionInfo && (
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-600">Section/Seat Info</p>
                <p>{listing.sectionInfo}</p>
              </div>
            )}

            <Separator />

            <div>
              <h3 className="mb-2">Description</h3>
              <p className="text-slate-700">{listing.description}</p>
            </div>

            {listing.lookingFor && (
              <>
                <Separator />
                <div>
                  <h3 className="mb-2">Looking For</h3>
                  <p className="text-slate-700">{listing.lookingFor}</p>
                </div>
              </>
            )}

            <Separator />

            <div className="text-sm text-slate-600">
              Posted {new Date(listing.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </Card>

          {/* Seller Info */}
          <Card className="p-6">
            <h3 className="mb-4">About the Trader</h3>
            <Link href={`/users/${listing.userId}`} className="flex items-start gap-4 hover:opacity-80 transition-opacity">
              <Avatar className="size-16">
                <AvatarImage src={listing.user.avatar} />
                <AvatarFallback>{listing.user.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="text-xl">{listing.user.name}</h4>
                <div className="flex items-center gap-1 text-slate-600 mb-2">
                  <Star className="size-4 fill-yellow-400 text-yellow-400" />
                  {listing.user.trustScore} Trust Score • {listing.user.completedTrades} completed trades
                </div>
                <p className="text-sm text-slate-600">
                  Member since {new Date(listing.user.joinedDate).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </Link>
          </Card>
        </div>

        {/* Contact Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-24">
            <h3 className="mb-4">Interested in this listing?</h3>
            <p className="text-sm text-slate-600 mb-6">
              Connect with {listing.user.name} to discuss the trade details
            </p>

            {/* Contact Button */}
            <Button
              onClick={handleContactSeller}
              className="w-full gap-2 mb-4"
              disabled={currentUser?.id === listing.userId}
            >
              <Send className="size-4" />
              {currentUser?.id === listing.userId ? "Your Listing" : "Contact Seller"}
            </Button>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-slate-700">
                💡 Be clear about your expectations and arrange ticket transfer through official platforms only.
              </p>
            </div>

            {/* Listing Stats */}
            <Separator className="my-4" />
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Listed</span>
                <span className="font-medium">
                  {new Date(listing.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Status</span>
                <Badge
                  variant={listing.status === 'active' ? 'default' : 'secondary'}
                  className={listing.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                >
                  {listing.status}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
