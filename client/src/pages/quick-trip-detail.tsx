import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { BackLink } from "@/components/common/BackLink";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserDisplay } from "@/components/ui/user-display";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Calendar, Clock, Users, Zap, Heart, Send, CheckCircle2 } from "lucide-react";

function useCountdownHours(expiresAt: string | Date | null | undefined): number | null {
  const [hoursLeft, setHoursLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!expiresAt) { setHoursLeft(null); return; }
    const calc = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
    };
    setHoursLeft(calc());
    const interval = setInterval(() => setHoursLeft(calc()), 60 * 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);
  return hoursLeft;
}

export default function QuickTripDetailPage() {
  const [, params] = useRoute("/quick-trips/:id");
  const tripId = params?.id;
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [interestMessage, setInterestMessage] = useState("");
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [interestSent, setInterestSent] = useState(false);

  const { data: trip, isLoading, error } = useQuery<any>({
    queryKey: ["/api/quick-trips", tripId],
    enabled: !!tripId,
  });

  const hoursLeft = useCountdownHours(trip?.expiresAt);

  const sendInterestMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/quick-trips/${tripId}/interest`, {
        message: interestMessage || undefined,
      });
    },
    onSuccess: () => {
      setInterestSent(true);
      setShowMessageInput(false);
      toast({
        title: "Interest Sent!",
        description: "The trip organizer has been notified. They'll reach out to you soon!",
      });
    },
    onError: (error: any) => {
      const msg = error?.message || "Failed to send interest";
      toast({
        title: "Could not send interest",
        description: msg,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Quick Trip Not Found</h1>
          <p className="text-gray-600 mb-6">This quick trip may have expired or been removed.</p>
          <BackLink to="/trips" label="Back to Browse" />
        </div>
        <Footer />
      </div>
    );
  }

  const CATEGORIES: Record<string, string> = {
    roadtrip: "Road Trip", hiking: "Hiking", beach: "Beach", culture: "Cultural",
    wellness: "Wellness", festival: "Festival", workshop: "Workshop", wildlife: "Wildlife",
    food: "Food & Culinary", adventure_sport: "Adventure Sports",
  };

  const isOrganizer = isAuthenticated && user?.id === trip.organizerId;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <BackLink to="/trips" label="Back to Browse" className="mb-6" />
        
        <Card className="shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-white/20 text-white border-0">
                <Zap className="w-3 h-3 mr-1" /> Quick Trip
              </Badge>
              {hoursLeft !== null && (
                <Badge className="bg-white/20 text-white border-0">
                  <Clock className="w-3 h-3 mr-1" />
                  {hoursLeft > 0 ? `Expires in ${hoursLeft}h` : 'Expiring soon'}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">{trip.title}</h1>
          </div>

          <CardContent className="p-6 space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-700 font-medium mb-1">
                <Zap className="w-4 h-4" />
                Quick Trip - Auto-deletes after 3 days
              </div>
              <p className="text-sm text-orange-600">
                {hoursLeft !== null && hoursLeft > 0 
                  ? `This trip listing will be automatically removed in ${hoursLeft} hours.`
                  : 'This trip listing is about to expire.'}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{trip.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Route</p>
                  <p className="font-medium text-gray-800">{trip.fromLocation} → {trip.toLocation}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Date & Time</p>
                  <p className="font-medium text-gray-800">
                    {trip.date ? new Date(trip.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "TBD"}
                    {" "}{trip.time && new Date(`2000-01-01T${trip.time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Users className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Seats Available</p>
                  <p className="font-medium text-gray-800">{trip.seatsAvailable} seats</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Zap className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Category</p>
                  <Badge variant="secondary">{CATEGORIES[trip.category] || trip.category}</Badge>
                </div>
              </div>
            </div>

            {trip.organizer && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">Posted by</h3>
                <div
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    window.location.href = `/profile/${trip.organizer?.username || trip.organizer?.id}`;
                  }}
                >
                  <UserDisplay user={trip.organizer} avatarSize="lg" />
                </div>
              </div>
            )}

            {!isOrganizer && (
              <div className="border-t pt-6">
                {interestSent ? (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800">Interest Sent!</p>
                      <p className="text-sm text-green-600">The trip organizer has been notified and will reach out to you.</p>
                    </div>
                  </div>
                ) : !isAuthenticated ? (
                  <div className="text-center p-4 bg-gray-100 rounded-lg">
                    <p className="text-gray-600 mb-3">Sign in to show your interest in this trip</p>
                    <Button
                      onClick={() => { window.location.href = "/auth/signin"; }}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      Sign In to Join
                    </Button>
                  </div>
                ) : showMessageInput ? (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Add a message for the organizer (optional) - e.g., 'I'd love to join! I'm an experienced hiker.'"
                      value={interestMessage}
                      onChange={(e) => setInterestMessage(e.target.value)}
                      className="resize-none"
                      rows={3}
                      maxLength={300}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => sendInterestMutation.mutate()}
                        disabled={sendInterestMutation.isPending}
                        className="bg-orange-500 hover:bg-orange-600 flex-1"
                      >
                        {sendInterestMutation.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Send Interest
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => { setShowMessageInput(false); setInterestMessage(""); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowMessageInput(true)}
                    className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white py-6 text-lg"
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    I'm Interested - Notify Organizer
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}
