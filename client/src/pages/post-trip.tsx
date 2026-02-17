import { useEffect, useState, lazy, Suspense } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Plus, Zap, ClipboardList } from "lucide-react";

const PostTripWizard = lazy(() => 
  import("@/components/post-trip/PostTripWizard").then(module => ({
    default: module.PostTripWizard
  }))
);
const QuickTripWizard = lazy(() =>
  import("@/components/post-trip/QuickTripWizard").then(module => ({
    default: module.QuickTripWizard
  }))
);
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { BackLink } from "@/components/common/BackLink";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTripsStore } from "@/store/tripsStore";
import { createBackToTripsLink } from "@/utils/searchParams";
import { TipsBox } from "@/components/TipsBox";
import Footer from "@/components/Footer";
import type { TripFormData } from "@shared/schema";

type TripMode = 'select' | 'quick' | 'detailed';

export default function PostTripPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/trips/new");
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { currentDraft, setCurrentDraft } = useTripsStore();
  const [tripMode, setTripMode] = useState<TripMode>('select');

  const urlParams = new URLSearchParams(window.location.search);
  const draftId = urlParams.get("draftId");
  const tripId = urlParams.get("tripId");
  const returnTo = urlParams.get("returnTo");
  const selectedDate = urlParams.get('date') || '';
  const modeParam = urlParams.get('mode');

  useEffect(() => {
    if (modeParam === 'quick') setTripMode('quick');
    else if (modeParam === 'detailed' || draftId || tripId) setTripMode('detailed');
  }, [modeParam, draftId, tripId]);

  const handleSuccessNavigation = (createdTripId: string) => {
    setCurrentDraft(null);
    toast({
      title: "Trip Posted Successfully!",
      description: "Your trip is now live and visible to other travelers.",
      variant: "default",
    });
    setLocation(`/trips/${createdTripId}`);
  };

  const { data: existingDraft, isLoading: draftLoading } = useQuery({
    queryKey: ["/api/trips/draft", draftId],
    enabled: !!draftId,
  });

  const { data: existingTrip, isLoading: tripLoading } = useQuery({
    queryKey: ["/api/trips", tripId],
    enabled: !!tripId,
  });

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

  if (!isAuthenticated) {
    return null;
  }

  const initialData: Partial<TripFormData> = {
    ...(existingDraft || existingTrip || {}),
    ...(selectedDate && { date: selectedDate })
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
              <div className="hidden md:flex items-center gap-3">
                {tripMode !== 'select' && (
                  <button
                    onClick={() => setTripMode('select')}
                    className="bg-white/20 text-white hover:bg-white/30 border border-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  >
                    Change Type
                  </button>
                )}
                <BackLink 
                  to={returnTo ? decodeURIComponent(returnTo) : createBackToTripsLink()}
                  label="Back to Browse"
                  className="bg-white/20 text-white hover:bg-white/30 hover:text-white border-white/30"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6 md:hidden">
          <BackLink 
            to={returnTo ? decodeURIComponent(returnTo) : createBackToTripsLink()}
            label="Back to Browse"
            className="mb-4"
          />
        </div>

        {tripMode === 'select' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <button
              onClick={() => setTripMode('quick')}
              className="group text-left"
            >
              <Card className="h-full border-2 border-transparent hover:border-orange-400 transition-all duration-200 hover:shadow-lg cursor-pointer">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                      <Zap className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Quick Trip</h3>
                      <Badge className="bg-orange-100 text-orange-700 text-xs">3 Simple Steps</Badge>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Post a trip in under a minute. Perfect for last-minute plans and spontaneous adventures.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                      Quick 3-step posting
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                      Auto-deletes after 3 days
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                      Essential info only
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </button>

            <button
              onClick={() => setTripMode('detailed')}
              className="group text-left"
            >
              <Card className="h-full border-2 border-transparent hover:border-blue-400 transition-all duration-200 hover:shadow-lg cursor-pointer">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <ClipboardList className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Detailed Trip</h3>
                      <Badge className="bg-blue-100 text-blue-700 text-xs">Full Feature</Badge>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Create a comprehensive trip listing with photos, pricing, safety info, and more.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      7-step guided wizard
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      Stays until you remove it
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      Photos, pricing & safety details
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </button>
          </div>
        )}

        {tripMode === 'quick' && (
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-[300px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading quick trip form...</p>
                  </div>
                </div>
              }>
                <QuickTripWizard />
              </Suspense>
            </CardContent>
          </Card>
        )}

        {tripMode === 'detailed' && (
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ceylon-blue mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading trip wizard...</p>
                  </div>
                </div>
              }>
                <PostTripWizard
                  draftId={draftId || undefined}
                  initialData={initialData}
                />
              </Suspense>
            </CardContent>
          </Card>
        )}

        {tripMode !== 'select' && (
          <div className="mt-16 mb-8">
            <div className="max-w-4xl mx-auto">
              <TipsBox
                title="✨ Tips for Creating Amazing Trips"
                tips={[
                  "Write a <strong>clear, detailed description</strong> to attract the right travelers",
                  "Include <strong>pickup/meetup locations</strong> and any special requirements", 
                  "Be upfront about <strong>costs and what's included</strong> in your trip",
                  "Set realistic <strong>group sizes</strong> - smaller groups often work better",
                ]}
              />
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}
