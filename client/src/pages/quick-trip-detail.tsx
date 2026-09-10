import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
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
import { QuickTripEditDialog } from "@/components/QuickTripEditDialog";
import { MapPin, Calendar, Clock, Users, Zap, Heart, Send, CheckCircle2, X, Check, MessageCircle, BellRing, DollarSign, Trash2, Pencil } from "lucide-react";

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
  const [, setLocation] = useLocation();
  const tripId = params?.id;
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [interestMessage, setInterestMessage] = useState("");
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const interestsSectionRef = useRef<HTMLDivElement>(null);

  const { data: trip, isLoading, error } = useQuery<any>({
    queryKey: ["/api/quick-trips", tripId],
    enabled: !!tripId,
  });

  const { data: existingInterest } = useQuery<any>({
    queryKey: ["/api/quick-trips", tripId, "interest-request"],
    queryFn: async () => {
      if (!isAuthenticated || !user) return null;
      const response = await fetch(`/api/quick-trips/${tripId}/interest-request`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("Failed to fetch interest");
      return response.json();
    },
    enabled: !!isAuthenticated && !!user && !!tripId,
  });

  const isOrganizer = isAuthenticated && !!trip && user?.id === trip?.organizerId;

  const { data: interestRequests, isLoading: isLoadingRequests } = useQuery<any[]>({
    queryKey: ["/api/quick-trips", tripId, "interest-requests"],
    queryFn: async () => {
      const response = await fetch(`/api/quick-trips/${tripId}/interest-requests`);
      if (response.status === 403 || response.status === 404) return [];
      if (!response.ok) throw new Error("Failed to fetch requests");
      return response.json();
    },
    enabled: !!isAuthenticated && !!user && !!tripId && isOrganizer,
  });

  const showOrganizerSection = isOrganizer;

  const hoursLeft = useCountdownHours(trip?.expiresAt);

  useEffect(() => {
    if (showOrganizerSection && !isLoadingRequests && window.location.hash === '#interests') {
      setTimeout(() => {
        interestsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [isOrganizer, isLoadingRequests]);

  const sendInterestMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/quick-trips/${tripId}/interest`, {
        message: interestMessage || undefined,
      });
    },
    onSuccess: () => {
      setShowMessageInput(false);
      setInterestMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/quick-trips", tripId, "interest-request"] });
      toast({
        title: "Interest Sent!",
        description: "The trip organizer has been notified. They'll reach out to you soon!",
      });
    },
    onError: (error: any) => {
      if (error?.status === 409) {
        queryClient.invalidateQueries({ queryKey: ["/api/quick-trips", tripId, "interest-request"] });
        toast({ title: "Already Interested", description: "You've already shown interest in this trip." });
      } else {
        toast({ title: "Error", description: error.message || "Failed to send interest", variant: "destructive" });
      }
    },
  });

  const deleteTripMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/quick-trips/${tripId}`);
    },
    onSuccess: () => {
      toast({ title: "Trip Deleted", description: "Your quick trip has been removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/user/quick-trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      setLocation("/browse-trips");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete trip", variant: "destructive" });
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: string }) => {
      return await apiRequest("PUT", `/api/quick-trip-interest-requests/${requestId}`, { status });
    },
    onSuccess: async (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quick-trips", tripId, "interest-requests"] });
      const data = await response.json();
      if (data.chatThreadId) {
        toast({
          title: "Request Accepted!",
          description: "A chat has been opened. You can now message the traveler.",
        });
        setLocation(`/chat-buddy/${data.chatThreadId}`);
      } else {
        toast({ title: "Request Updated", description: "The request has been updated." });
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update request", variant: "destructive" });
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

  const hasExistingInterest = !!existingInterest;
  const interestStatus = existingInterest?.status;
  const safeRequests = interestRequests || [];
  const pendingRequests = safeRequests.filter((r: any) => r.status === 'pending');
  const acceptedRequests = safeRequests.filter((r: any) => r.status === 'accepted');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <BackLink to="/trips" label="Back to Browse" className="mb-6" />

        {/* ORGANIZER: Interest Requests Section - Shown FIRST at the top */}
        {showOrganizerSection && (
          <div ref={interestsSectionRef} id="interests" className="mb-6">
            <Card className="shadow-lg border-2 border-orange-300 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 text-white">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <BellRing className="w-5 h-5" />
                  Interest Requests for Your Trip
                  {pendingRequests.length > 0 && (
                    <Badge className="bg-white text-orange-600 ml-2">{pendingRequests.length} new</Badge>
                  )}
                </h2>
                <p className="text-sm text-orange-100 mt-1">People who want to join "{trip.title}"</p>
              </div>
              <CardContent className="p-5 space-y-4">
                {isLoadingRequests ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mr-3"></div>
                    <p className="text-gray-500">Loading interest requests...</p>
                  </div>
                ) : pendingRequests.length === 0 && acceptedRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No interest requests yet</p>
                    <p className="text-sm text-gray-400 mt-1">Share your trip to find travel companions!</p>
                  </div>
                ) : (
                  <>
                    {pendingRequests.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-orange-700 uppercase tracking-wide">
                          Pending Requests ({pendingRequests.length})
                        </h3>
                        {pendingRequests.map((request: any) => (
                          <Card key={request.id} className="border-2 border-orange-200 bg-orange-50/70 shadow-sm">
                            <CardContent className="p-4">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => {
                                      setLocation(`/profile/${request.user?.username || request.user?.id}`);
                                    }}
                                  >
                                    <UserDisplay user={request.user} avatarSize="md" />
                                  </div>
                                </div>
                                {request.message && (
                                  <div className="bg-white rounded-lg p-3 border border-orange-100 w-full sm:w-auto sm:max-w-[250px]">
                                    <p className="text-sm text-gray-600 italic">"{request.message}"</p>
                                  </div>
                                )}
                                <div className="flex gap-2 sm:ml-auto flex-shrink-0">
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
                                    disabled={updateRequestMutation.isPending}
                                    onClick={() => updateRequestMutation.mutate({ requestId: request.id, status: 'accepted' })}
                                  >
                                    <Check className="w-4 h-4 mr-1" /> Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-300 text-red-600 hover:bg-red-50 flex-1 sm:flex-none"
                                    disabled={updateRequestMutation.isPending}
                                    onClick={() => updateRequestMutation.mutate({ requestId: request.id, status: 'rejected' })}
                                  >
                                    <X className="w-4 h-4 mr-1" /> Decline
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {acceptedRequests.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                          Accepted ({acceptedRequests.length})
                        </h3>
                        {acceptedRequests.map((request: any) => (
                          <Card key={request.id} className="border border-green-200 bg-green-50/50">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => {
                                      setLocation(`/profile/${request.user?.username || request.user?.id}`);
                                    }}
                                  >
                                    <UserDisplay user={request.user} avatarSize="md" />
                                  </div>
                                  <Badge className="bg-green-100 text-green-700 border-green-300">Accepted</Badge>
                                </div>
                                {request.chatThreadId && (
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => { setLocation(`/chat-buddy/${request.chatThreadId}`); }}
                                  >
                                    <MessageCircle className="w-4 h-4 mr-1" /> Chat
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
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
                    {trip.date ? (() => {
                      const d = new Date(trip.date);
                      return !isNaN(d.getTime()) ? d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : trip.date;
                    })() : "TBD"}
                    {" "}{trip.time && (() => {
                      const t = new Date(`2000-01-01T${trip.time}`);
                      return !isNaN(t.getTime()) ? t.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : trip.time;
                    })()}
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
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Pricing</p>
                  {trip.isFree === false && trip.seatPrice ? (
                    <p className="font-medium text-orange-600">LKR {Number(trip.seatPrice).toLocaleString()} / seat</p>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 border-green-300">Free</Badge>
                  )}
                </div>
              </div>
            </div>

            {trip.organizer && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">Posted by</h3>
                <div
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    setLocation(`/profile/${trip.organizer?.username || trip.organizer?.id}`);
                  }}
                >
                  <UserDisplay user={trip.organizer} avatarSize="lg" />
                </div>
              </div>
            )}

            {/* ORGANIZER: manage this trip */}
            {isOrganizer && (
              <div className="border-t pt-6 flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => setShowEditDialog(true)} data-testid="button-edit-quick-trip">
                  <Pencil className="w-4 h-4 mr-2" /> Edit Trip
                </Button>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  disabled={deleteTripMutation.isPending}
                  onClick={() => {
                    if (window.confirm("Delete this quick trip? This can't be undone.")) {
                      deleteTripMutation.mutate();
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteTripMutation.isPending ? "Deleting..." : "Delete Trip"}
                </Button>
              </div>
            )}

            {/* Interest section for non-organizers */}
            {!isOrganizer && (
              <div className="border-t pt-6">
                {hasExistingInterest && interestStatus === 'accepted' ? (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-green-800">Interest Accepted!</p>
                      <p className="text-sm text-green-600">The organizer accepted your request. You can now chat with them.</p>
                    </div>
                    {existingInterest?.chatThreadId && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => { setLocation(`/chat-buddy/${existingInterest.chatThreadId}`); }}
                      >
                        <MessageCircle className="w-4 h-4 mr-1" /> Open Chat
                      </Button>
                    )}
                  </div>
                ) : hasExistingInterest && interestStatus === 'pending' ? (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <Clock className="w-6 h-6 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-amber-800">Interest Sent</p>
                      <p className="text-sm text-amber-600">Waiting for the organizer to respond to your request.</p>
                    </div>
                  </div>
                ) : hasExistingInterest && interestStatus === 'rejected' ? (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <X className="w-6 h-6 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-700">Request Not Accepted</p>
                      <p className="text-sm text-gray-500">The organizer did not accept your request for this trip.</p>
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
        {isOrganizer && (
          <QuickTripEditDialog open={showEditDialog} onOpenChange={setShowEditDialog} trip={trip} />
        )}
      </div>
      
      <Footer />
    </div>
  );
}
