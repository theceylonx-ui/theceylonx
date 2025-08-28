import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface TripFiltersProps {
  filters: {
    from: string;
    to: string;
    date: string;
    region: string;
    minPrice: string;
    maxPrice: string;
    search: string;
  };
  onFiltersChange: (filters: any) => void;
}

export default function TripFilters({ filters, onFiltersChange }: TripFiltersProps) {
  const updateFilter = (key: string, value: string) => {
    // Convert "any" and "all" back to empty strings for the API
    const normalizedValue = (value === "any" || value === "all") ? "" : value;
    onFiltersChange({
      ...filters,
      [key]: normalizedValue,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      from: "",
      to: "",
      date: "",
      region: "",
      minPrice: "",
      maxPrice: "",
      search: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "");

  const popularLocations = [
    "Colombo", "Kandy", "Galle", "Nuwara Eliya", "Sigiriya", "Mirissa", 
    "Ella", "Anuradhapura", "Polonnaruwa", "Bentota", "Negombo", "Dambulla"
  ];

  return (
    <Card className="mb-6" data-testid="trip-filters">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Filter Trips</h3>
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-800"
              data-testid="button-clear-filters"
            >
              Clear All
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search trips by title or location..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>

          {/* Location and Date Filters */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Location</label>
              <Select value={filters.from || "any"} onValueChange={(value) => updateFilter("from", value)}>
                <SelectTrigger data-testid="select-from">
                  <SelectValue placeholder="Select departure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any location</SelectItem>
                  {popularLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Location</label>
              <Select value={filters.to || "any"} onValueChange={(value) => updateFilter("to", value)}>
                <SelectTrigger data-testid="select-to">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any location</SelectItem>
                  {popularLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <Input
                type="date"
                value={filters.date}
                onChange={(e) => updateFilter("date", e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                data-testid="input-date"
              />
            </div>
          </div>

          {/* Region and Price Filters */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
              <Select value={filters.region || "all"} onValueChange={(value) => updateFilter("region", value)}>
                <SelectTrigger data-testid="select-region">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All regions</SelectItem>
                  <SelectItem value="western">Western Province</SelectItem>
                  <SelectItem value="southern">Southern Province</SelectItem>
                  <SelectItem value="central">Central Province</SelectItem>
                  <SelectItem value="northern">Northern Province</SelectItem>
                  <SelectItem value="eastern">Eastern Province</SelectItem>
                  <SelectItem value="northwestern">Northwestern Province</SelectItem>
                  <SelectItem value="north-central">North Central Province</SelectItem>
                  <SelectItem value="sabaragamuwa">Sabaragamuwa Province</SelectItem>
                  <SelectItem value="uva">Uva Province</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Price (LKR)</label>
              <Input
                type="number"
                placeholder="Min price"
                value={filters.minPrice}
                onChange={(e) => updateFilter("minPrice", e.target.value)}
                min="0"
                data-testid="input-min-price"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Price (LKR)</label>
              <Input
                type="number"
                placeholder="Max price"
                value={filters.maxPrice}
                onChange={(e) => updateFilter("maxPrice", e.target.value)}
                min="0"
                data-testid="input-max-price"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
