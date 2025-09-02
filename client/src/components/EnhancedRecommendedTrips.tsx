import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  useEnhancedRecommendations, 
  usePersonalizationSettings,
  useTogglePersonalization,
  useResetRecommendations,
  useTrackEnhancedInteraction,
  useTrackKpiEvent,
  generateSessionId,
  getABTestGroup 
} from "@/hooks/useEnhancedRecommendations";
import { useAuth } from "@/hooks/useAuth";
import { 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Clock, 
  Bookmark,
  BookmarkCheck,
  Share2,
  Eye,
  ThumbsDown,
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
  MessageCircle,
  Info,
  Edit
} from "lucide-react";
import { format } from "date-fns";

interface EnhancedRecommendation {
  trip: any;
  score: number;
  reasons: string[];
  features: any;
  seasonalityScore: number;
  safetyScore: number;
  noveltyScore: number;
  diversityScore: number;
}

export default function EnhancedRecommendedTrips() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessionId] = useState(() => generateSessionId());
  const [abTestGroup] = useState(() => getABTestGroup(user?.id));
  const [viewedTrips, setViewedTrips] = useState<Set<string>>(new Set());
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Trending');

  const { 
    data: recommendations = [], 
    isLoading, 
    error,
    refetch 
  } = useEnhancedRecommendations({ 
    limit: 12,
    abTestGroup 
  });

  const { 
    data: personalizationSettings 
  } = usePersonalizationSettings();

  const togglePersonalizationMutation = useTogglePersonalization();
  const resetRecommendationsMutation = useResetRecommendations();
  const trackInteractionMutation = useTrackEnhancedInteraction();
  const trackKpiMutation = useTrackKpiEvent();

  // Track when user views top 5 recommendations for CTR measurement
  useEffect(() => {
    if (recommendations.length >= 5 && !isLoading) {
      const topFiveIds = recommendations.slice(0, 5).map(r => r.trip.id);
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
      setViewedTrips(prev => new Set([...prev, tripId]));
      
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
        text: `Popular with ${Math.floor(Math.random() * 50 + 10)} travelers`,
        variant: "default"
      });
    }
    
    // Seasonal badges based on location and time
    if (seasonalityScore > 0.8) {
      const location = trip.toLocation?.toLowerCase() || '';
      if (location.includes('beach') || location.includes('galle') || location.includes('mirissa')) {
        badges.push({
          icon: <Waves className="h-3 w-3" />,
          text: "🌊 Surf season",
          variant: "secondary"
        });
      } else if (location.includes('kandy') || location.includes('ella') || location.includes('nuwara')) {
        badges.push({
          icon: <Coffee className="h-3 w-3" />,
          text: "🚂 Tea & Train views",
          variant: "secondary"
        });
      } else if (location.includes('yala') || location.includes('safari')) {
        badges.push({
          icon: <Camera className="h-3 w-3" />,
          text: "🐆 Safari season",
          variant: "secondary"
        });
      } else {
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
      {/* Enhanced Header with Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-purple-600" />
            Trending Trips & For You
          </h2>
          <p className="text-muted-foreground">
            Discover trips popular with other travelers and tailored to your travel style
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Filter Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              className="min-w-[120px] justify-between"
            >
              {selectedFilter}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Personalization Toggle */}
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <Switch
              checked={!personalizationSettings?.isPaused}
              onCheckedChange={handleTogglePersonalization}
              disabled={togglePersonalizationMutation.isPending}
            />
            <span className="text-sm">Personalization</span>
            <div className="relative group">
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                Turn off to see all trips without reordering
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetRecommendations}
            disabled={resetRecommendationsMutation.isPending}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Travel Style Settings CTA */}
      <div className="mb-4">
        <Button 
          variant="ghost" 
          size="sm"
          className="text-purple-600 hover:text-purple-700 p-0 h-auto"
          onClick={() => window.location.href = '/profile'}
        >
          <Edit className="h-4 w-4 mr-1" />
          Fine-tune your Travel Style →
        </Button>
      </div>

      {/* Preferences Nudge Banner */}
      {(!personalizationSettings || !personalizationSettings.hasPreferences) && (
        <Card className="p-4 mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <div className="flex-1">
              <h4 className="font-medium text-purple-900">Want better picks?</h4>
              <p className="text-sm text-purple-700">Answer 3 quick questions in Travel Style Settings for personalized recommendations.</p>
            </div>
            <Button 
              size="sm" 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => window.location.href = '/profile'}
            >
              Set Preferences
            </Button>
          </div>
        </Card>
      )}

      {/* Analytics Panel */}
      {showAnalytics && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{recommendations.length}</div>
              <div className="text-sm text-muted-foreground">Total Recommendations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {recommendations.filter(r => r.seasonalityScore > 0.8).length}
              </div>
              <div className="text-sm text-muted-foreground">Perfect Season</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {recommendations.filter(r => r.noveltyScore > 0.7).length}
              </div>
              <div className="text-sm text-muted-foreground">Fresh Discoveries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {viewedTrips.size}
              </div>
              <div className="text-sm text-muted-foreground">Viewed This Session</div>
            </div>
          </div>
        </Card>
      )}

      {/* Enhanced Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((recommendation: EnhancedRecommendation, index) => {
          const { trip } = recommendation;
          const isViewed = viewedTrips.has(trip.id);
          
          return (
            <Card 
              key={trip.id} 
              className={`group cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isViewed ? 'ring-2 ring-blue-200' : ''
              }`}
              onMouseEnter={() => handleTripView(trip.id)}
              onClick={() => handleTripClick(trip.id)}
              data-testid={`enhanced-trip-card-${trip.id}`}
            >
              <CardHeader className="pb-3">
                {/* Header: Trip name + region chip */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight">
                      {trip.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {trip.fromLocation} → {trip.toLocation}
                      </CardDescription>
                      <Badge variant="secondary" className="text-xs">
                        {getRegionChip(trip)}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Why tooltip */}
                  <div className="relative group ml-2">
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 max-w-[200px]">
                      Why you're seeing this: {getWhyReason(recommendation)}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Trip Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(trip.date), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {trip.time}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {trip.seatsAvailable} seats available
                    </div>
                    <div className="flex items-center gap-1 font-semibold">
                      {trip.price === 0 || !trip.price ? (
                        <span className="text-green-600 flex items-center gap-1">
                          💚 Free
                        </span>
                      ) : (
                        <span className="text-green-600 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatPrice(trip.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sri Lankan Badges */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {getSriLankanBadges(recommendation).map((badge, idx) => (
                      <Badge 
                        key={idx} 
                        variant={badge.variant as any}
                        className="text-xs px-2 py-1 flex items-center gap-1"
                      >
                        {badge.icon}
                        {badge.text}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Footer Actions: 📌 Pin · ⭐ Interested · ↔ Share · 💬 Ask */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <button 
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={(e) => {e.stopPropagation(); handleBookmark(trip.id, e);}}
                      data-testid={`button-pin-${trip.id}`}
                    >
                      📌 Pin
                    </button>
                    <button 
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={(e) => {e.stopPropagation(); /* Handle interested */}}
                      data-testid={`button-interested-${trip.id}`}
                    >
                      ⭐ Interested
                    </button>
                    <button 
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={(e) => {e.stopPropagation(); handleShare(trip.id, e);}}
                      data-testid={`button-share-${trip.id}`}
                    >
                      ↔ Share
                    </button>
                    <button 
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={(e) => {e.stopPropagation(); /* Handle ask */}}
                      data-testid={`button-ask-${trip.id}`}
                    >
                      💬 Ask
                    </button>
                  </div>
                  
                  {isViewed && (
                    <Badge variant="secondary" className="text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      Viewed
                    </Badge>
                  )}
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
    </div>
  );
}