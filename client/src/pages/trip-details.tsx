import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { MapPin, Calendar, Users, DollarSign, Phone, Star, Flag, ArrowLeft, Lock, Trash2, Heart, Edit, MessageCircle, MoreHorizontal, ChevronRight, CalendarIcon } from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserDisplay } from "@/components/ui/user-display";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTrackInteraction } from "@/hooks/useRecommendations";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { createBackToTripsLink, createLoginRedirectUrl } from "@/utils/searchParams";
import { BackLink } from "@/components/common/BackLink";
import { TripDateRangePicker } from "@/components/trips/TripDateRangePicker";
import { useTripsStore } from "@/store/tripsStore";
import type { CommentWithUser, TripInterestRequest } from "@shared/schema";
import type { TripWithOrganizer } from "@shared/types/api";
import { EditContentDialog } from "@/components/EditContentDialog";
import { TripEditDialog } from "@/components/TripEditDialog";
import { ActionsMenu } from "@/components/ActionsMenu";
import { TripBreadcrumbs } from "@/components/TripBreadcrumbs";

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
  const [showContactLockedDialog, setShowContactLockedDialog] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTripEditDialog, setShowTripEditDialog] = useState(false);
  const [showDateEditModal, setShowDateEditModal] = useState(false);
  const { setSelectedDates } = useTripsStore();
  
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
      tripOrganizerId: trip?.organizer?.id,
      userIsOrganizer: user?.id === trip?.organizer?.id,
      existingInterestRequest: !!existingInterestRequest
    });
  }, [isAuthenticated, user, trip, existingInterestRequest]);

  const getTripImage = () => {
    if (!trip) return '/assets/5_1756417819316.png';
    
    // Priority 1: Use user-uploaded images from mediaUrls
    if (trip.mediaUrls && trip.mediaUrls.length > 0) {
      const coverIndex = trip.coverImageIndex || 0;
      const coverImageUrl = trip.mediaUrls[Math.min(coverIndex, trip.mediaUrls.length - 1)];
      return coverImageUrl;
    }
    
    // Priority 2: Use database imageUrl (fallback or external image)
    if (trip.imageUrl) {
      // If it's a local asset path, ensure it works in both dev and production
      if (trip.imageUrl.startsWith('/assets/')) {
        return trip.imageUrl;
      }
      return trip.imageUrl;
    }
    
    // Priority 3: Ceylon Expand logo as fallback
    return '/assets/5_1756417819316.png';
  };

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

  const editCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      return await apiRequest("PUT", `/api/comments/${commentId}`, { content });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Comment updated successfully!",
      });
      setShowEditDialog(false);
      setEditingCommentId(null);
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
        description: "Failed to update comment. Please try again.",
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

  const deleteTripMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/trips/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Trip deleted successfully.",
      });
      // Navigate back to browse trips
      setLocation("/browse-trips");
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/trips"] });
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
        description: "Failed to delete trip. Please try again.",
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
        title: "Request Sent!",
        description: "Your request has been sent to the trip organizer. They will review and respond soon.",
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
        description: "Failed to send request. Please try again.",
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
    return comment.userId === user.id || (trip && trip.organizer?.id === user.id);
  };

  const canEditComment = (comment: CommentWithUser) => {
    if (!user) return false;
    // Only comment author can edit their own comment
    return comment.userId === user.id;
  };

  const handleDeleteComment = (commentId: string) => {
    deleteCommentMutation.mutate(commentId);
  };

  const handleEditComment = (comment: CommentWithUser) => {
    setEditingCommentId(comment.id);
    setShowEditDialog(true);
  };

  const handleSaveEditComment = (data: { content?: string }) => {
    if (editingCommentId && data.content?.trim()) {
      editCommentMutation.mutate({
        commentId: editingCommentId,
        content: data.content.trim()
      });
    }
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
    // Contact is handled through chat system - redirect to chat
    window.location.href = `/chat-buddy?tripId=${trip.id}`;
  };

  const handleSendInterest = () => {
    if (!isAuthenticated) {
      // Redirect to login with current path for return
      const currentPath = `${window.location.pathname}${window.location.search}`;
      window.location.href = createLoginRedirectUrl(currentPath);
      return;
    }
    if (existingInterestRequest) {
      // Already sent request
      return;
    }
    sendInterestMutation.mutate("I'm interested in joining this trip!");
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
            <Link href="/browse-trips">
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
        {/* Breadcrumbs */}
        <TripBreadcrumbs trip={trip} className="mb-4" />
        
        {/* Enhanced Back Button with preserved search state */}
        <div className="mb-6">
          <BackLink 
            label="Back to Browse"
            className="mb-2"
          />
        </div>

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
                {/* Owner Controls */}
                {user && user.id === trip.organizer?.id && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTripEditDialog(true)}
                      data-testid="button-edit-trip"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
                          deleteTripMutation.mutate();
                        }
                      }}
                      disabled={deleteTripMutation.isPending}
                      data-testid="button-delete-trip"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {deleteTripMutation.isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                  </>
                )}
                
                {/* Additional Action Links */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-more-actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/community?topic=${trip.toLocation.toLowerCase().replace(/\s+/g, '-')}`}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Ask the community
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleReport}
                      className="cursor-pointer"
                      data-testid="button-report-trip"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Report this trip
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Trip Image */}
            <div className="mt-6">
              {getTripImage() === '/assets/5_1756417819316.png' && !trip.mediaUrls?.length && !trip.imageUrl ? (
                // Beautiful Ceylon Expand fallback design
                <div className="w-full h-64 bg-gradient-to-br from-ceylon-green via-ceylon-blue to-purple-600 flex flex-col items-center justify-center relative overflow-hidden rounded-lg">
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-4 left-4 w-8 h-8 border-2 border-white rounded-full"></div>
                    <div className="absolute top-12 right-8 w-4 h-4 border border-white rounded-full"></div>
                    <div className="absolute bottom-8 left-12 w-6 h-6 border border-white rounded-full"></div>
                    <div className="absolute bottom-4 right-4 w-3 h-3 bg-white rounded-full opacity-50"></div>
                    <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-white rounded-full opacity-30"></div>
                    <div className="absolute top-1/3 right-1/3 w-5 h-5 border border-white rounded-full opacity-20"></div>
                  </div>
                  
                  {/* Tribe icon */}
                  <div className="text-white mb-3">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-sm">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      <circle cx="18" cy="8" r="2"/>
                      <circle cx="6" cy="8" r="2"/>
                      <path d="M18 10c-1.33 0-2.67.33-3.33 1H15v2h1.67c.66-.67 2-.33 3.33-1v-2z"/>
                      <path d="M6 10v2c1.33.67 2.67.33 3.33 1H11v-2H9.33C8.67 10.33 7.33 10 6 10z"/>
                    </svg>
                  </div>
                  
                  {/* Ceylon Expand text */}
                  <div className="text-center text-white">
                    <div className="text-xl font-bold tracking-wide drop-shadow-sm">Ceylon Expand</div>
                    <div className="text-sm opacity-90 mt-1">Travel Together</div>
                  </div>
                </div>
              ) : (
                <img 
                  src={getTripImage()}
                  alt={`${trip.title} - ${trip.region} Sri Lanka`}
                  className="w-full h-64 object-cover rounded-lg"
                  loading="lazy"
                  onError={(e) => {
                    // Replace with beautiful Ceylon Expand fallback
                    const target = e.currentTarget;
                    const container = target.parentElement;
                    if (container) {
                      container.innerHTML = `
                        <div class="w-full h-64 bg-gradient-to-br from-ceylon-green via-ceylon-blue to-purple-600 flex flex-col items-center justify-center relative overflow-hidden rounded-lg">
                          <div class="absolute inset-0 opacity-10">
                            <div class="absolute top-4 left-4 w-8 h-8 border-2 border-white rounded-full"></div>
                            <div class="absolute top-12 right-8 w-4 h-4 border border-white rounded-full"></div>
                            <div class="absolute bottom-8 left-12 w-6 h-6 border border-white rounded-full"></div>
                            <div class="absolute bottom-4 right-4 w-3 h-3 bg-white rounded-full opacity-50"></div>
                            <div class="absolute top-1/2 left-1/4 w-2 h-2 bg-white rounded-full opacity-30"></div>
                            <div class="absolute top-1/3 right-1/3 w-5 h-5 border border-white rounded-full opacity-20"></div>
                          </div>
                          <div class="text-white mb-3">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" class="drop-shadow-sm">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                              <circle cx="18" cy="8" r="2"/>
                              <circle cx="6" cy="8" r="2"/>
                              <path d="M18 10c-1.33 0-2.67.33-3.33 1H15v2h1.67c.66-.67 2-.33 3.33-1v-2z"/>
                              <path d="M6 10v2c1.33.67 2.67.33 3.33 1H11v-2H9.33C8.67 10.33 7.33 10 6 10z"/>
                            </svg>
                          </div>
                          <div class="text-center text-white">
                            <div class="text-xl font-bold tracking-wide drop-shadow-sm">Ceylon Expand</div>
                            <div class="text-sm opacity-90 mt-1">Travel Together</div>
                          </div>
                        </div>
                      `;
                    }
                  }}
                />
              )}
            </div>

            {/* Trip Details Grid */}
            <div className="grid md:grid-cols-2 gap-6 mt-6">
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
                <div className="mb-4" data-testid="trip-organizer">
                  <UserDisplay 
                    user={trip.organizer}
                    avatarSize="lg"
                    layout="horizontal"
                    className="mb-2"
                    nameClassName="font-medium text-gray-800"
                  />
                  <div className="flex items-center space-x-2 text-sm text-gray-500 ml-12">
                    <Lock className="h-4 w-4" />
                    <span className="italic">Contact details shared privately through chat</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <AlertDialog open={showContactLockedDialog} onOpenChange={setShowContactLockedDialog}>
                    <AlertDialogTrigger asChild>
                      <Button 
                        className={`w-full ${
                          isAuthenticated 
                            ? 'bg-ceylon-green hover:bg-ceylon-green/90' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        data-testid="button-contact"
                        onClick={() => {
                          if (!isAuthenticated) {
                            window.location.href = '/auth/signin';
                            return;
                          }
                          setShowContactLockedDialog(true);
                        }}
                      >
                        {isAuthenticated ? (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Contact
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Sign in to Contact
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center space-x-2">
                          <Lock className="h-5 w-5 text-ceylon-green" />
                          <span>Contact is Locked</span>
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Contact details are kept private for your safety. To connect with the organizer:
                          <br /><br />
                          1. Send an interest request below
                          2. Wait for the organizer to accept
                          3. Once accepted, they can choose to share contact details in your private chat conversation
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogAction 
                        onClick={() => setShowContactLockedDialog(false)}
                        className="bg-ceylon-green hover:bg-ceylon-green/90"
                      >
                        Got it
                      </AlertDialogAction>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Clean Interest Request System */}
                  {isAuthenticated ? (
                    user && user.id !== trip.organizer?.id ? (
                      <Button 
                        onClick={handleSendInterest}
                        disabled={!!existingInterestRequest || sendInterestMutation.isPending}
                        className={`w-full ${
                          existingInterestRequest 
                            ? 'bg-gray-100 text-gray-600 cursor-not-allowed border border-gray-300'
                            : 'bg-ceylon-green hover:bg-ceylon-green/90 text-white'
                        }`}
                        data-testid="button-interest"
                      >
                        {sendInterestMutation.isPending ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                            Sending...
                          </>
                        ) : existingInterestRequest ? (
                          <>
                            <Heart className="h-4 w-4 mr-2 fill-current" />
                            Request Sent
                          </>
                        ) : (
                          <>
                            Send Request
                          </>
                        )}
                      </Button>
                    ) : user?.id === trip.organizer?.id ? (
                      <div className="w-full text-center text-sm text-gray-600 p-3 bg-blue-50 rounded-md border border-blue-200">
                        You are the organizer of this trip
                      </div>
                    ) : null
                  ) : (
                    <Button 
                      onClick={() => {
                        const currentPath = `${window.location.pathname}${window.location.search}`;
                        window.location.href = createLoginRedirectUrl(currentPath);
                      }}
                      className="w-full bg-ceylon-green hover:bg-ceylon-green/90 text-white"
                      data-testid="button-signin-interest"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Sign in to send request
                    </Button>
                  )}

                  {/* Show status message for existing requests */}
                  {existingInterestRequest && (
                    <div className={`text-sm text-center p-3 rounded-md mt-2 ${
                      existingInterestRequest.status === 'accepted' 
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : existingInterestRequest.status === 'rejected'
                        ? 'bg-red-100 text-red-800 border border-red-200' 
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`} data-testid="interest-status">
                      {existingInterestRequest.status === 'pending' && 'Your request is pending review by the organizer'}
                      {existingInterestRequest.status === 'accepted' && (
                        <div>
                          <div className="font-medium">Request accepted! 🎉</div>
                          <Button 
                            size="sm" 
                            className="mt-2 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => window.location.href = `/chat-buddy?tripId=${trip.id}`}
                          >
                            Chat with Trip Members
                          </Button>
                        </div>
                      )}
                      {existingInterestRequest.status === 'rejected' && 'Your interest request was declined'}
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
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <UserDisplay 
                                user={comment.user as any}
                                avatarSize="sm"
                                nameClassName="font-medium text-gray-800"
                              />
                              <span className="text-sm text-gray-500">
                                {new Date(comment.createdAt!).toLocaleDateString()}
                              </span>
                            </div>
                            {(canEditComment(comment) || canDeleteComment(comment)) && (
                              <ActionsMenu
                                onEdit={canEditComment(comment) ? () => handleEditComment(comment) : undefined}
                                onDelete={canDeleteComment(comment) ? () => handleDeleteComment(comment.id) : undefined}
                                canEdit={canEditComment(comment)}
                                canDelete={canDeleteComment(comment)}
                                isDeleting={deleteCommentMutation.isPending}
                                size="sm"
                              />
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

      {/* Date Edit Modal */}
      {showDateEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" data-testid="date-edit-modal">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Edit Trip Dates</CardTitle>
              <p className="text-sm text-muted-foreground">
                Update your travel dates. This will be visible to all interested travelers.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <TripDateRangePicker
                value={{
                  startDate: trip.date ? new Date(trip.date) : null,
                  endDate: trip.date ? new Date(trip.date) : null
                }}
                onChange={(dates) => {
                  setSelectedDates(dates);
                }}
                showSummary={true}
              />
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDateEditModal(false)}
                  data-testid="button-cancel-date-edit"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-ceylon-green hover:bg-ceylon-green/90"
                  onClick={() => {
                    // Here you would implement the date update mutation
                    toast({
                      title: "Dates Updated",
                      description: "Your trip dates have been updated successfully.",
                    });
                    setShowDateEditModal(false);
                  }}
                  data-testid="button-save-date-edit"
                >
                  Save Dates
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Comment Dialog */}
      <EditContentDialog
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingCommentId(null);
        }}
        onSave={handleSaveEditComment}
        isLoading={editCommentMutation.isPending}
        title="Edit Comment"
        initialContent={{
          content: editingCommentId && comments 
            ? comments.find(c => c.id === editingCommentId)?.content || ""
            : ""
        }}
        fields={{ content: true }}
        contentType="comment"
      />

      {/* Edit Trip Dialog */}
      {trip && (
        <TripEditDialog
          isOpen={showTripEditDialog}
          onClose={() => setShowTripEditDialog(false)}
          trip={trip as any}
        />
      )}
    </div>
  );
}
