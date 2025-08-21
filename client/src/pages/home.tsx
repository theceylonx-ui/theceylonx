import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import TripCard from "@/components/trip-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TripWithOrganizer } from "@shared/schema";

export default function Home() {
  const { data: trips, isLoading } = useQuery<TripWithOrganizer[]>({
    queryKey: ["/api/trips"],
  });

  const featuredTrips = trips?.slice(0, 6) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section for logged in users */}
      <section className="relative bg-gradient-to-br from-ceylon-green to-ceylon-blue py-16">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=400')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h1 className="text-3xl md:text-5xl font-bold mb-6" data-testid="hero-welcome">
            Welcome back, Explorer!
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90" data-testid="hero-subtitle">
            Ready for your next adventure? Discover new trips or share your journey with fellow travelers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/browse">
              <Button 
                size="lg"
                className="bg-white text-ceylon-green hover:bg-gray-100 text-lg font-semibold"
                data-testid="button-browse-trips"
              >
                Browse Trips
              </Button>
            </Link>
            <Link href="/post">
              <Button 
                size="lg"
                className="bg-ceylon-blue text-white hover:bg-ceylon-blue/90 text-lg font-semibold"
                data-testid="button-post-trip"
              >
                Post a Trip
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Trips Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2" data-testid="text-featured-trips">
                Featured Trips
              </h2>
              <p className="text-gray-600">Discover amazing travel opportunities</p>
            </div>
            <Link href="/browse">
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
                {trips?.length || 0}
              </div>
              <div className="text-gray-600">Active Trips</div>
            </div>
            <div data-testid="stat-destinations">
              <div className="text-3xl font-bold text-ceylon-blue mb-2">
                {new Set(trips?.map(trip => trip.region)).size || 0}
              </div>
              <div className="text-gray-600">Destinations</div>
            </div>
            <div data-testid="stat-travelers">
              <div className="text-3xl font-bold text-ceylon-green mb-2">
                {trips?.reduce((sum, trip) => sum + trip.seatsAvailable, 0) || 0}
              </div>
              <div className="text-gray-600">Available Seats</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
