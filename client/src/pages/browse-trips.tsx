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
import type { TripWithNormalizedOrganizer } from "@shared/schema";

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
    trips: (TripWithNormalizedOrganizer & { isPinned?: boolean })[];
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
      if (filters.category) params.set('category', filters.category);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
      // Advanced filters
      if (filters.duration) params.set('duration', filters.duration);
      if (filters.difficulty && filters.difficulty.length > 0) params.set('difficulty', filters.difficulty.join(','));
      if (filters.interests && filters.interests.length > 0) params.set('interests', filters.interests.join(','));
      if (filters.groupSizeMin != null) params.set('groupSizeMin', filters.groupSizeMin.toString());
      if (filters.groupSizeMax != null) params.set('groupSizeMax', filters.groupSizeMax.toString());
      if (filters.daysRange != null) params.set('daysRange', filters.daysRange.toString());
      
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
      <div className="flex justify-center items-center space-x-2 mt-12" data-testid="pagination">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50"
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
              className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
              data-testid="pagination-page-1"
            >
              1
            </Button>
            {startPage > 2 && <span className="px-2 text-text-muted">...</span>}
          </>
        )}
        
        {pages.map((pageNum) => (
          <Button
            key={pageNum}
            variant={page === pageNum ? "default" : "outline"}
            size="sm"
            onClick={() => handlePageChange(pageNum)}
            className={page === pageNum ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 border-none" : "border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"}
            data-testid={`pagination-page-${pageNum}`}
          >
            {pageNum}
          </Button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-text-muted">...</span>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
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
          className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50"
          data-testid="pagination-next"
        >
          Next
        </Button>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-ui-bg">
      <Navigation />
      
      <div className="page-container section-spacing">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <MapPin className="w-8 h-8" />
                  <h1 className="text-3xl md:text-4xl font-bold" data-testid="page-title">
                    Browse Trips
                  </h1>
                </div>
                <p className="text-lg opacity-90" data-testid="page-subtitle">
                  Discover amazing travel opportunities across Sri Lanka.
                </p>
              </div>
              <div className="hidden md:block">
                <Button
                  onClick={handlePostTrip}
                  variant="secondary"
                  size="lg"
                  className="text-blue-600"
                  data-testid="button-post-trip"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Post a Trip
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <BrowseTripsFilters />
        </div>

        {/* Results Header with View Toggle */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <p className="body" data-testid="results-count">
              {isLoading ? "Loading..." : `${pagination?.total || 0} trips found`}
            </p>
            {pagination && pagination.totalPages > 1 && (
              <p className="caption">
                Page {pagination.page} of {pagination.totalPages}
              </p>
            )}
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-3">
            <span className="caption">View:</span>
            <div className="flex items-center border border-ui-line rounded-xl p-1 bg-ui-surface" data-testid="view-toggle">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('list')}
                className="rounded-lg"
                data-testid="view-list"
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('map')}
                className="rounded-lg"
                data-testid="view-map"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Map
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-0">
                  <Skeleton className="h-48 w-full rounded-t-2xl" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="flex justify-center">
            <EmptyState
              type="trips"
              title="No trips match your filters"
              description="Try adjusting your search criteria or clear all filters to see more results."
              primaryAction={{
                label: "Clear Filters",
                onClick: () => {
                  // Reset all filters
                  const { clearAll } = useTripsFiltersStore.getState();
                  clearAll();
                }
              }}
            />
          </div>
        ) : viewMode === 'list' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
              {trips.map((trip) => (
                <div key={trip.id} className="relative">
                  {trip.isPinned && (
                    <Badge 
                      variant="secondary" 
                      className="absolute top-3 left-3 z-10 bg-brand/10 text-brand border-brand/20 font-medium"
                    >
                      Featured
                    </Badge>
                  )}
                  <TripCard trip={trip as any} />
                </div>
              ))}
            </div>
            <PaginationComponent />
          </>
        ) : (
          <div className="card-base">
            <div className="flex items-center justify-center h-96">
              <div className="text-center space-y-4">
                <MapPin className="h-16 w-16 text-text-muted mx-auto" />
                <div>
                  <h3 className="h3 mb-2">Map View Coming Soon</h3>
                  <p className="caption">We're working on an interactive map to help you visualize trip locations.</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setViewMode('list')}
                >
                  Switch to List View
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
      
      {/* Tips Section */}
      <div className="mt-16 mb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <TipsBox
            title="🎯 Pro Tips for Finding Great Trips"
            tips={[
              "Use <strong>filters</strong> to narrow down trips by location, date, or price range",
              "Check the <strong>trip organizer's profile</strong> and ratings before joining", 
              "Look for the <strong>💚 Free Trip</strong> badge for cost-effective adventures",
              "Read <strong>trip descriptions carefully</strong> to understand what's included",
              "Use <strong>Chat Buddy</strong> to message organizers before committing",
              "Save interesting trips by clicking the <strong>📌 Pin</strong> button"
            ]}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}