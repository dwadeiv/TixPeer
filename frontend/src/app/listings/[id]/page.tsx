'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, MapPin, Star, Flag, Share2, Send } from 'lucide-react';
import { mockListings, currentUser } from '@/utils/mockData';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { Message } from '@/types';

export default function ListingDetail() {
  const params = useParams();
  const router = useRouter();
  const listing = mockListings.find(l => l.id === params.id);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderId: listing?.userId || '',
      text: "Hey! Thanks for reaching out. I'm happy to discuss a trade.",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
  ]);
  const [newMessage, setNewMessage] = useState('');

  if (!listing) {
    return <div>Listing not found</div>;
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      text: newMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, message]);
    setNewMessage('');
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

        {/* Chat Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-24">
            <h3 className="mb-4">Start a Conversation</h3>
            <p className="text-sm text-slate-600 mb-4">
              Connect with {listing.user.name} to discuss the trade details
            </p>

            {/* Messages */}
            <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
              {messages.map((message) => {
                const isCurrentUser = message.senderId === currentUser.id;
                const sender = isCurrentUser ? currentUser : listing.user;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="size-8">
                      <AvatarImage src={sender.avatar} />
                      <AvatarFallback>{sender.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 ${isCurrentUser ? 'text-right' : ''}`}>
                      <div
                        className={`inline-block p-3 rounded-lg ${
                          isCurrentUser
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="space-y-3">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
              />
              <Button type="submit" className="w-full gap-2">
                <Send className="size-4" />
                Send Message
              </Button>
            </form>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-slate-700">
                💡 Be clear about your expectations and arrange ticket transfer through official platforms only.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
