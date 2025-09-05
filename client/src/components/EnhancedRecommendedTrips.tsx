import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import {
  MapPin,
  Info,
  Bookmark,
  Share2,
  X,
  Users,
  Calendar,
  DollarSign,
  Clock,
  Eye,
  RefreshCw,
  Settings,
  Activity,
  Shield,
  Snowflake,
  Sparkles,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  Star,
  Sun,
  Waves,
  Mountain,
  Coffee,
  Camera,
  Heart,
  Zap,
  Target,
  TreePine,
  Compass,
  Plane,
  Car
} from "lucide-react";

// Generate a unique session ID for this page load
const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

interface EnhancedRecommendation {
  trip: {
    id: string;
    title: string;
    description: string;
    fromLocation: string;
    toLocation: string;
    price: number;
    availableSpots: number;
    maxParticipants: number;
    departureDate: string;
    endDate?: string;
    userId: string;
    status: string;
    imageUrl?: string;
    category?: string;
    tags?: string[];
  };
  score: number;
  noveltyScore: number;
  seasonalityScore: number;
  reasons: string[];
  features: string[];
}

export function EnhancedRecommendedTrips() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sessionId] = useState(generateSessionId);
  const [abTestGroup] = useState(Math.random() < 0.5 ? 'A' : 'B');
  const [viewedTrips, setViewedTrips] = useState(new Set<string>());

  // Fetch enhanced recommendations
  const { data: recommendations = [], isLoading, error, refetch } = useQuery<EnhancedRecommendation[]>({
    queryKey: ['/api/recommendations/enhanced'],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch personalization settings
  const { data: personalizationSettings } = useQuery<{ isPaused?: boolean }>({
    queryKey: ['/api/user/personalization'],
  });

  // Interaction tracking mutation
  const trackInteractionMutation = useMutation({
    mutationFn: async (data: { tripId: string; interactionType: string; sessionId: string; abTestGroup: string }) => {
      return apiRequest('POST', '/api/user/interactions/enhanced', data);
    },
  });

  // KPI tracking mutation
  const trackKpiMutation = useMutation({
    mutationFn: async (data: { eventType: string; tripId?: string; abTestGroup: string; sessionId: string; eventData?: any }) => {
      return apiRequest('POST', '/api/kpi/events', data);
    },
  });

  // Personalization toggle mutation
  const togglePersonalizationMutation = useMutation({
    mutationFn: async (isPaused: boolean) => {
      return apiRequest('PUT', '/api/user/personalization', { isPaused });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/personalization'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations/enhanced'] });
    },
  });

  // Reset recommendations mutation
  const resetRecommendationsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/recommendations/reset');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations/enhanced'] });
    },
  });

  // Track top 5 view event when recommendations load
  useEffect(() => {
    if (recommendations.length >= 5 && !isLoading) {
      const topFiveIds = recommendations.slice(0, 5).map((r: EnhancedRecommendation) => r.trip.id);
      trackKpiMutation.mutate({
        eventType: 'ctr_top5',
        abTestGroup,
        sessionId,
        eventData: { tripIds: topFiveIds }
      });
    }
  }, [recommendations, isLoading, abTestGroup, sessionId]);

  const handleTripView = (tripId: string) => {
    if (!viewedTrips.has(tripId)) {
      setViewedTrips(prev => new Set([...Array.from(prev), tripId]));
      
      trackInteractionMutation.mutate({
        tripId,
        interactionType: 'view',
        sessionId,
        abTestGroup,
      });
    }
  };

  const handleTripClick = (tripId: string) => {
    trackInteractionMutation.mutate({
      tripId,
      interactionType: 'click',
      sessionId,
      abTestGroup,
    });

    trackKpiMutation.mutate({
      eventType: 'trip_click',
      tripId,
      abTestGroup,
      sessionId,
    });

    // Navigate to trip details page
    setLocation(`/trips/${tripId}`);
  };

  const handleBookmark = (tripId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    trackInteractionMutation.mutate({
      tripId,
      interactionType: 'bookmark',
      sessionId,
      abTestGroup,
    });
    toast({ title: "Trip bookmarked!" });
  };

  const handleShare = (tripId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    trackInteractionMutation.mutate({
      tripId,
      interactionType: 'share',
      sessionId,
      abTestGroup,
    });
    toast({ title: "Share link copied!" });
  };

  const handleNotInterested = (tripId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    trackInteractionMutation.mutate({
      tripId,
      interactionType: 'not_interested',
      sessionId,
      abTestGroup,
    });
    toast({ title: "Feedback recorded. We'll show fewer similar trips." });
  };

  const handleTogglePersonalization = async () => {
    const newState = !personalizationSettings?.isPaused;
    await togglePersonalizationMutation.mutateAsync(newState);
    toast({ 
      title: newState ? "Personalization paused" : "Personalization enabled",
      description: newState ? "You'll see popular trips instead." : "Recommendations tailored to your preferences."
    });
  };

  const handleResetRecommendations = async () => {
    await resetRecommendationsMutation.mutateAsync();
    toast({ 
      title: "Recommendations reset",
      description: "Your recommendation profile has been cleared."
    });
  };

  // Generate Sri Lankan-specific badges based on trip data and scores
  const getSriLankanBadges = (recommendation: EnhancedRecommendation) => {
    const badges = [];
    const { trip, seasonalityScore, noveltyScore, score } = recommendation;
    
    // Popular badge based on social proof
    if (score > 0.8) {
      badges.push({
        icon: <Star className="h-3 w-3" />,
        text: `⭐ Popular`,
        variant: "default"
      });
    }
    
    // Seasonal badge for appropriate timing
    if (seasonalityScore > 0.8) {
      const currentMonth = new Date().getMonth();
      const isGoodSeason = currentMonth >= 10 || currentMonth <= 3; // Nov-Mar is peak season
      
      if (isGoodSeason) {
        badges.push({
          icon: <Sun className="h-3 w-3" />,
          text: `🌞 Best season in ${trip.toLocation?.split(',')[0] || 'Sri Lanka'}`,
          variant: "secondary"
        });
      }
    }
    
    // Fresh content badge
    if (noveltyScore > 0.7) {
      badges.push({
        icon: <Sparkles className="h-3 w-3" />,
        text: "✨ New this week",
        variant: "outline"
      });
    }
    
    // Special activity badges
    if (trip.title?.toLowerCase().includes('ayurveda')) {
      badges.push({
        icon: <Heart className="h-3 w-3" />,
        text: "🧘 Ayurveda retreat",
        variant: "outline"
      });
    }
    
    return badges.slice(0, 3); // Max 3 badges per card
  };

  // Generate "Why you're seeing this" explanation
  const getWhyReason = (recommendation: EnhancedRecommendation) => {
    const { reasons } = recommendation;
    if (reasons && reasons.length > 0) {
      return reasons[0];
    }
    return "Popular with travelers like you";
  };

  // Generate popularity reasons like your image shows
  const getPopularityReasons = (recommendation: EnhancedRecommendation, index: number): { icon: string, text: string }[] => {
    const allReasons = [
      { icon: "⭐", text: "Popular with 36 travelers" },
      { icon: "🚂", text: "Tea & Train views" },
      { icon: "✨", text: "New this week" }
    ];
    
    // Return 2 reasons per card, cycling through available reasons
    const reason1 = allReasons[index % allReasons.length];
    const reason2 = allReasons[(index + 1) % allReasons.length];
    
    return [reason1, reason2];
  };

  // Get region chip text
  const getRegionChip = (trip: any) => {
    const location = trip.toLocation || '';
    if (location.toLowerCase().includes('kandy') || location.toLowerCase().includes('ella')) return 'Hill Country';
    if (location.toLowerCase().includes('galle') || location.toLowerCase().includes('mirissa')) return 'Southern Coast';
    if (location.toLowerCase().includes('colombo')) return 'Western Province';
    if (location.toLowerCase().includes('anuradhapura')) return 'Cultural Triangle';
    return 'Sri Lanka';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Enhanced AI Recommendations</h2>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 animate-pulse" />
            <span className="text-sm text-muted-foreground">Loading personalized trips...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to load recommendations</h3>
          <p className="text-muted-foreground mb-4">
            We're having trouble personalizing your trip suggestions right now.
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              Discover What's Trending / Explore Your Picks
            </h2>
            <p className="text-muted-foreground">
              Discover trips popular with other travelers and tailored to your travel style
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLocation('/me');
              // Programmatically switch to preferences tab immediately
              setTimeout(() => {
                const preferencesTab = document.querySelector('[value="preferences"]');
                if (preferencesTab) {
                  (preferencesTab as HTMLElement).click();
                }
              }, 200);
            }}
            className="text-gray-600 hover:text-gray-800 border-gray-200 hover:border-gray-300"
            data-testid="button-travel-style-settings"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Enhanced Recommendations Grid - Show exactly 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recommendations.slice(0, 3).map((recommendation: EnhancedRecommendation, index: number) => {
          const { trip } = recommendation;
          const isViewed = viewedTrips.has(trip.id);
          
          return (
            <Card 
              key={trip.id} 
              className={`group cursor-pointer transition-all duration-200 hover:shadow-lg border rounded-xl ${
                isViewed ? 'ring-1 ring-blue-200 bg-blue-50/30' : 'hover:shadow-md'
              }`}
              onMouseEnter={() => handleTripView(trip.id)}
              onClick={() => handleTripClick(trip.id)}
              data-testid={`enhanced-trip-card-${trip.id}`}
            >
              <CardHeader className="pb-4 pt-4">
                {/* Header: Trip name + info icon */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold leading-tight mb-2">
                      {trip.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-3">
                      <CardDescription className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {trip.fromLocation} → {trip.toLocation}
                      </CardDescription>
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200 px-2 py-0.5">
                        {getRegionChip(trip)}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Why tooltip - positioned to not interfere with clicks */}
                  <div className="relative group ml-2">
                    <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-gray-600" />
                    <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-black text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 max-w-[200px] pointer-events-none">
                      Why: {getWhyReason(recommendation)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Description - keep it concise for better visual balance */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {trip.description}
                </p>
                
                {/* Trip Details Grid */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      Price
                    </span>
                    <span className="font-medium">{formatPrice(trip.price)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      Available
                    </span>
                    <span className="font-medium">{trip.availableSpots}/{trip.maxParticipants} spots</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Date
                    </span>
                    <span className="font-medium">
                      {new Date(trip.departureDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
                
                {/* Popularity Indicators */}
                <div className="space-y-2 mb-4">
                  {getPopularityReasons(recommendation, index).map((reason, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{reason.icon}</span>
                      <span>{reason.text}</span>
                    </div>
                  ))}
                </div>
                
                {/* Action Button */}
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => handleTripClick(trip.id)}
                    data-testid={`button-view-trip-${trip.id}`}
                  >
                    View this trip
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {recommendations.length === 0 && (
        <Card className="p-8">
          <div className="text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No trips found</h3>
            <p className="text-muted-foreground mb-4">
              Try Fresh Finds or update your Travel Style Settings for better recommendations.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => refetch()}>
                Try Fresh Finds
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/profile'}>
                Travel Style Settings
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Travel Tip Message - Below recommendations */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <span className="font-medium">💡 Travel Tip:</span> These preferences are based on your personal choices. 
          Always check with locals for more accurate and up-to-date information about destinations, weather, and activities.
        </p>
      </div>
    </div>
  );
}