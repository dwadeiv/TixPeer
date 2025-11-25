'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Star, Calendar, CheckCircle2, Settings, LogOut, Camera, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

export default function Profile() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('active');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userListings, setUserListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [minZoom, setMinZoom] = useState(1);

  /**
   * Calculate minimum zoom needed to fill crop area when rotated
   * This prevents empty space (black bars) at the corners when rotating
   *
   * For a square crop, when rotated by angle θ, we need to ensure the
   * rotated bounding box fits within the crop area. The formula accounts
   * for the width and height expansion when rotating a rectangle.
   */
  useEffect(() => {
    if (!previewUrl) return;

    // Convert rotation to radians
    const rotationRad = (rotation * Math.PI) / 180;

    // Normalize rotation to 0-45 degree range (pattern repeats every 90°, symmetric around 45°)
    const normalizedRad = Math.abs(rotationRad) % (Math.PI / 2);
    const angle = normalizedRad > Math.PI / 4
      ? Math.PI / 2 - normalizedRad
      : normalizedRad;

    // For a square crop area and square image:
    // minZoom = (cos(θ) + sin(θ)) which reaches maximum √2 at 45°
    // This ensures rotated image diagonal always covers the crop square
    const minZoomNeeded = Math.cos(angle) + Math.sin(angle);

    setMinZoom(minZoomNeeded);

    // Auto-adjust zoom if current zoom is below minimum
    if (zoom < minZoomNeeded) {
      setZoom(minZoomNeeded);
    }
  }, [rotation, previewUrl]);

  /**
   * Handle user logout
   * Clears authentication state and redirects to homepage
   */
  const handleLogout = () => {
    logout();
    router.push('/');
  };

  /**
   * Callback fired when crop area changes
   * Saves the cropped area pixel coordinates for later processing
   */
  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  /**
   * Creates a cropped image from the original image and crop area
   * Returns a File object with the cropped image data
   */
  const createCroppedImage = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0
  ): Promise<File> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        const file = new File([blob], selectedFile?.name || 'cropped-image.jpg', {
          type: 'image/jpeg',
        });
        resolve(file);
      }, 'image/jpeg');
    });
  };

  /**
   * Helper function to create an image element from a URL
   */
  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  /**
   * Handle file selection
   * Creates a preview URL for the selected image file
   * Validates file type and size before setting state
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview URL for the cropper
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      // Reset crop settings when new file is selected
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Handle profile picture upload
   * Processes the image (crops, rotates) then uploads to backend
   */
  const handleUpdateAvatar = async () => {
    if (!selectedFile || !previewUrl) {
      alert('Please select an image file');
      return;
    }

    if (!croppedAreaPixels) {
      alert('Please wait for the image to load');
      return;
    }

    try {
      setSaving(true);

      // Create cropped image file from user's crop settings
      // This applies zoom, rotation, and crop area to produce final image
      const croppedImageFile = await createCroppedImage(
        previewUrl,
        croppedAreaPixels,
        rotation
      );

      // Upload cropped file to backend
      const response = await api.uploadAvatar(croppedImageFile);

      // Update current user with new avatar from response
      setCurrentUser(response.user);

      // Close dialog and reset state
      setAvatarDialogOpen(false);
      setSelectedFile(null);
      setPreviewUrl('');
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);
    } catch (error: any) {
      console.error('Error updating avatar:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile picture. Please try again.';
      alert(errorMessage);
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
   * If API call fails with 401, logout to clear invalid token
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
      } catch (error: any) {
        console.error('Error fetching profile data:', error);
        // If unauthorized, clear auth state and redirect to login
        if (error.response?.status === 401) {
          logout();
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [authLoading, isAuthenticated, logout, router]);

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
        <Button asChild>
          <Link href="/login">Go to Login</Link>
        </Button>
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
              {/* Avatar URLs from Cloudinary are full CDN URLs, don't prepend API_URL */}
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-0 right-0 size-8 rounded-full shadow-md"
              onClick={() => {
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
              Choose an image file from your device. Supported formats: JPG, PNG, GIF, WebP (max 5MB)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* File input */}
            <div className="space-y-2">
              <Label htmlFor="avatarFile">Select Image</Label>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="avatarFile"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 cursor-pointer transition-colors"
                >
                  <Camera className="size-4" />
                  Choose from Device
                </label>
                <input
                  id="avatarFile"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {selectedFile && (
                  <p className="text-sm text-slate-700">
                    Selected: {selectedFile.name}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  Supported formats: JPG, PNG, GIF, WebP (max 5MB)
                </p>
              </div>
            </div>

            {/* Image cropping area */}
            {previewUrl && (
              <div className="space-y-4">
                {/* Cropper container with fixed aspect ratio */}
                <div className="relative w-full h-64 bg-slate-100 rounded-lg overflow-hidden">
                  <Cropper
                    image={previewUrl}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={1} // Square crop for profile picture
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                    onCropComplete={onCropComplete}
                    minZoom={minZoom} // Prevent zoom below minimum needed to fill crop area
                  />
                </div>

                {/* Zoom control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Zoom</Label>
                    <span className="text-xs text-slate-500">{Math.round(zoom * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ZoomOut className="size-4 text-slate-500" />
                    <input
                      type="range"
                      min={minZoom}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <ZoomIn className="size-4 text-slate-500" />
                  </div>
                </div>

                {/* Rotation control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Rotation</Label>
                    <span className="text-xs text-slate-500">{rotation}°</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <RotateCw className="size-4 text-slate-500" />
                    <input
                      type="range"
                      min={0}
                      max={360}
                      step={1}
                      value={rotation}
                      onChange={(e) => setRotation(Number(e.target.value))}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <RotateCw className="size-4 text-slate-500" />
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAvatarDialogOpen(false);
                setSelectedFile(null);
                setPreviewUrl('');
                setCrop({ x: 0, y: 0 });
                setZoom(1);
                setRotation(0);
                setCroppedAreaPixels(null);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateAvatar} disabled={saving || !selectedFile}>
              {saving ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
