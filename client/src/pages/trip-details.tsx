import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { MapPin, Calendar, Users, DollarSign, Phone, MessageCircle, Star, Flag, ArrowLeft, Lock } from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { TripWithOrganizer, CommentWithUser } from "@shared/schema";

interface TripDetailsProps {
  params: { id: string };
}

export default function TripDetails({ params }: TripDetailsProps) {
  const { id } = params;
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

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

  const joinTripMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/trips/${id}/join`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your request to join this trip has been sent!",
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
        description: "Failed to join trip. Please try again.",
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

  const handleJoinTrip = () => {
    if (!isAuthenticated) {
      window.location.href = "/auth/signin";
      return;
    }
    joinTripMutation.mutate();
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
    reportTripMutation.mutate("inappropriate_content");
  };

  const handleContact = () => {
    if (!trip || !isAuthenticated) return;
    if (trip.contactInfo.includes("@")) {
      window.open(`mailto:${trip.contactInfo}`, "_blank");
    } else {
      window.open(`https://wa.me/${trip.contactInfo.replace(/\D/g, "")}`, "_blank");
    }
  };

  if (tripLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">Loading trip details...</div>
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
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Trip Not Found</h2>
            <p className="text-gray-600 mb-4">The trip you're looking for doesn't exist or has been removed.</p>
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

                <div className="flex gap-2">
                  <Button 
                    onClick={isAuthenticated ? handleContact : () => window.location.href = '/auth/signin'}
                    className={`flex-1 ${
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
                  
                  {isAuthenticated && user && trip && user.id !== trip.organizerId && (
                    <>
                      {trip.status === "active" ? (
                        <Button 
                          onClick={handleJoinTrip}
                          disabled={joinTripMutation.isPending}
                          className="flex-1 bg-ceylon-blue hover:bg-ceylon-blue/90"
                          data-testid="button-join"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          {joinTripMutation.isPending ? "Joining..." : "Join Trip"}
                        </Button>
                      ) : (
                        <Button 
                          disabled
                          className="flex-1 bg-gray-400 cursor-not-allowed"
                          data-testid="button-trip-unavailable"
                        >
                          Trip Completed
                        </Button>
                      )}
                    </>
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

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Comments & Questions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-800">
                          {comment.user.firstName} {comment.user.lastName}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.createdAt!).toLocaleDateString()}
                        </span>
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
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}
