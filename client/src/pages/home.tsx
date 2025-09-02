import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import TripCard from "@/components/trip-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TripWithOrganizer } from "@shared/schema";
import backgroundImage from "@assets/11_1756417976014.png";
import { RecommendedTrips } from "@/components/RecommendedTrips";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: tripsData, isLoading } = useQuery<{
    trips: TripWithOrganizer[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: ["/api/trips"],
  });

  const featuredTrips = tripsData?.trips?.slice(0, 6) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section - conditional content based on authentication */}
      <section className="relative bg-gradient-to-br from-ceylon-green to-ceylon-blue py-16">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>
        
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center text-white">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-6 mt-4 drop-shadow-2xl" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8), 1px 1px 4px rgba(0,0,0,0.6)' }} data-testid="hero-welcome">
            Discover Sri Lanka with Smart Picks
          </h1>
          <p className="text-base sm:text-lg md:text-xl mb-4 max-w-2xl mx-auto px-4 drop-shadow-lg" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8), 0px 0px 2px rgba(0,0,0,0.6)' }} data-testid="hero-subtitle">
            Real traveler trends + your travel style = trips you'll love.
          </p>
          <p className="text-sm sm:text-base mb-8 max-w-xl mx-auto px-4 opacity-90 drop-shadow-lg" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }} data-testid="hero-trust-line">
            Powered by CeylonX ML. Private, simple, helpful.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Button 
              size="lg"
              className="bg-white text-ceylon-green hover:bg-gray-100 text-base sm:text-lg font-semibold w-full sm:w-auto shadow-lg px-6 py-3"
              onClick={() => setLocation("/browse-trips")}
              data-testid="button-browse-trending"
            >
              🔥 Browse Trending
            </Button>
            <Button 
              size="lg"
              className="bg-ceylon-blue text-white hover:bg-ceylon-blue/90 text-base sm:text-lg font-semibold w-full sm:w-auto px-6 py-3"
              onClick={() => setLocation("/travel-preferences")}
              data-testid="button-set-travel-style"
            >
              ✨ Set My Travel Style
            </Button>
          </div>
        </div>
      </section>

      {/* Enhanced AI Recommendations Section - Only for authenticated users */}
      {user && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RecommendedTrips limit={12} enhanced={true} className="mb-8" />
          </div>
        </section>
      )}

      {/* Featured Trips Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2" data-testid="text-featured-trips">
                Featured Trips
              </h2>
              <p className="text-gray-600">Discover amazing travel opportunities.</p>
            </div>
            <Link href="/browse-trips">
              <Button variant="outline" className="text-ceylon-green border-ceylon-green hover:bg-ceylon-green hover:text-white" data-testid="link-view-all">
                View All →
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, i) => (
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
            ) : featuredTrips.length > 0 ? (
              featuredTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} data-testid={`trip-card-${trip.id}`} />
              ))
            ) : (
              <div className="col-span-full text-center py-12" data-testid="empty-trips">
                <p className="text-gray-600 text-lg">No trips available yet. Be the first to post one!</p>
                <Link href="/post">
                  <Button className="mt-4 bg-ceylon-green hover:bg-ceylon-green/90" data-testid="button-create-first-trip">
                    Create Your First Trip
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div data-testid="stat-active-trips">
              <div className="text-3xl font-bold text-ceylon-green mb-2">
                {tripsData?.trips?.length || 0}
              </div>
              <div className="text-gray-600">Active Trips</div>
            </div>
            <div data-testid="stat-destinations">
              <div className="text-3xl font-bold text-ceylon-blue mb-2">
                {new Set(tripsData?.trips?.map(trip => trip.region)).size || 0}
              </div>
              <div className="text-gray-600">Destinations</div>
            </div>
            <div data-testid="stat-travelers">
              <div className="text-3xl font-bold text-ceylon-green mb-2">
                {tripsData?.trips?.reduce((sum, trip) => sum + trip.seatsAvailable, 0) || 0}
              </div>
              <div className="text-gray-600">Available Seats</div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
