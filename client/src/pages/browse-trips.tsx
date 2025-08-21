import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import TripCard from "@/components/trip-card";
import TripFilters from "@/components/trip-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import type { TripWithOrganizer } from "@shared/schema";

export default function BrowseTrips() {
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    date: "",
    region: "",
    minPrice: "",
    maxPrice: "",
    search: "",
  });

  const { data: trips, isLoading } = useQuery<TripWithOrganizer[]>({
    queryKey: ["/api/trips", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      
      const response = await fetch(`/api/trips?${params}`);
      if (!response.ok) throw new Error("Failed to fetch trips");
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2" data-testid="page-title">
            Browse Trips
          </h1>
          <p className="text-gray-600" data-testid="page-subtitle">
            Discover amazing travel opportunities across Sri Lanka
          </p>
        </div>

        {/* Filters */}
        <TripFilters filters={filters} onFiltersChange={setFilters} />

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600" data-testid="results-count">
            {isLoading ? "Loading..." : `${trips?.length || 0} trips found`}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 9 }).map((_, i) => (
              <Card key={i} className="overflow-hidden" data-testid={`skeleton-trip-${i}`}>
                <Skeleton className="w-full h-48" />
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : trips && trips.length > 0 ? (
            trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} data-testid={`trip-card-${trip.id}`} />
            ))
          ) : (
            <div className="col-span-full text-center py-12" data-testid="empty-trips">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters or check back later for new trips.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
