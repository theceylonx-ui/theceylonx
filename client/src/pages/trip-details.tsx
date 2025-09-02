import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { MapPin, Calendar, Users, DollarSign, Phone, MessageCircle, Star, Flag, ArrowLeft, Lock, Trash2, Heart } from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTrackInteraction } from "@/hooks/useRecommendations";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { TripWithOrganizer, CommentWithUser, TripInterestRequest } from "@shared/schema";

interface TripDetailsProps {
  params: { id: string };
}

export default function TripDetails({ params }: TripDetailsProps) {
  const { id } = params;
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const { mutate: trackInteraction } = useTrackInteraction();
  const [, setLocation] = useLocation();
  
  // Get tab from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const activeTab = urlParams.get('tab') || 'details';

  // Track trip view when component mounts and user is authenticated
  useEffect(() => {
    if (user && id) {
      trackInteraction({
        tripId: id,
        interactionType: 'view',
        duration: 1, // Basic view tracking
      });
    }
  }, [user, id, trackInteraction]);

  const { data: trip, isLoading: tripLoading } = useQuery<TripWithOrganizer>({
    queryKey: ["/api/trips", id],
    queryFn: async () => {
      const response = await fetch(`/api/trips/${id}`);
      if (!response.ok) throw new Error("Failed to fetch trip");
      return response.json();
    },
  });

  const { data: comments } = useQuery<CommentWithUser[]>({
    queryKey: ["/api/trips", id, "comments"],
    queryFn: async () => {
      const response = await fetch(`/api/trips/${id}/comments`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
  });

  // Check if user has already sent an interest request for this trip
  const { data: existingInterestRequest } = useQuery<TripInterestRequest | null>({
    queryKey: ["/api/trips", id, "interest-request"],
    queryFn: async () => {
      if (!isAuthenticated || !user) return null;
      const response = await fetch(`/api/trips/${id}/interest-request`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("Failed to fetch interest request");
      return response.json();
    },
    enabled: !!isAuthenticated && !!user && !!id,
  });

  // Debug logging for button state - moved after data declarations
  useEffect(() => {
    console.log("Trip Details Debug:", {
      isAuthenticated,
      userId: user?.id,
      tripOrganizerId: trip?.organizerId,
      userIsOrganizer: user?.id === trip?.organizerId,
      existingInterestRequest: !!existingInterestRequest
    });
  }, [isAuthenticated, user, trip, existingInterestRequest]);

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return await apiRequest("DELETE", `/api/comments/${commentId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", id, "comments"] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/trips/${id}/comments`, { content });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Comment added successfully!",
      });
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/trips", id, "comments"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const reportTripMutation = useMutation({
    mutationFn: async (reason: string) => {
      return await apiRequest("POST", "/api/reports", {
        tripId: id,
        reason,
        description: "Reported from trip details page",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Trip reported. Thank you for helping keep our community safe.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to report trip. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Interest request mutation
  const sendInterestMutation = useMutation({
    mutationFn: async (message: string = "") => {
      return await apiRequest("POST", `/api/trips/${id}/interest`, { message });
    },
    onSuccess: () => {
      toast({
        title: "Interest Sent!",
        description: "Your interest has been sent to the trip organizer. They will review and respond soon.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", id, "interest-request"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to send interest. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTabChange = (newTab: string) => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', newTab);
    window.history.pushState({}, '', newUrl.toString());
  };

  const canDeleteComment = (comment: CommentWithUser) => {
    if (!user) return false;
    // User can delete their own comment or trip owner can delete any comment
    return comment.userId === user.id || (trip && trip.organizerId === user.id);
  };

  const handleDeleteComment = (commentId: string) => {
    deleteCommentMutation.mutate(commentId);
  };

  const handleAddComment = () => {
    if (!isAuthenticated) {
      window.location.href = "/auth/signin";
      return;
    }
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  const handleReport = () => {
    if (!isAuthenticated) {
      window.location.href = "/auth/signin";
      return;
    }
    // Navigate to dedicated report page
    window.location.href = `/report-trip/${id}`;
  };

  const handleContact = () => {
    if (!trip || !isAuthenticated) return;
    if (trip.contactInfo.includes("@")) {
      window.open(`mailto:${trip.contactInfo}`, "_blank");
    } else {
      // Normalize phone number for WhatsApp
      let phoneNumber = trip.contactInfo.replace(/\D/g, "");
      
      // If number starts with 0, it's likely a local number
      if (phoneNumber.startsWith('0')) {
        // For Sri Lankan numbers (typical length after removing 0 is 9)
        if (phoneNumber.length === 10) {
          phoneNumber = '94' + phoneNumber.substring(1);
        }
        // For other countries, user should include country code manually
        // We'll just remove the leading 0 and let them specify
        else {
          phoneNumber = phoneNumber.substring(1);
        }
      }
      
      // If number is very short (less than 10 digits), likely missing country code
      // But we won't assume - user should provide complete international number
      
      console.log(`Opening WhatsApp for number: ${phoneNumber}`);
      window.open(`https://wa.me/${phoneNumber}`, "_blank");
    }
  };

  const handleSendInterest = () => {
    if (!isAuthenticated) {
      window.location.href = "/auth/signin";
      return;
    }
    if (existingInterestRequest) {
      // Already sent request
      return;
    }
    sendInterestMutation.mutate("I'm interested in joining this trip!");
  };

  // Emergency debugging - render something no matter what
  console.log("TripDetails render:", { tripLoading, trip: !!trip, id });

  if (tripLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-500">LOADING TRIP DETAILS...</h1>
            <p className="text-xl">Trip ID: {id}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-500 mb-4">TRIP NOT FOUND!</h1>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Trip Not Found</h2>
            <p className="text-gray-600 mb-4">The trip you're looking for doesn't exist or has been removed.</p>
            <p className="text-sm text-gray-500">Trip ID: {id}</p>
            <Link href="/browse">
              <Button className="bg-ceylon-green hover:bg-ceylon-green/90">Browse Other Trips</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Emergency visibility test */}
      <div className="bg-red-500 text-white p-4 text-center text-2xl font-bold">
        🚨 TRIP DETAILS PAGE IS RENDERING! 🚨
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href="/browse">
          <Button variant="outline" className="mb-6" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Button>
        </Link>

        {/* Trip Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-800" data-testid="trip-title">
                    {trip.title}
                  </h1>
                  <Badge 
                    variant={trip.status === "active" ? "default" : "secondary"}
                    className={trip.status === "active" ? "bg-ceylon-green" : "bg-gray-500"}
                    data-testid="trip-status-badge"
                  >
                    {trip.status === "active" ? "Open" : "Completed"}
                  </Badge>
                </div>
                <Badge variant="outline" className="text-ceylon-green border-ceylon-green" data-testid="trip-region">
                  {trip.region}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReport}
                  disabled={reportTripMutation.isPending}
                  data-testid="button-report"
                >
                  <Flag className="h-4 w-4 mr-1" />
                  Report
                </Button>
              </div>
            </div>

            {/* Trip Details Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3" data-testid="trip-route">
                  <MapPin className="text-ceylon-blue h-5 w-5" />
                  <span className="text-gray-700">
                    {trip.fromLocation} → {trip.toLocation}
                  </span>
                </div>
                
                <div className="flex items-center space-x-3" data-testid="trip-datetime">
                  <Calendar className="text-ceylon-blue h-5 w-5" />
                  <span className="text-gray-700">
                    {new Date(trip.date).toLocaleDateString()} • {trip.time}
                  </span>
                </div>
                
                <div className="flex items-center space-x-3" data-testid="trip-seats">
                  <Users className="text-ceylon-blue h-5 w-5" />
                  <span className="text-gray-700">
                    {trip.seatsAvailable} seats available
                  </span>
                </div>
                
                <div className="flex items-center space-x-3" data-testid="trip-price">
                  <DollarSign className="text-ceylon-blue h-5 w-5" />
                  <span className="text-gray-700 font-semibold text-ceylon-green">
                    LKR {trip.price}/person
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Trip Organizer</h3>
                <div className="flex items-center space-x-3 mb-4" data-testid="trip-organizer">
                  <Avatar>
                    <AvatarImage src={trip.organizer.profileImageUrl || ""} />
                    <AvatarFallback>
                      {trip.organizer.firstName?.[0]}{trip.organizer.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-800">
                      {trip.organizer.firstName} {trip.organizer.lastName}
                    </p>
                    {isAuthenticated ? (
                      <p className="text-sm text-gray-600">{trip.organizer.email}</p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Sign in to view contact details</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Button 
                    onClick={isAuthenticated ? handleContact : () => window.location.href = '/auth/signin'}
                    className={`w-full ${
                      isAuthenticated 
                        ? 'bg-ceylon-green hover:bg-ceylon-green/90' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                    data-testid="button-contact"
                  >
                    {isAuthenticated ? (
                      <>
                        <Phone className="h-4 w-4 mr-2" />
                        Contact
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Sign in to Contact
                      </>
                    )}
                  </Button>

                  {/* 🚨 COMPLETELY NEW SYSTEM - JOIN BUTTON REMOVED FOREVER 🚨 */}
                  <div className="w-full p-6 bg-gradient-to-r from-pink-100 to-blue-100 border-4 border-dashed border-pink-500 rounded-xl text-center shadow-xl">
                    <div className="bg-yellow-300 text-black p-2 rounded-lg mb-4 font-black text-xl animate-pulse">
                      🔥 NO MORE "JOIN THIS TRIP" BUTTON! 🔥
                    </div>
                    <p className="text-purple-800 font-bold text-2xl mb-4">✨ INTEREST REQUEST SYSTEM ✨</p>
                    {isAuthenticated ? (
                      user && user.id !== trip.organizerId ? (
                        <Button 
                          onClick={handleSendInterest}
                          disabled={!!existingInterestRequest || sendInterestMutation.isPending}
                          className={`w-full text-xl py-4 ${
                            existingInterestRequest 
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black cursor-not-allowed'
                              : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg transform hover:scale-105'
                          }`}
                          data-testid="button-interest"
                        >
                          {sendInterestMutation.isPending ? (
                            <>
                              <div className="animate-spin h-6 w-6 mr-3 border-4 border-white border-t-transparent rounded-full" />
                              SENDING INTEREST REQUEST...
                            </>
                          ) : existingInterestRequest ? (
                            <>
                              <Heart className="h-6 w-6 mr-3 fill-current" />
                              {existingInterestRequest.status === 'pending' && '⏳ INTEREST REQUEST PENDING'}
                              {existingInterestRequest.status === 'accepted' && '✅ INTEREST REQUEST ACCEPTED!'}
                              {existingInterestRequest.status === 'rejected' && '❌ INTEREST REQUEST DECLINED'}
                            </>
                          ) : (
                            <>
                              <Heart className="h-6 w-6 mr-3" />
                              💖 SEND INTEREST REQUEST (NOT JOIN!)
                            </>
                          )}
                        </Button>
                      ) : user?.id === trip.organizerId ? (
                        <div className="w-full text-center text-lg text-blue-800 p-4 bg-gradient-to-r from-blue-100 to-green-100 rounded-lg border-2 border-blue-400">
                          👑 YOU ARE THE TRIP ORGANIZER
                        </div>
                      ) : null
                    ) : (
                      <Button 
                        onClick={() => window.location.href = '/auth/signin'}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-xl py-4 shadow-lg transform hover:scale-105"
                        data-testid="button-signin-interest"
                      >
                        <Heart className="h-6 w-6 mr-3" />
                        🔐 SIGN IN TO SEND INTEREST REQUEST
                      </Button>
                    )}
                  </div>

                  {/* Show status message for existing requests */}
                  {existingInterestRequest && (
                    <div className={`text-sm text-center p-2 rounded-md ${
                      existingInterestRequest.status === 'accepted' 
                        ? 'bg-green-100 text-green-800'
                        : existingInterestRequest.status === 'rejected'
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`} data-testid="interest-status">
                      {existingInterestRequest.status === 'pending' && 'Your interest request is pending review by the organizer.'}
                      {existingInterestRequest.status === 'accepted' && 'Great! Your interest has been accepted. You can now chat with the organizer.'}
                      {existingInterestRequest.status === 'rejected' && 'Your interest request was not accepted for this trip.'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Trip Notes */}
            {trip.notes && (
              <div className="mt-6" data-testid="trip-notes">
                <h3 className="font-semibold text-gray-800 mb-2">Trip Details</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{trip.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabbed Interface for Comments */}
        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <div className="px-6 py-4 border-b">
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="details">Comments & Questions</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="details" className="px-6 py-4">
                {/* Add Comment */}
                {isAuthenticated && (
                  <div className="mb-6" data-testid="comment-form">
                    <Textarea
                      placeholder="Ask a question or leave a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="mb-3"
                      data-testid="textarea-comment"
                    />
                    <Button 
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || addCommentMutation.isPending}
                      className="bg-ceylon-green hover:bg-ceylon-green/90"
                      data-testid="button-add-comment"
                    >
                      {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
                    </Button>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                  {comments && comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex space-x-3 p-4 bg-gray-50 rounded-lg" data-testid={`comment-${comment.id}`}>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.user.profileImageUrl || ""} />
                          <AvatarFallback>
                            {comment.user.firstName?.[0]}{comment.user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-800">
                                {comment.user.firstName} {comment.user.lastName}
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(comment.createdAt!).toLocaleDateString()}
                              </span>
                            </div>
                            {canDeleteComment(comment) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteComment(comment.id)}
                                disabled={deleteCommentMutation.isPending}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                data-testid={`button-delete-comment-${comment.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-600" data-testid="empty-comments">
                      No comments yet. Be the first to ask a question!
                    </div>
                  )}
                </div>
              </TabsContent>

            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}
