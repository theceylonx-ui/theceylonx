import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import TripCard from "@/components/trip-card";
import TripFilters from "@/components/trip-filters";
import { TipsBox } from "@/components/TipsBox";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TripWithOrganizer } from "@shared/schema";

export default function BrowseTrips() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    date: "",
    region: "",
    minPrice: "",
    maxPrice: "",
    search: "",
  });

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
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      params.set('page', currentPage.toString());
      params.set('limit', '8');
      
      const response = await fetch(`/api/trips?${params}`);
      if (!response.ok) throw new Error("Failed to fetch trips");
      return response.json();
    },
  });
  
  const trips = data?.trips || [];
  const pagination = data?.pagination;

  // Reset to page 1 when filters change
  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
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
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2" data-testid="page-title">
            Browse Trips
          </h1>
          <p className="text-gray-600" data-testid="page-subtitle">
            Discover amazing travel opportunities across Sri Lanka.
          </p>
        </div>

        {/* Filters */}
        <TripFilters filters={filters} onFiltersChange={handleFiltersChange} />

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600" data-testid="results-count">
            {isLoading ? "Loading..." : `${pagination?.total || 0} trips found`}
            {pagination && pagination.totalPages > 1 && (
              <span className="text-sm text-gray-500 ml-2">
                (Page {pagination.page} of {pagination.totalPages})
              </span>
            )}
          </p>
        </div>

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
