import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Check, X, RefreshCw, User as UserIcon, Heart, Clock, MessageSquare, Edit, Trash2, Shield, AlertTriangle } from "lucide-react";
import { generateRandomProfilePicture, getDisplayName, getInitials, type AvatarStyle, AVATAR_STYLES } from "@/lib/profileUtils";
import { AvatarSelector } from "@/components/avatar-selector";
import type { User, TripWithOrganizer, QuestionWithDetails } from "@shared/schema";
import { AdminReportsTable } from "@/components/AdminReportsTable";
import { UserHistoryTab } from "@/components/UserHistoryTab";
import { PreferencesCompletionBanner } from "@/components/PreferencesCompletionBanner";

const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be less than 20 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores").optional().or(z.literal('')),
  phoneNumber: z.string().optional().or(z.literal('')).refine((val) => {
    // If phone number is provided, do basic validation
    if (val && val.trim()) {
      const cleaned = val.replace(/[\s\-\(\)]/g, '');
      return /^\+?[\d]{7,15}$/.test(cleaned);
    }
    return true;
  }, "Please enter a valid phone number"),
  bio: z.string().optional(),
  profileImageUrl: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function UserDashboard() {
  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY CONDITIONAL RETURNS
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("my-trips");
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      phoneNumber: "",
      bio: "",
      profileImageUrl: "",
    },
  });

  const { data: myTrips } = useQuery<TripWithOrganizer[]>({
    queryKey: ["/api/users/trips"],
    enabled: !!user,
  });

  const { data: myQuestions } = useQuery<QuestionWithDetails[]>({
    queryKey: ["/api/me/activity/questions"],
    enabled: !!user,
  });

  // Query for interest requests on my trips
  const { data: interestRequests = [], refetch: refetchInterestRequests } = useQuery({
    queryKey: ["/api/my-trips/interest-requests"],
    enabled: !!user,
  });


  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      // Clean up empty strings to undefined for optional fields
      const cleanData = {
        ...data,
        username: data.username?.trim() || undefined,
        phoneNumber: data.phoneNumber?.trim() || undefined,
        bio: data.bio?.trim() || undefined,
        profileImageUrl: data.profileImageUrl?.trim() || undefined,
      };
      const result = await apiRequest("PATCH", "/api/user", cleanData);
      // Add cache buster to force fresh data
      const timestamp = Date.now();
      const freshUserResponse = await fetch(`/api/auth/me?_t=${timestamp}`, {
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (freshUserResponse.ok) {
        return await freshUserResponse.json();
      }
      return result;
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/auth/me"] });
      
      // Snapshot the previous value
      const previousUser = queryClient.getQueryData(["/api/auth/me"]);
      
      // Optimistically update the cache with new data
      if (previousUser && user) {
        const optimisticUser = {
          ...user,
          username: newData.username?.trim() || user.username,
          phoneNumber: newData.phoneNumber?.trim() || user.phoneNumber,
          bio: newData.bio?.trim() || user.bio,
          profileImageUrl: newData.profileImageUrl?.trim() || user.profileImageUrl,
        };
        queryClient.setQueryData(["/api/auth/me"], optimisticUser);
        // Also invalidate immediately to trigger re-renders
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      }
      
      return { previousUser };
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      
      console.log("✅ Profile update successful, invalidating cache...");
      
      // Set the updated user data immediately for instant UI feedback
      queryClient.setQueryData(["/api/auth/me"], updatedUser);
      
      // Force complete cache refresh
      queryClient.removeQueries({ queryKey: ["/api/auth/me"] });
      
      // Force immediate refetch to get fresh data from backend
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        queryClient.refetchQueries({ 
          queryKey: ["/api/auth/me"], 
          type: 'all' 
        });
        console.log("✅ Cache invalidated, forcing re-fetch...");
      }, 100);
    },
    onError: (error: any, newData, context) => {
      console.error("Profile update error:", error);
      
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousUser) {
        queryClient.setQueryData(["/api/auth/me"], context.previousUser);
      }
      
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
      
      // Handle specific error messages from the server
      let errorMessage = "Failed to update profile. Please try again.";
      if (error?.message) {
        if (error.message.includes("Username is already taken")) {
          errorMessage = "Username is already taken. Please choose a different one.";
        } else if (error.message.includes("unique")) {
          errorMessage = "Username or phone number is already in use.";
        } else if (error.message.includes("validation")) {
          errorMessage = "Please check your input and try again.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const deleteTripMutation = useMutation({
    mutationFn: async (tripId: string) => {
      return await apiRequest("DELETE", `/api/trips/${tripId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Trip deleted successfully!",
      });
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

  const editQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/questions/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/me/activity/questions"] });
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
        description: "Failed to update question. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      console.log("🔍 Making DELETE request for question:", questionId);
      try {
        const result = await apiRequest("DELETE", `/api/questions/${questionId}`);
        console.log("✅ DELETE request successful:", result);
        return result;
      } catch (error) {
        console.error("❌ DELETE request failed:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("✅ Delete mutation successful");
      toast({
        title: "Success",
        description: "Question deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/me/activity/questions"] });
    },
    onError: (error) => {
      console.error("❌ Delete mutation error:", error);
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
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for handling interest request responses
  const updateInterestRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: 'accepted' | 'rejected' }) => {
      const result = await apiRequest("PUT", `/api/interest-requests/${requestId}`, { status });
      return result;
    },
    onSuccess: (_, { status }) => {
      toast({
        title: "Success",
        description: `Interest request ${status === 'accepted' ? 'accepted' : 'declined'} successfully`,
      });
      refetchInterestRequests();
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
        description: "Failed to update interest request",
        variant: "destructive",
      });
    },
  });

  const updateTripStatusMutation = useMutation({
    mutationFn: async ({ tripId, status }: { tripId: string; status: string }) => {
      return await apiRequest("PATCH", `/api/trips/${tripId}/status`, { status });
    },
    onSuccess: (_, { status }) => {
      toast({
        title: "Success",
        description: status === "completed" 
          ? "Trip marked as completed! It will no longer appear in search results." 
          : "Trip status updated successfully!",
      });
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
        description: "Failed to update trip status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // ALL EFFECTS MUST BE AFTER ALL HOOKS
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user?.id) {
        const adminUserIds = [
          "bcc1d79a-d83a-4a99-8556-e1d367140e88", // PraDas S Agnya
          "313a0e58-6745-4db7-91bd-31e69c7496ab", // Add more admin IDs as needed
          "dev-admin-001", // Development Admin
          "9848130a-1ba7-4b9c-9a2f-3e1a696160e1", // Current test user (temporary for testing)
        ];
        setIsAdmin(adminUserIds.includes(user.id));
      }
    };
    checkAdminStatus();
  }, [user]);

  // Update form when user data loads
  useEffect(() => {
    if (user && !form.formState.isDirty) {
      // Only reset if form hasn't been modified to avoid losing user input
      form.reset({
        username: user.username || "",
        phoneNumber: user.phoneNumber || "",
        bio: user.bio || "",
        profileImageUrl: user.profileImageUrl || "",
      });
    }
  }, [user, form]);

  const onSubmitProfile = (data: ProfileFormData) => {
    // Ensure we always have current values, fall back to existing user data
    const cleanData = {
      username: data.username?.trim() || user?.username || undefined,
      phoneNumber: data.phoneNumber?.trim() || user?.phoneNumber || undefined,
      bio: data.bio?.trim() || user?.bio || undefined,
      profileImageUrl: data.profileImageUrl?.trim() || user?.profileImageUrl || undefined,
    };
    console.log("Submitting profile data:", cleanData);
    updateProfileMutation.mutate(cleanData);
  };

  const generateNewProfilePicture = () => {
    // Extract current style from the current avatar URL
    let currentStyle: AvatarStyle = 'avataaars';
    const currentUrl = selectedAvatarUrl || form.watch('profileImageUrl') || user?.profileImageUrl;
    if (currentUrl) {
      // Try to extract style from the URL
      for (const style of AVATAR_STYLES) {
        if (currentUrl.includes(`/${style}/`)) {
          currentStyle = style;
          break;
        }
      }
    }
    
    // Generate new random picture with the same style
    const newProfileUrl = generateRandomProfilePicture(undefined, currentStyle);
    form.setValue('profileImageUrl', newProfileUrl);
    setSelectedAvatarUrl(newProfileUrl);
  };

  const handleAvatarSelect = (avatarUrl: string, style: AvatarStyle) => {
    form.setValue('profileImageUrl', avatarUrl);
    setSelectedAvatarUrl(avatarUrl);
  };

  const handleDeleteTrip = (tripId: string) => {
    if (confirm("Are you sure you want to delete this trip?")) {
      deleteTripMutation.mutate(tripId);
    }
  };

  const handleEditQuestion = (questionId: string) => {
    // Redirect to community page where the edit dialog can be opened
    window.location.href = `/community?edit=${questionId}`;
  };

  const handleDeleteQuestion = (questionId: string) => {
    console.log("🔍 Delete button clicked for question:", questionId);
    if (confirm("Are you sure you want to delete this question?")) {
      console.log("🔍 User confirmed deletion, calling mutation");
      deleteQuestionMutation.mutate(questionId);
    } else {
      console.log("🔍 User cancelled deletion");
    }
  };

  const handleMarkCompleted = (tripId: string) => {
    if (confirm("Mark this trip as completed? It will no longer appear in search results and new people won't be able to join.")) {
      updateTripStatusMutation.mutate({ tripId, status: "completed" });
    }
  };

  const handleReactivateTrip = (tripId: string) => {
    updateTripStatusMutation.mutate({ tripId, status: "active" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2" data-testid="page-title">
            My Dashboard
          </h1>
          <p className="text-gray-600" data-testid="page-subtitle">
            Manage your trips and profile
          </p>
        </div>

        {/* Preferences Completion Banner */}
        <PreferencesCompletionBanner className="mb-6" />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'} bg-gray-100`}>
            <TabsTrigger value="my-trips" data-testid="tab-my-trips">Posted by Me</TabsTrigger>
            <TabsTrigger value="interest-requests" data-testid="tab-interest-requests">Interest Requests</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <Clock className="w-4 h-4 mr-1" />
              History
            </TabsTrigger>
            <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" data-testid="tab-admin" className="text-red-600 font-medium">
                <Shield className="w-4 h-4 mr-1" />
                Admin
              </TabsTrigger>
            )}
          </TabsList>

          {/* Posted by Me Tab */}
          <TabsContent value="my-trips">
            <div className="space-y-6">
              {/* Questions Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Questions I've Asked
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {myQuestions && myQuestions.length > 0 ? (
                    <div className="space-y-4">
                      {myQuestions.map((question) => (
                        <div key={question.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {question.title}
                            </h4>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditQuestion(question.id)}
                                data-testid={`button-edit-question-${question.id}`}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteQuestion(question.id)}
                                disabled={deleteQuestionMutation.isPending}
                                data-testid={`button-delete-question-${question.id}`}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                            {question.body.replace(/<[^>]*>/g, '')}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            {question.topic && (
                              <Badge variant="secondary">{question.topic.name}</Badge>
                            )}
                            <span>{question.answers?.length || 0} answers</span>
                            <span>{question.votesCount || 0} votes</span>
                            <Badge variant="outline" className={question.isAnonymous ? "text-orange-600 border-orange-300" : "text-blue-600 border-blue-300"}>
                              {question.isAnonymous ? "Anonymous" : "Public"}
                            </Badge>
                            <span>Asked {new Date(question.createdAt || '').toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-600">
                      You haven't asked any questions yet.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trips Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Trips I've Posted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myTrips && myTrips.length > 0 ? (
                    myTrips.map((trip) => (
                      <div key={trip.id} className="bg-gray-50 rounded-lg p-4" data-testid={`my-trip-${trip.id}`}>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-gray-800">{trip.title}</h3>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={trip.status === "active" ? "default" : "secondary"}
                              className={trip.status === "active" ? "bg-ceylon-green" : ""}
                            >
                              {trip.status}
                            </Badge>
                            {trip.status === "active" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkCompleted(trip.id)}
                                disabled={updateTripStatusMutation.isPending}
                                data-testid={`button-complete-${trip.id}`}
                                className="text-ceylon-green border-ceylon-green hover:bg-ceylon-green hover:text-white"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Mark Complete
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReactivateTrip(trip.id)}
                                disabled={updateTripStatusMutation.isPending}
                                data-testid={`button-reactivate-${trip.id}`}
                                className="text-ceylon-blue border-ceylon-blue hover:bg-ceylon-blue hover:text-white"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reactivate
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteTrip(trip.id)}
                              disabled={deleteTripMutation.isPending}
                              data-testid={`button-delete-${trip.id}`}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                          <div>📍 {trip.fromLocation} → {trip.toLocation}</div>
                          <div>📅 {new Date(trip.date).toLocaleDateString()} • {trip.time}</div>
                          <div>👥 {trip.seatsAvailable} seats available</div>
                          <div>💰 LKR {trip.price}/person</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-600" data-testid="empty-my-trips">
                      You haven't posted any trips yet.
                    </div>
                  )}
                </div>
              </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Interest Requests Tab */}
          <TabsContent value="interest-requests">
            <Card>
              <CardHeader>
                <CardTitle>Interest Requests</CardTitle>
                <p className="text-sm text-gray-600">Manage interest requests for your trips</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(interestRequests) && interestRequests.length > 0 ? (
                    interestRequests.map((request: any) => (
                      <div key={request.id} className="bg-gray-50 rounded-lg p-4 border" data-testid={`interest-request-${request.id}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{request.tripTitle}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <UserIcon className="h-4 w-4 text-gray-400" />
                              <p className="text-sm text-gray-600">
                                {request.requesterName} {request.requesterLastName}
                                {request.requesterEmail && (
                                  <span className="text-gray-500"> ({request.requesterEmail})</span>
                                )}
                              </p>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{request.message}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Badge 
                              variant={
                                request.status === "pending" ? "secondary" : 
                                request.status === "accepted" ? "default" : 
                                "destructive"
                              }
                              className={
                                request.status === "pending" ? "bg-blue-100 text-blue-800" :
                                request.status === "accepted" ? "bg-green-100 text-green-800" : 
                                "bg-red-100 text-red-800"
                              }
                            >
                              {request.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                              {request.status === "accepted" && <Check className="h-3 w-3 mr-1" />}
                              {request.status === "rejected" && <X className="h-3 w-3 mr-1" />}
                              {request.status}
                            </Badge>
                          </div>
                        </div>
                        
                        {request.status === "pending" && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              onClick={() => updateInterestRequestMutation.mutate({ requestId: request.id, status: 'accepted' })}
                              disabled={updateInterestRequestMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              data-testid={`button-accept-${request.id}`}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateInterestRequestMutation.mutate({ requestId: request.id, status: 'rejected' })}
                              disabled={updateInterestRequestMutation.isPending}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              data-testid={`button-reject-${request.id}`}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500 mt-2">
                          Requested: {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-600" data-testid="empty-interest-requests">
                      <Heart className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <p>No interest requests yet.</p>
                      <p className="text-sm">When people show interest in your trips, they'll appear here.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <UserHistoryTab />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                {user && (
                  <div className="space-y-6">
                    {/* Profile Header */}
                    <div className="flex items-center space-x-4 mb-6" data-testid="profile-header">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={user.profileImageUrl || generateRandomProfilePicture(user.id)} />
                        <AvatarFallback className="text-lg">
                          {getInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {getDisplayName(user)}
                        </h3>
                        <p className="text-gray-600">{user.email}</p>
                        {user.username && (
                          <p className="text-sm text-gray-500">@{user.username}</p>
                        )}
                      </div>
                    </div>

                    {/* Profile Form */}
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-6" data-testid="form-profile">
                        {/* Profile Picture Section */}
                        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                          <Avatar className="h-20 w-20">
                            <AvatarImage 
                              src={selectedAvatarUrl || form.watch('profileImageUrl') || user?.profileImageUrl || generateRandomProfilePicture(user?.id)} 
                              alt="Profile picture" 
                            />
                            <AvatarFallback className="text-lg">
                              {getInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800">Profile Picture</h3>
                            <p className="text-sm text-gray-600 mb-3">
                              {(selectedAvatarUrl || form.watch('profileImageUrl') || user?.profileImageUrl) ? 'Custom avatar selected' : 'Auto-generated avatar'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <AvatarSelector
                                userId={user?.id || ''}
                                currentAvatarUrl={selectedAvatarUrl || form.watch('profileImageUrl') || user?.profileImageUrl}
                                onAvatarSelect={handleAvatarSelect}
                                disabled={updateProfileMutation.isPending}
                              />
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={generateNewProfilePicture}
                                data-testid="button-generate-avatar"
                                className="flex items-center gap-2"
                                disabled={updateProfileMutation.isPending}
                              >
                                <RefreshCw className="h-4 w-4" />
                                Random
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Username Section */}
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Choose a unique username" 
                                  {...field} 
                                  data-testid="input-username"
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-sm text-gray-600">
                                {user?.username 
                                  ? `Current username: @${user.username}` 
                                  : `Currently displaying: ${getDisplayName(user)}`
                                }
                              </p>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Your phone number (optional)" 
                                  {...field} 
                                  data-testid="input-phone"
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-sm text-gray-600">
                                Adding a phone number helps other travelers contact you directly
                              </p>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Tell us about yourself..." 
                                  rows={4}
                                  {...field} 
                                  data-testid="textarea-bio"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          className="bg-ceylon-green hover:bg-ceylon-green/90 w-full shadow-sm"
                          disabled={updateProfileMutation.isPending}
                          data-testid="button-update-profile"
                        >
                          {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                        </Button>
                      </form>
                    </Form>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Tab */}
          {isAdmin && (
            <TabsContent value="admin">
              <div className="space-y-6">
                {/* Admin Header */}
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <Shield className="w-6 h-6" />
                      Admin Dashboard
                    </CardTitle>
                    <p className="text-red-600">
                      Manage reports, moderate content, and oversee platform safety.
                    </p>
                  </CardHeader>
                </Card>

                {/* Admin Reports Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      Trip Reports Management
                    </CardTitle>
                    <p className="text-muted-foreground">
                      Review and investigate reported trips. Click "Message" to communicate with organizers.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <AdminReportsTable />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
}
