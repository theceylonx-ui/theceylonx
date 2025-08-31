import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Users, DollarSign, Star, Eye, TrendingUp, Sparkles } from "lucide-react";
import { useRecommendations, useTrackInteraction } from "@/hooks/useRecommendations";
import { useAuth } from "@/hooks/useAuth";
import EnhancedRecommendedTrips from "./EnhancedRecommendedTrips";
import { Link } from "wouter";
import { format } from "date-fns";

interface RecommendedTripsProps {
  limit?: number;
  region?: string;
  className?: string;
  enhanced?: boolean;
}

export function RecommendedTrips({ limit = 6, region, className, enhanced = false }: RecommendedTripsProps) {
  const { user } = useAuth();
  
  // If enhanced mode is requested, render the enhanced component
  if (enhanced && user) {
    return (
      <div className={className}>
        <EnhancedRecommendedTrips />
      </div>
    );
  }
  
  const { data: recommendations, isLoading } = useRecommendations({ 
    limit, 
    region 
  });
  const { mutate: trackInteraction } = useTrackInteraction();

  const handleTripClick = (tripId: string) => {
    if (user) {
      trackInteraction({
        tripId,
        interactionType: 'click',
      });
    }
  };

  const handleTripView = (tripId: string) => {
    if (user) {
      trackInteraction({
        tripId,
        interactionType: 'view',
        duration: 1, // Simple view tracking
      });
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Recommended for You
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: limit }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No recommendations yet</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {user 
            ? "Set your preferences to get personalized trip recommendations!" 
            : "Sign in to get personalized trip recommendations based on your preferences."}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Recommended for You
        </h2>
        {recommendations.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            Personalized
          </Badge>
        )}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((recommendation) => {
          const { trip, score, reasons, features } = recommendation;
          
          return (
            <Card 
              key={trip.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleTripView(trip.id)}
              data-testid={`recommendation-card-${trip.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base line-clamp-2" data-testid={`trip-title-${trip.id}`}>
                    {trip.title}
                  </CardTitle>
                  <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <Star className="h-3 w-3 fill-current" />
                    {Math.round(score * 100)}%
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{trip.fromLocation} → {trip.toLocation}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{format(new Date(trip.date), 'MMM dd')} at {trip.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>{trip.seatsAvailable} seats</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-600">${trip.price}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {trip.region}
                  </Badge>
                </div>

                {features && (
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {features.avgRating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {features.avgRating}
                      </div>
                    )}
                    {features.viewCount && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {features.viewCount}
                      </div>
                    )}
                  </div>
                )}
                
                {reasons.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Why recommended:</p>
                    <div className="flex flex-wrap gap-1">
                      {reasons.slice(0, 2).map((reason, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs px-2 py-0.5">
                          {reason}
                        </Badge>
                      ))}
                      {reasons.length > 2 && (
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          +{reasons.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                <Link 
                  href={`/trips/${trip.id}`}
                  onClick={() => handleTripClick(trip.id)}
                >
                  <Button 
                    className="w-full" 
                    size="sm"
                    data-testid={`view-trip-${trip.id}`}
                  >
                    View Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}