import { useState, useEffect } from "react";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

interface DestinationSelectProps {
  value: string;
  onChange: (value: string) => void;
  onRegionChange?: (region: string) => void;
  label: string;
  placeholder?: string;
  error?: string;
  className?: string;
  required?: boolean;
}

const SRI_LANKA_REGIONS = [
  { value: "western", label: "Western Province", districts: ["Colombo", "Gampaha", "Kalutara"] },
  { value: "central", label: "Central Province", districts: ["Kandy", "Matale", "Nuwara Eliya"] },
  { value: "southern", label: "Southern Province", districts: ["Galle", "Matara", "Hambantota"] },
  { value: "northern", label: "Northern Province", districts: ["Jaffna", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya"] },
  { value: "eastern", label: "Eastern Province", districts: ["Ampara", "Batticaloa", "Trincomalee"] },
  { value: "north_western", label: "North Western Province", districts: ["Kurunegala", "Puttalam"] },
  { value: "north_central", label: "North Central Province", districts: ["Anuradhapura", "Polonnaruwa"] },
  { value: "uva", label: "Uva Province", districts: ["Badulla", "Monaragala"] },
  { value: "sabaragamuwa", label: "Sabaragamuwa Province", districts: ["Ratnapura", "Kegalle"] },
];

const POPULAR_DESTINATIONS = [
  { name: "Colombo", region: "western", type: "city" },
  { name: "Kandy", region: "central", type: "city" },
  { name: "Galle", region: "southern", type: "city" },
  { name: "Nuwara Eliya", region: "central", type: "city" },
  { name: "Anuradhapura", region: "north_central", type: "historic" },
  { name: "Polonnaruwa", region: "north_central", type: "historic" },
  { name: "Sigiriya", region: "central", type: "attraction" },
  { name: "Ella", region: "uva", type: "scenic" },
  { name: "Mirissa", region: "southern", type: "beach" },
  { name: "Unawatuna", region: "southern", type: "beach" },
  { name: "Bentota", region: "western", type: "beach" },
  { name: "Arugam Bay", region: "eastern", type: "beach" },
  { name: "Trincomalee", region: "eastern", type: "city" },
  { name: "Jaffna", region: "northern", type: "city" },
  { name: "Yala National Park", region: "southern", type: "wildlife" },
  { name: "Udawalawe National Park", region: "sabaragamuwa", type: "wildlife" },
];

export function DestinationSelect({ 
  value, 
  onChange, 
  onRegionChange,
  label, 
  placeholder = "Search or type location...",
  error,
  className,
  required = false
}: DestinationSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputMode, setInputMode] = useState(false);
  
  // Filter destinations based on search query
  const filteredDestinations = POPULAR_DESTINATIONS.filter(dest =>
    dest.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Auto-detect region when destination is selected
  useEffect(() => {
    if (value && onRegionChange) {
      const destination = POPULAR_DESTINATIONS.find(dest => 
        dest.name.toLowerCase() === value.toLowerCase()
      );
      if (destination) {
        onRegionChange(destination.region);
      }
      // Note: For custom locations, we don't auto-set region - user can select manually
    }
  }, [value, onRegionChange]);
  
  const handleSelect = (destination: string) => {
    onChange(destination);
    setOpen(false);
    setSearchQuery("");
  };
  
  const selectedRegion = value ? POPULAR_DESTINATIONS.find(dest => 
    dest.name.toLowerCase() === value.toLowerCase()
  )?.region : null;
  
  const regionInfo = selectedRegion ? SRI_LANKA_REGIONS.find(r => r.value === selectedRegion) : null;
  
  return (
    <div className={className}>
      <Label htmlFor="destination-input" className="text-sm font-medium mb-2 block">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      
      {/* Toggle between input and dropdown modes */}
      <div className="space-y-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-10"
              data-testid="destination-select-trigger"
            >
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                {value || placeholder}
              </div>
              <Search className="h-4 w-4 text-gray-500" />
            </Button>
          </PopoverTrigger>
        
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search destinations..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              data-testid="destination-search-input"
            />
            <CommandEmpty>No destinations found.</CommandEmpty>
            
            <CommandGroup heading="Popular Destinations">
              {filteredDestinations.map((destination) => (
                <CommandItem
                  key={destination.name}
                  value={destination.name}
                  onSelect={() => handleSelect(destination.name)}
                  className="flex items-center justify-between"
                  data-testid={`destination-option-${destination.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{destination.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {destination.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {SRI_LANKA_REGIONS.find(r => r.value === destination.region)?.label.replace(' Province', '')}
                    </Badge>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            
            {searchQuery && !filteredDestinations.find(d => d.name.toLowerCase() === searchQuery.toLowerCase()) && (
              <CommandGroup heading="Custom Location">
                <CommandItem
                  value={searchQuery}
                  onSelect={() => handleSelect(searchQuery)}
                  className="flex items-center"
                  data-testid="destination-custom-option"
                >
                  <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                  <span>Use "{searchQuery}" as custom location</span>
                </CommandItem>
              </CommandGroup>
            )}
            
            {searchQuery.length === 0 && (
              <div className="p-3 text-sm text-gray-600 border-t">
                💡 Type any location name to add a custom destination
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
      
        {/* Alternative: Direct text input option */}
        <div className="text-xs text-gray-500 text-center">
          Or type directly: 
          <Input
            placeholder="Type custom location..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1 h-9"
            data-testid="destination-direct-input"
          />
        </div>
      </div>
      
      {/* Show selected region info */}
      {regionInfo && (
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            📍 {regionInfo.label}
          </Badge>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-600 mt-1" data-testid="destination-error">
          {error}
        </p>
      )}
    </div>
  );
}