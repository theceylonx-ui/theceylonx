"use client";
import { useEffect, useState } from "react";
import { useRouter, useLocation } from "wouter";
import { useTripsFiltersStore } from "@/store/tripsFiltersStore";
import { encodeFiltersToQuery, decodeFiltersFromQuery } from "@/lib/urlState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import QuickDateChips from "./QuickDateChips";
import PriceRangeSlider from "./PriceRangeSlider";
import { motion } from "framer-motion";
import { Search, MapPin, Globe, Calendar as CalendarIcon, DollarSign, X } from "lucide-react";

type Props = {
  regions?: string[];        // provide from server
  locations?: string[];      // provide from server
};

// Sri Lankan regions for the dropdown
const DEFAULT_REGIONS = [
  "Western", "Central", "Southern", "Northern", "Eastern", 
  "North Western", "North Central", "Uva", "Sabaragamuwa"
];

// Popular Sri Lankan destinations
const DEFAULT_LOCATIONS = [
  "Colombo", "Kandy", "Galle", "Anuradhapura", "Polonnaruwa", 
  "Sigiriya", "Dambulla", "Ella", "Nuwara Eliya", "Bentota",
  "Mirissa", "Yala", "Arugam Bay", "Jaffna", "Trincomalee"
];

export default function BrowseTripsFilters({ 
  regions = DEFAULT_REGIONS, 
  locations = DEFAULT_LOCATIONS 
}: Props) {
  const [, setLocation] = useLocation();
  const { filters, set, setMany, clearAll, resultsCount } = useTripsFiltersStore();

  // 1) Initialize from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const decoded = decodeFiltersFromQuery(params.toString());
    if (Object.keys(decoded).length > 0) {
      setMany(decoded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Update URL when filters change (debounced would be better for performance)
  useEffect(() => {
    const q = encodeFiltersToQuery(filters);
    const newPath = `/browse-trips${q}`;
    
    // Only update if URL actually changed to avoid infinite loops
    if (window.location.pathname + window.location.search !== newPath) {
      setLocation(newPath, { replace: true });
    }
  }, [filters, setLocation]);

  const hasActiveFilters = Object.values(filters).some(val => 
    val !== null && val !== "" && val !== undefined
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border bg-card p-5 md:p-6 shadow-sm"
      aria-labelledby="filter-heading"
      data-testid="browse-trips-filters"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 id="filter-heading" className="text-lg font-semibold flex items-center gap-2">
          <Search className="h-5 w-5" />
          Filter Trips
        </h2>
        <div className="flex items-center gap-3">
          <Badge variant="outline" aria-live="polite" data-testid="results-count">
            {resultsCount} trips found
          </Badge>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={clearAll} 
              aria-label="Clear all filters"
              data-testid="btn-clear-all"
              className="text-sm"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="🔎 Search by title, location, or keyword…"
          value={filters.q}
          onChange={(e) => set("q", e.target.value)}
          aria-label="Search trips"
          data-testid="input-search"
          className="text-base"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* From Location */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            From Location
          </label>
          <LocationCombobox
            value={filters.from}
            onChange={(value) => set("from", value)}
            placeholder="My Current Location"
            locations={locations}
            testId="select-from-location"
          />
        </div>

        {/* To Location */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            To Location
          </label>
          <LocationCombobox
            value={filters.to}
            onChange={(value) => set("to", value)}
            placeholder="Anywhere"
            locations={locations}
            testId="select-to-location"
          />
        </div>

        {/* Region */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Region
          </label>
          <Select value={filters.region ?? "all"} onValueChange={(v) => set("region", v === "all" ? null : v)}>
            <SelectTrigger data-testid="select-region">
              <SelectValue placeholder="All regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All regions</SelectItem>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="space-y-2 lg:col-span-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Date
          </label>
          <div className="flex flex-col gap-2">
            <QuickDateChips />
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="justify-between text-left font-normal"
                  data-testid="btn-date-range"
                >
                  {filters.startDate && filters.endDate
                    ? `${filters.startDate} → ${filters.endDate}`
                    : "Select date range"}
                  <CalendarIcon className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="p-3 w-auto" data-testid="date-picker">
                <Calendar
                  mode="range"
                  selected={
                    filters.startDate && filters.endDate
                      ? { from: new Date(filters.startDate), to: new Date(filters.endDate) }
                      : undefined
                  }
                  onSelect={(range: any) => {
                    setMany({
                      startDate: range?.from ? range.from.toISOString().slice(0,10) : null,
                      endDate: range?.to ? range.to.toISOString().slice(0,10) : null,
                    });
                  }}
                  numberOfMonths={2}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Price Range (LKR)
          </label>
          <PriceRangeSlider />
        </div>
      </div>

      {/* Mobile sticky actions (desktop can rely on live updates) */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {hasActiveFilters ? "Filters applied" : "No filters applied"}
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={clearAll}
            disabled={!hasActiveFilters}
            data-testid="btn-clear-filters"
          >
            Clear
          </Button>
          <Button 
            variant="default"
            className="bg-ceylon-orange hover:bg-ceylon-orange/90"
            data-testid="btn-apply-filters"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </motion.section>
  );
}

// Custom location combobox component that allows both selection and custom input
function LocationCombobox({ 
  value, 
  onChange, 
  placeholder, 
  locations, 
  testId 
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder: string;
  locations: string[];
  testId: string;
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");

  // Update local state when external value changes
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const handleSelect = (selectedValue: string) => {
    const newValue = selectedValue === "clear" ? null : selectedValue;
    onChange(newValue);
    setInputValue(newValue || "");
    setOpen(false);
  };

  const handleInputChange = (newInputValue: string) => {
    setInputValue(newInputValue);
    // Update the filter with the current input value
    onChange(newInputValue.trim() || null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-left font-normal"
          data-testid={testId}
        >
          {inputValue || placeholder}
          <MapPin className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder={`Type or select ${placeholder.toLowerCase()}...`}
            value={inputValue}
            onValueChange={handleInputChange}
            data-testid={`${testId}-input`}
          />
          <CommandList>
            <CommandEmpty>Type a custom location name</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="clear"
                onSelect={() => handleSelect("clear")}
                data-testid={`${testId}-clear`}
              >
                <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                {placeholder}
              </CommandItem>
              {locations.map((location) => (
                <CommandItem
                  key={location}
                  value={location}
                  onSelect={() => handleSelect(location)}
                  data-testid={`${testId}-${location.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Check 
                    className={cn(
                      "mr-2 h-4 w-4", 
                      value === location ? "opacity-100" : "opacity-0"
                    )} 
                  />
                  {location}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}