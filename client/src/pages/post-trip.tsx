import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { PostTripWizard } from "@/components/post-trip/PostTripWizard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { BackLink } from "@/components/common/BackLink";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTripsStore } from "@/store/tripsStore";
import { createBackToTripsLink } from "@/utils/searchParams";
import type { TripFormData } from "@shared/schema";

export default function PostTripPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/trips/new");
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { currentDraft, setCurrentDraft } = useTripsStore();
  const [currentStep, setCurrentStep] = useState<'basics' | 'dates' | 'review'>('basics');
  
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const draftId = urlParams.get("draftId");
  const tripId = urlParams.get("tripId");
  const returnTo = urlParams.get("returnTo");
  const selectedDate = urlParams.get('date') || '';
  
  // Handle success navigation with return context
  const handleSuccessNavigation = (createdTripId: string) => {
    // Clear draft on successful creation
    setCurrentDraft(null);
    
    // Navigate to trip detail with success toast
    toast({
      title: "Trip Posted Successfully!",
      description: "Your trip is now live and visible to other travelers.",
      variant: "default",
    });
    
    // Navigate to the created trip detail
    setLocation(`/trips/${createdTripId}`);
  };

  // Load existing draft if editing
  const { data: existingDraft, isLoading: draftLoading } = useQuery({
    queryKey: ["/api/trips/draft", draftId],
    enabled: !!draftId,
  });

  // Load existing trip for editing if tripId provided
  const { data: existingTrip, isLoading: tripLoading } = useQuery({
    queryKey: ["/api/trips", tripId],
    enabled: !!tripId,
  });

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth/signin";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Loading state
  if (authLoading || draftLoading || tripLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ceylon-blue mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Prepare initial data with date from URL parameters if available
  const initialData: Partial<TripFormData> = {
    ...(existingDraft || existingTrip || {}),
    ...(selectedDate && { date: selectedDate })
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <Plus className="w-8 h-8" />
                  <h1 className="text-3xl md:text-4xl font-bold">Post a Trip</h1>
                </div>
                <p className="text-lg opacity-90">
                  Share your journey and connect with fellow travelers
                </p>
              </div>
              <div className="hidden md:block">
                <BackLink 
                  to={returnTo ? decodeURIComponent(returnTo) : createBackToTripsLink()}
                  label="← Back to Browse"
                  className="bg-white/20 text-white hover:bg-white/30 border-white/30"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Back Link */}
        <div className="mb-6 md:hidden">
          <BackLink 
            to={returnTo ? decodeURIComponent(returnTo) : createBackToTripsLink()}
            label="← Back to Browse"
            className="mb-4"
          />
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2" data-testid="page-title">
                Post a Trip
              </h1>
              <p className="text-gray-600" data-testid="page-subtitle">
                Share your travel plans and find companions for your Sri Lankan adventure.
              </p>
            </div>
            
            {/* Step indicator */}
            <div className="flex items-center gap-2" data-testid="step-indicator">
              <Badge variant={currentStep === 'basics' ? 'default' : 'outline'}>
                1. Basics
              </Badge>
              <Badge variant={currentStep === 'dates' ? 'default' : 'outline'}>
                2. Dates
              </Badge>
              <Badge variant={currentStep === 'review' ? 'default' : 'outline'}>
                3. Review
              </Badge>
            </div>
          </div>
        </div>

        {/* Post Trip Wizard */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <PostTripWizard
              draftId={draftId || undefined}
              initialData={initialData}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
