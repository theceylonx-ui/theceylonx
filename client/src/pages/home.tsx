import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import TripCard from "@/components/trip-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { TripWithOrganizer } from "@shared/schema";
import { RecommendedTrips } from "@/components/RecommendedTrips";
import { PreferencesCompletionBanner } from "@/components/PreferencesCompletionBanner";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Determine if user is new (created within last 7 days or low profile completion)
  const isNewUser = user && (
    (new Date().getTime() - new Date(user.createdAt || '').getTime()) < (7 * 24 * 60 * 60 * 1000) ||
    (user.profileCompletePct || 0) < 70
  );
  
  // Get trending trips with badges instead of regular trips
  const { data: trendingData, isLoading } = useQuery<any[]>({
    queryKey: ["/api/recommendations/trending"],
    queryFn: () => fetch('/api/recommendations/trending?limit=6').then(res => res.json()),
  });

  const trendingTrips = trendingData || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section - conditional content based on authentication */}
      <section className="relative bg-gradient-to-br from-ceylon-green to-ceylon-blue py-16">
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center text-white py-12 sm:py-20">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 drop-shadow-2xl tracking-tight" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }} data-testid="hero-welcome">
            {user ? "Welcome back, Explorer!" : "Discover Sri Lanka Together"}
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl mb-12 max-w-3xl mx-auto font-light opacity-95 drop-shadow-lg" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }} data-testid="hero-subtitle">
            {user 
              ? "Find your next adventure or share your journey with fellow travelers"
              : "Join travelers exploring the beauty of Sri Lanka"
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg"
              className="bg-white text-ceylon-green hover:bg-gray-100 text-lg font-semibold w-full sm:w-auto shadow-2xl px-8 py-6 rounded-full transition-all hover:scale-105"
              onClick={() => setLocation("/browse-trips")}
              data-testid="button-browse-trips"
            >
              Browse Trips
            </Button>
            {user ? (
              <Button 
                size="lg"
                className="bg-ceylon-blue text-white hover:bg-ceylon-blue/90 text-lg font-semibold w-full sm:w-auto shadow-2xl px-8 py-6 rounded-full transition-all hover:scale-105"
                onClick={() => window.location.href = "/post"}
                data-testid="button-post-trip"
              >
                Post a Trip
              </Button>
            ) : (
              <Button 
                size="lg"
                className="bg-ceylon-blue text-white hover:bg-ceylon-blue/90 text-lg font-semibold w-full sm:w-auto shadow-2xl px-8 py-6 rounded-full transition-all hover:scale-105"
                onClick={() => window.location.href = "/auth/signin"}
                data-testid="button-get-started"
              >
                Get Started
              </Button>
            )}
          </div>
          
          {/* Subtle help link for new users */}
          {user && isNewUser && (
            <div className="mt-8">
              <Link href="/faq">
                <span className="text-white/80 hover:text-white text-sm underline underline-offset-4 cursor-pointer transition-colors" data-testid="link-faq-newuser">
                  New to Ceylon Expand? Learn how it works →
                </span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Preferences Completion Banner - Only for authenticated users */}
      {user && (
        <section className="pt-8 pb-4 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <PreferencesCompletionBanner />
          </div>
        </section>
      )}

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
              <h2 className="text-3xl font-bold text-gray-800 mb-2" data-testid="text-trending-trips">
                Trending Trips
              </h2>
              <p className="text-gray-600">Popular destinations with real Sri Lankan insights.</p>
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
            ) : trendingTrips.length > 0 ? (
              trendingTrips.map((recommendation) => (
                <TripCard 
                  key={recommendation.trip.id} 
                  trip={recommendation.trip} 
                  badges={recommendation.reasons}
                  data-testid={`trip-card-${recommendation.trip.id}`} 
                />
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

      {/* More Trips Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2" data-testid="text-more-trips">
                Discover More Adventures
              </h2>
              <p className="text-gray-600">Explore even more exciting trips across Sri Lanka.</p>
            </div>
            <Link href="/browse-trips">
              <Button variant="outline" className="text-ceylon-green border-ceylon-green hover:bg-ceylon-green hover:text-white" data-testid="link-browse-all">
                Browse All →
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden" data-testid={`skeleton-more-trip-${i}`}>
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
            ) : trendingTrips.length > 3 ? (
              // Show different trips from the trending ones (slice from 3 onwards or show last 3)
              trendingTrips.slice(-3).map((recommendation) => (
                <TripCard 
                  key={`more-${recommendation.trip.id}`} 
                  trip={recommendation.trip} 
                  badges={recommendation.features || []}
                  data-testid={`more-trip-card-${recommendation.trip.id}`} 
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12" data-testid="empty-more-trips">
                <p className="text-gray-600 text-lg">Discover more amazing trips waiting for you!</p>
                <Link href="/browse-trips">
                  <Button className="mt-4 bg-ceylon-green hover:bg-ceylon-green/90" data-testid="button-explore-trips">
                    Explore All Trips
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
