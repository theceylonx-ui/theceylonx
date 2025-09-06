import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Grid3X3, List, MapPin, Plus } from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import TripCard from "@/components/trip-card";
import BrowseTripsFilters from "@/components/trips/BrowseTripsFilters";
import { useTripsFiltersStore } from "@/store/tripsFiltersStore";
import { TipsBox } from "@/components/TipsBox";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createPostTripLink } from "@/utils/searchParams";
import { EmptyState } from "@/components/EmptyState";
import type { TripWithOrganizer } from "@shared/schema";

export default function BrowseTrips() {
  const [, setLocation] = useLocation();
  const { filters, setResultsCount } = useTripsFiltersStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Update view mode
  const handleViewModeChange = (newView: 'list' | 'map') => {
    setViewMode(newView);
  };

  const { data, isLoading } = useQuery<{
    trips: (TripWithOrganizer & { isPinned?: boolean })[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: ["/api/trips", filters, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Convert our new filter format to API params
      if (filters.q) params.set('search', filters.q);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      if (filters.region) params.set('region', filters.region);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.priceMin) params.set('minPrice', filters.priceMin.toString());
      if (filters.priceMax) params.set('maxPrice', filters.priceMax.toString());
      
      params.set('page', currentPage.toString());
      params.set('limit', '8');
      
      const response = await fetch(`/api/trips?${params}`);
      if (!response.ok) throw new Error("Failed to fetch trips");
      return response.json();
    },
  });
  
  const trips = data?.trips || [];
  const pagination = data?.pagination;

  // Update results count in store when data changes
  useEffect(() => {
    if (pagination?.total !== undefined) {
      setResultsCount(pagination.total);
    }
  }, [pagination?.total, setResultsCount]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Handle Post Trip navigation with current context
  const handlePostTrip = () => {
    const currentPath = `${window.location.pathname}${window.location.search}`;
    const postTripUrl = createPostTripLink(currentPath);
    setLocation(postTripUrl);
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Pagination component
  const PaginationComponent = () => {
    if (!pagination || pagination.totalPages <= 1) return null;
    
    const { page, totalPages } = pagination;
    const maxVisiblePages = 5;
    const startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    const pages = [];
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return (
      <div className="flex justify-center items-center space-x-2 mt-8" data-testid="pagination">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="hover:bg-gray-50"
          data-testid="pagination-prev"
        >
          Previous
        </Button>
        
        {startPage > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              className="hover:bg-gray-50"
              data-testid="pagination-page-1"
            >
              1
            </Button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}
        
        {pages.map((pageNum) => (
          <Button
            key={pageNum}
            variant={page === pageNum ? "default" : "outline"}
            size="sm"
            onClick={() => handlePageChange(pageNum)}
            className={page === pageNum ? "bg-ceylon-green hover:bg-ceylon-green/90 shadow-sm" : "hover:bg-gray-50"}
            data-testid={`pagination-page-${pageNum}`}
          >
            {pageNum}
          </Button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              className="hover:bg-gray-50"
              data-testid={`pagination-page-${totalPages}`}
            >
              {totalPages}
            </Button>
          </>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          className="hover:bg-gray-50"
          data-testid="pagination-next"
        >
          Next
        </Button>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2" data-testid="page-title">
              Browse Trips
            </h1>
            <p className="text-gray-600" data-testid="page-subtitle">
              Discover amazing travel opportunities across Sri Lanka.
            </p>
          </div>
          
          <Button
            onClick={handlePostTrip}
            className="bg-ceylon-green hover:bg-ceylon-green/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 shrink-0"
            size="lg"
            data-testid="button-post-trip"
          >
            <Plus className="mr-2 h-5 w-5" />
            Post a Trip
          </Button>
        </div>

        {/* Filters */}
        <BrowseTripsFilters />

        {/* Results Header with View Toggle */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-gray-600" data-testid="results-count">
            {isLoading ? "Loading..." : `${pagination?.total || 0} trips found`}
            {pagination && pagination.totalPages > 1 && (
              <span className="text-sm text-gray-500 ml-2">
                (Page {pagination.page} of {pagination.totalPages})
              </span>
            )}
          </p>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 mr-2">View:</span>
            <div className="flex items-center border border-gray-200 rounded-lg p-1" data-testid="view-toggle">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('list')}
                className={`${
                  viewMode === 'list' 
                    ? 'bg-ceylon-green hover:bg-ceylon-green/90 text-white' 
                    : 'hover:bg-gray-100'
                }`}
                data-testid="view-list"
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('map')}
                className={`${
                  viewMode === 'map' 
                    ? 'bg-ceylon-green hover:bg-ceylon-green/90 text-white' 
                    : 'hover:bg-gray-100'
                }`}
                data-testid="view-map"
              >
                <MapPin className="h-4 w-4 mr-1" />
                Map
              </Button>
            </div>
          </div>
        </div>

        {/* Conditional Content Based on View Mode */}
        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
            ) : trips.length > 0 ? (
              trips.map((trip) => (
                <TripCard key={trip.id} trip={trip as any} data-testid={`trip-card-${trip.id}`} />
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState 
                  type="trips"
                  primaryAction={{
                    label: "Post a Trip",
                    onClick: handlePostTrip
                  }}
                  secondaryAction={{
                    label: "Clear filters",
                    onClick: () => {
                      const { clearAll } = useTripsFiltersStore.getState();
                      clearAll();
                    },
                    variant: "outline"
                  }}
                  showCard={false}
                />
              </div>
            )}
          </div>
        ) : (
          // Map View
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px] flex items-center justify-center" data-testid="map-view">
            <div className="text-center text-gray-500">
              <MapPin className="mx-auto h-16 w-16 mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Map View</h3>
              <p className="text-gray-600 mb-4">Interactive map view coming soon!</p>
              <p className="text-sm text-gray-500">This will show trip locations on a Sri Lankan map</p>
              <Button 
                onClick={() => handleViewModeChange('list')}
                variant="outline"
                className="mt-4"
                data-testid="button-back-to-list"
              >
                <List className="h-4 w-4 mr-2" />
                Back to List View
              </Button>
            </div>
          </div>
        )}
        
        {/* Pagination */}
        <PaginationComponent />
        
        {/* Tips Section */}
        <div className="mt-8">
          <TipsBox
            title="How to Use Browse Trips"
            defaultCollapsed={true}
            tips={[
              "⭐ <strong>Interested</strong> = let the organizer know you like this trip",
              "📌 <strong>Pin</strong> = save trips you want to revisit later", 
              "💬 <strong>Chat Buddy</strong> unlocks when the organizer accepts your request",
              "💚 <strong>Free</strong> = if price is 0 or not set, trip is free to join",
              "Use filters (Trending, Near You, Fresh Finds, For You) to explore Sri Lanka's coast, hills, culture, and safaris"
            ]}
          />
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
