'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Star, Calendar, CheckCircle2, Settings, LogOut, Camera } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export default function Profile() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('active');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userListings, setUserListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  /**
   * Handle user logout
   * Clears authentication state and redirects to homepage
   */
  const handleLogout = () => {
    logout();
    router.push('/');
  };

  /**
   * Handle profile picture update
   * Sends avatar URL to backend and refreshes profile data
   */
  const handleUpdateAvatar = async () => {
    try {
      setSaving(true);
      await api.updateProfile({ avatar: avatarUrl });
      // Refresh profile data to show new avatar
      const updatedUser = await api.getProfile();
      setCurrentUser(updatedUser);
      setAvatarDialogOpen(false);
      setAvatarUrl('');
    } catch (error) {
      console.error('Error updating avatar:', error);
      alert('Failed to update profile picture. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Redirect to login if user is not authenticated
   * Only runs after AuthContext has finished loading
   */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  /**
   * Fetch profile data only if user is authenticated
   */
  useEffect(() => {
    const fetchProfileData = async () => {
      // Don't fetch if not authenticated or still loading auth state
      if (authLoading || !isAuthenticated) {
        return;
      }

      try {
        setLoading(true);
        const [userData, listingsData] = await Promise.all([
          api.getProfile(),
          api.getListings()
        ]);
        setCurrentUser(userData);
        const myListings = listingsData.filter((l: any) => l.userId === userData.id);
        setUserListings(myListings);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [authLoading, isAuthenticated]);

  // Show loading state while checking authentication or fetching data
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  // This shouldn't show because of the redirect in useEffect above
  // but keeping as a fallback
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-slate-600">Please log in to view your profile</p>
        <Link href="/login">
          <Button>Go to Login</Button>
        </Link>
      </div>
    );
  }

  const activeListings = userListings.filter((l: any) => l.status === 'active');
  const completedListings = userListings.filter((l: any) => l.status === 'completed');

  return (
    <div className="max-w-4xl mx-auto pb-20 md:pb-8">
      {/* Profile Header */}
      <Card className="p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Profile Picture with Edit Button */}
          <div className="relative">
            <Avatar className="size-24">
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-0 right-0 size-8 rounded-full shadow-md"
              onClick={() => {
                setAvatarUrl(currentUser.avatar || '');
                setAvatarDialogOpen(true);
              }}
            >
              <Camera className="size-4" />
            </Button>
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl mb-2">{currentUser.name}</h1>
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="flex items-center gap-1">
                    <Star className="size-4 fill-yellow-400 text-yellow-400" />
                    <span>{currentUser.trustScore} Trust Score</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="size-4 text-green-600" />
                    <span>{currentUser.completedTrades} trades</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="size-4" />
                    <span>
                      Joined {new Date(currentUser.joinedDate).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Settings className="size-4" />
                  Edit Profile
                </Button>
                <Button variant="outline" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">Log out</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 bg-slate-50">
                <div className="text-2xl mb-1">{activeListings.length}</div>
                <div className="text-sm text-slate-600">Active Listings</div>
              </Card>
              <Card className="p-4 bg-slate-50">
                <div className="text-2xl mb-1">{completedListings.length}</div>
                <div className="text-sm text-slate-600">Completed</div>
              </Card>
              <Card className="p-4 bg-slate-50">
                <div className="text-2xl mb-1">98%</div>
                <div className="text-sm text-slate-600">Response Rate</div>
              </Card>
            </div>
          </div>
        </div>
      </Card>

      {/* Listings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="active">Active Listings</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeListings.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-slate-600 mb-4">You don't have any active listings</p>
              <Link href="/create">
                <Button>Create Your First Listing</Button>
              </Link>
            </Card>
          ) : (
            activeListings.map(listing => (
              <Card key={listing.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge
                      variant={listing.type === 'offer' ? 'default' : 'secondary'}
                      className={listing.type === 'offer' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
                    >
                      {listing.type === 'offer' ? 'Offering' : 'Requesting'} {listing.ticketCount} ticket{listing.ticketCount > 1 ? 's' : ''}
                    </Badge>
                    <h3 className="text-xl mt-2">{listing.eventName}</h3>
                    {listing.sectionInfo && (
                      <p className="text-slate-600">{listing.sectionInfo}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="outline" size="sm">Delete</Button>
                  </div>
                </div>

                <p className="text-slate-700 mb-4">{listing.description}</p>

                <div className="flex items-center justify-between pt-4 border-t text-sm text-slate-600">
                  <span>Posted {new Date(listing.createdAt).toLocaleDateString()}</span>
                  <Link href={`/listings/${listing.id}`}>
                    <Button variant="ghost" size="sm">View Listing</Button>
                  </Link>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card className="p-12 text-center">
            <CheckCircle2 className="size-12 mx-auto mb-4 text-green-600" />
            <p className="text-slate-600">Your completed trades will appear here</p>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          <Card className="p-12 text-center">
            <p className="text-slate-600">Save listings you're interested in to view them later</p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Trust & Safety */}
      <Card className="p-6 mt-6">
        <h3 className="mb-4">Building Your Trust Score</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p>Complete your profile with a photo and bio</p>
              <p className="text-slate-600">Increases trust by 15%</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p>Verify your email and phone number</p>
              <p className="text-slate-600">Increases trust by 20%</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="size-5 border-2 border-slate-300 rounded-full flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-slate-600">Complete your first successful trade</p>
              <p className="text-slate-600">Increases trust by 25%</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Avatar Upload Dialog */}
      <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
            <DialogDescription>
              Enter a URL for your profile picture. You can use image hosting services like Imgur, Cloudinary, or a direct image link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Preview current avatar */}
            {avatarUrl && (
              <div className="flex justify-center">
                <Avatar className="size-24">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
                </Avatar>
              </div>
            )}

            {/* Image URL input */}
            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Image URL</Label>
              <Input
                id="avatarUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAvatarDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAvatar} disabled={saving || !avatarUrl}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
