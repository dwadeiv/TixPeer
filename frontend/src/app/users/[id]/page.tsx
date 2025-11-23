'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Calendar, MapPin, Star, CheckCircle, Clock, Mail } from 'lucide-react';
import { mockUsers, mockListings, currentUser } from '@/utils/mockData';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';

export default function UserProfile() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  // Find user in mockUsers or use currentUser if it's their profile
  const user = userId === currentUser.id
    ? currentUser
    : mockUsers.find(u => u.id === userId);

  if (!user) {
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
        <Card className="p-12 text-center">
          <p className="text-slate-600">User not found</p>
        </Card>
      </div>
    );
  }

  // Get user's active listings
  const userListings = mockListings.filter(
    listing => listing.userId === userId && listing.status === 'active'
  );

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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="size-32 mb-4">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-3xl">{user.name[0]}</AvatarFallback>
              </Avatar>

              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl">{user.name}</h1>
                {user.verifiedUser && (
                  <CheckCircle className="size-5 text-blue-500 fill-blue-500" />
                )}
              </div>

              {user.location && (
                <div className="flex items-center gap-1 text-slate-600 mb-4">
                  <MapPin className="size-4" />
                  <span className="text-sm">{user.location}</span>
                </div>
              )}

              <div className="w-full space-y-4 mb-6">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Star className="size-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-2xl">{user.trustScore}</span>
                  </div>
                  <p className="text-sm text-slate-600">Trust Score</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-2xl mb-1">{user.completedTrades}</p>
                    <p className="text-sm text-slate-600">Completed Trades</p>
                  </div>

                  {user.responseTime && (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="size-4" />
                        <p className="text-sm font-medium">{user.responseTime}</p>
                      </div>
                      <p className="text-sm text-slate-600">Response Time</p>
                    </div>
                  )}
                </div>
              </div>

              {userId !== currentUser.id && (
                <Button className="w-full gap-2">
                  <Mail className="size-4" />
                  Send Message
                </Button>
              )}
            </div>
          </Card>

          {/* Badges */}
          {user.badges && user.badges.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-4">Badges</h3>
              <div className="flex flex-wrap gap-2">
                {user.badges.map((badge, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-purple-100 text-purple-700"
                  >
                    {badge}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Favorite Events */}
          {user.favoriteEvents && user.favoriteEvents.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-4">Favorite Events</h3>
              <div className="flex flex-wrap gap-2">
                {user.favoriteEvents.map((event, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                  >
                    {event}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Member Info */}
          <Card className="p-6">
            <h3 className="mb-4">Member Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="size-4" />
                <span>
                  Joined {new Date(user.joinedDate).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          {user.bio && (
            <Card className="p-6">
              <h3 className="mb-4">About</h3>
              <p className="text-slate-700">{user.bio}</p>
            </Card>
          )}

          {/* Active Listings */}
          <Card className="p-6">
            <h3 className="mb-4">
              Active Listings ({userListings.length})
            </h3>

            {userListings.length === 0 ? (
              <p className="text-slate-600 text-center py-8">
                No active listings at the moment
              </p>
            ) : (
              <div className="space-y-4">
                {userListings.map(listing => (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="block"
                  >
                    <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="flex gap-4">
                        {/* Event Image */}
                        <div className="w-32 flex-shrink-0">
                          <div className="aspect-video rounded-lg overflow-hidden">
                            <ImageWithFallback
                              src={listing.eventImage}
                              alt={listing.eventName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>

                        {/* Listing Details */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  variant={listing.type === 'offer' ? 'default' : 'secondary'}
                                  className={listing.type === 'offer' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
                                >
                                  {listing.type === 'offer' ? 'Offering' : 'Requesting'}
                                </Badge>
                                <span className="text-sm text-slate-600">
                                  {listing.ticketCount} ticket{listing.ticketCount > 1 ? 's' : ''}
                                </span>
                              </div>
                              <h4 className="hover:text-purple-600 transition-colors">
                                {listing.eventName}
                              </h4>
                            </div>
                          </div>

                          <p className="text-sm text-slate-700 line-clamp-2">
                            {listing.description}
                          </p>

                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              {new Date(listing.eventDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="size-3" />
                              {listing.eventVenue}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
