'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function CreateListing() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const initialType = (searchParams.get('type') as 'offer' | 'request') || 'offer';

  const [listingType, setListingType] = useState<'offer' | 'request'>(initialType);
  const [eventId, setEventId] = useState('');
  const [ticketCount, setTicketCount] = useState('');
  const [sectionInfo, setSectionInfo] = useState('');
  const [description, setDescription] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Authentication Guard
   * Redirect unauthenticated users to login page
   * This prevents non-logged-in users from accessing the create listing page
   */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/create');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const eventsData = await api.getEvents();
        setEvents(eventsData);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Create listing via backend API
      const listingData = {
        eventId,
        type: listingType,
        ticketCount: parseInt(ticketCount),
        sectionInfo: sectionInfo || undefined,
        description,
      };

      const newListing = await api.createListing(listingData);

      // Redirect to the newly created listing detail page
      router.push(`/listings/${newListing.id}`);
    } catch (error: any) {
      console.error('Error creating listing:', error);
      alert(error.response?.data?.message || 'Failed to create listing. Please try again.');
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto pb-20 md:pb-8 flex justify-center items-center min-h-[400px]">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  // Don't render the form if user is not authenticated (prevents flash before redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto pb-20 md:pb-8">
      <Button
        variant="ghost"
        className="gap-2 mb-6"
        onClick={() => router.back()}
      >
        <ArrowLeft className="size-4" />
        Back
      </Button>

      <Card className="p-6 md:p-8">
        <h1 className="text-3xl mb-2">Create New Listing</h1>
        <p className="text-slate-600 mb-8">
          Share your tickets or let the community know what you're looking for
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Listing Type */}
          <div className="space-y-3">
            <Label>I want to...</Label>
            <RadioGroup value={listingType} onValueChange={(v) => setListingType(v as any)}>
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                <RadioGroupItem value="offer" id="offer" />
                <Label htmlFor="offer" className="cursor-pointer flex-1">
                  <span>Offer tickets I have</span>
                  <p className="text-sm text-slate-600">You have tickets to trade or sell</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                <RadioGroupItem value="request" id="request" />
                <Label htmlFor="request" className="cursor-pointer flex-1">
                  <span>Request tickets I need</span>
                  <p className="text-sm text-slate-600">You're looking for specific tickets</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Event Selection */}
          <div className="space-y-2">
            <Label htmlFor="event">Event *</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger id="event">
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} - {new Date(event.date).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-slate-600">
              Don't see your event? <button type="button" className="text-purple-600 hover:underline">Add a new event</button>
            </p>
          </div>

          {/* Ticket Count */}
          <div className="space-y-2">
            <Label htmlFor="ticketCount">Number of Tickets *</Label>
            <Input
              id="ticketCount"
              type="number"
              min="1"
              placeholder="e.g., 2"
              value={ticketCount}
              onChange={(e) => setTicketCount(e.target.value)}
              required
            />
          </div>

          {/* Section Info (only for offers) */}
          {listingType === 'offer' && (
            <div className="space-y-2">
              <Label htmlFor="sectionInfo">Section/Seat Information</Label>
              <Input
                id="sectionInfo"
                placeholder="e.g., Section 104, Row 15, Seats 1-2"
                value={sectionInfo}
                onChange={(e) => setSectionInfo(e.target.value)}
              />
              <p className="text-sm text-slate-600">
                Optional, but helps build trust with potential traders
              </p>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder={
                listingType === 'offer'
                  ? "Tell people about your tickets. Why are you trading? What's your ideal trade?"
                  : "What are you looking for? Any specific requirements or preferences?"
              }
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Looking For */}
          <div className="space-y-2">
            <Label htmlFor="lookingFor">
              {listingType === 'offer' ? 'What are you looking for?' : 'Open to trading?'}
            </Label>
            <Textarea
              id="lookingFor"
              placeholder={
                listingType === 'offer'
                  ? "e.g., Hamilton tickets any date, NBA Finals tickets, or cash"
                  : "e.g., Have Taylor Swift tickets to trade"
              }
              rows={3}
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
            />
          </div>

          {/* Proof of Tickets (offer only) */}
          {listingType === 'offer' && (
            <div className="space-y-2">
              <Label>Proof of Tickets (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer">
                <Upload className="size-8 mx-auto mb-2 text-slate-400" />
                <p className="text-slate-600">Upload screenshot (names/barcodes will be hidden)</p>
                <p className="text-sm text-slate-500 mt-1">Increases trust score</p>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Post Listing
            </Button>
          </div>
        </form>
      </Card>

      {/* Safety Notice */}
      <Card className="mt-6 p-6 bg-amber-50 border-amber-200">
        <h3 className="mb-2">Safety Reminder</h3>
        <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
          <li>Never share personal payment information publicly</li>
          <li>Complete ticket transfers on official ticket platforms</li>
          <li>Meet in public places if exchanging in person</li>
          <li>Report suspicious behavior to our team</li>
        </ul>
      </Card>
    </div>
  );
}
