'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Button } from './ui/button';
import { MapPin, Check } from 'lucide-react';
import { popularCities, City } from '@/utils/cities';
import { cn } from './ui/utils';

interface LocationSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLocation: City | null;
  onLocationSelect: (city: City) => void;
}

export function LocationSelector({
  open,
  onOpenChange,
  currentLocation,
  onLocationSelect,
}: LocationSelectorProps) {
  const [selectedCity, setSelectedCity] = useState<City | null>(currentLocation);

  const handleSelect = (city: City) => {
    setSelectedCity(city);
  };

  const handleSave = () => {
    if (selectedCity) {
      onLocationSelect(selectedCity);
      onOpenChange(false);
    }
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
              <CommandGroup heading="Popular Cities">
                {popularCities.map((city) => (
                  <CommandItem
                    key={city.label}
                    value={city.label}
                    onSelect={() => handleSelect(city)}
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
            disabled={!selectedCity}
            className="flex-1"
          >
            Save Location
          </Button>
        </div>

        <div className="rounded-lg bg-blue-50 p-3 text-sm text-slate-700">
          <p className="flex items-start gap-2">
            <span>💡</span>
            <span>
              Your location helps us show you relevant events and connect you with local traders
            </span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
