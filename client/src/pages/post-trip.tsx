import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PostTripWizard } from "@/components/post-trip/PostTripWizard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { TripFormData } from "@shared/schema";

export default function PostTripPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/post-trip");
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const draftId = urlParams.get("draftId");
  const tripId = urlParams.get("tripId");
  const selectedDate = urlParams.get('date') || '';

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
      <PostTripWizard
        draftId={draftId || undefined}
        initialData={initialData}
      />
    </div>
  );
}
