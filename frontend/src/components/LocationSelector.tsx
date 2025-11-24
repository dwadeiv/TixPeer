'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Button } from './ui/button';
import { MapPin, Check, Navigation, Loader2 } from 'lucide-react';
import { popularCities, City, findClosestCity } from '@/utils/cities';
import { cn } from './ui/utils';

interface LocationSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLocation: City | null;
  onLocationSelect: (city: City | null) => void;
}

export function LocationSelector({
  open,
  onOpenChange,
  currentLocation,
  onLocationSelect,
}: LocationSelectorProps) {
  const [selectedCity, setSelectedCity] = useState<City | null>(currentLocation);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleSelect = (city: City | null) => {
    setSelectedCity(city);
    setLocationError(null);
  };

  const handleSave = () => {
    onLocationSelect(selectedCity);
    onOpenChange(false);
  };

  const handleCurrentLocation = () => {
    setLocationError(null);
    setIsGettingLocation(true);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const closestCity = findClosestCity(latitude, longitude);
        setSelectedCity(closestCity);
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied. Please enable location access.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An error occurred while getting your location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="size-5 text-purple-600" />
            Set Your Location
          </DialogTitle>
          <DialogDescription>
            Choose your city to see local ticket listings and events near you
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Command className="rounded-lg border shadow-sm">
            <CommandInput placeholder="Search for a city..." />
            <CommandList>
              <CommandEmpty>No city found.</CommandEmpty>
              <CommandGroup heading="Location">
                <CommandItem
                  value="current-location"
                  onSelect={handleCurrentLocation}
                  className="cursor-pointer border-b"
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Navigation className="mr-2 size-4 text-blue-600" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">
                      {isGettingLocation ? 'Getting your location...' : 'Use Current Location'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {isGettingLocation ? 'Please wait' : 'Automatically detect your city'}
                    </div>
                  </div>
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Popular Cities">
                {popularCities.map((city) => (
                  <CommandItem
                    key={city.label}
                    value={city.label}
                    onSelect={() => handleSelect(city)}
                    onDoubleClick={() => {
                      onLocationSelect(city);
                      onOpenChange(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 size-4',
                        selectedCity?.label === city.label ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <MapPin className="mr-2 size-4 text-slate-400" />
                    <div>
                      <div className="font-medium">{city.name}</div>
                      <div className="text-xs text-slate-500">{city.state}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>

        <div className="flex justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
          >
            Save Location
          </Button>
        </div>

        {locationError ? (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <p className="flex items-start gap-2">
              <span>⚠️</span>
              <span>{locationError}</span>
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-slate-700">
            <p className="flex items-start gap-2">
              <span>💡</span>
              <span>
                Your location helps us show you relevant events and connect you with local peers
              </span>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
