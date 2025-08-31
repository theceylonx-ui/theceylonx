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
  AlertTriangle
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

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 0.8) return "default";
    if (score >= 0.6) return "secondary";
    return "destructive";
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
            <Sparkles className="h-6 w-6 text-purple-600" />
            Smart Travel Picks for You
          </h2>
          <p className="text-muted-foreground">
            Personalized recommendations based on your preferences and travel style
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* A/B Test Indicator */}
          <Badge variant={abTestGroup === 'personalized' ? 'default' : 'secondary'}>
            {abTestGroup === 'personalized' ? '✨ Smart Picks' : '📊 Popular Trips'}
          </Badge>

          {/* Personalization Toggle */}
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <Switch
              checked={!personalizationSettings?.isPaused}
              onCheckedChange={handleTogglePersonalization}
              disabled={togglePersonalizationMutation.isPending}
            />
            <span className="text-sm">Personalization</span>
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

          {/* Analytics Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Analytics
          </Button>
        </div>
      </div>

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
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight">
                      {trip.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {trip.fromLocation} → {trip.toLocation}
                    </CardDescription>
                  </div>
                  
                  {/* Top-5 Indicator */}
                  {index < 5 && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Top {index + 1}
                    </Badge>
                  )}
                </div>

                {/* AI Scores Row */}
                <div className="grid grid-cols-4 gap-1 mt-3">
                  <div className="text-center">
                    <div className={`text-xs font-semibold ${getScoreColor(recommendation.seasonalityScore)}`}>
                      {Math.round(recommendation.seasonalityScore * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Snowflake className="h-3 w-3" />
                      Season
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xs font-semibold ${getScoreColor(recommendation.safetyScore)}`}>
                      {Math.round(recommendation.safetyScore * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Shield className="h-3 w-3" />
                      Safety
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xs font-semibold ${getScoreColor(recommendation.noveltyScore)}`}>
                      {Math.round(recommendation.noveltyScore * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Novel
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xs font-semibold ${getScoreColor(recommendation.score)}`}>
                      {Math.round(recommendation.score * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Activity className="h-3 w-3" />
                      Match
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
                      {trip.seatsAvailable} seats
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-green-600">
                      <DollarSign className="h-3 w-3" />
                      {formatPrice(trip.price)}
                    </div>
                  </div>
                </div>

                {/* AI Reasons */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {recommendation.reasons.slice(0, 2).map((reason, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="text-xs px-2 py-0.5"
                      >
                        {reason}
                      </Badge>
                    ))}
                    {recommendation.reasons.length > 2 && (
                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                        +{recommendation.reasons.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleBookmark(trip.id, e)}
                      data-testid={`button-bookmark-${trip.id}`}
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleShare(trip.id, e)}
                      data-testid={`button-share-${trip.id}`}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleNotInterested(trip.id, e)}
                      data-testid={`button-not-interested-${trip.id}`}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
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
            <h3 className="text-lg font-semibold mb-2">No recommendations available</h3>
            <p className="text-muted-foreground mb-4">
              Update your preferences or try adjusting your filters to see personalized trip suggestions.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Refresh Recommendations
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}