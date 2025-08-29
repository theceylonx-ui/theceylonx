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
import { Check, X, RefreshCw, User as UserIcon } from "lucide-react";
import { generateRandomProfilePicture, getDisplayName, getInitials } from "@/lib/profileUtils";
import type { User, TripWithOrganizer, TripParticipant } from "@shared/schema";

const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be less than 20 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores").optional().or(z.literal('')),
  phoneNumber: z.string().min(1, "Phone number is required"),
  bio: z.string().optional(),
  profileImageUrl: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function UserDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("my-trips");

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      phoneNumber: "",
      bio: "",
      profileImageUrl: "",
    },
  });

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

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username || "",
        phoneNumber: user.phoneNumber || "",
        bio: user.bio || "",
        profileImageUrl: user.profileImageUrl || "",
      });
    }
  }, [user, form]);

  const { data: myTrips } = useQuery<TripWithOrganizer[]>({
    queryKey: ["/api/users/trips"],
    enabled: !!user,
  });

  const { data: myParticipations } = useQuery<(TripParticipant & { trip: TripWithOrganizer })[]>({
    queryKey: ["/api/users/participations"],
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return await apiRequest("PATCH", "/api/auth/user", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
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

  const onSubmitProfile = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const generateNewProfilePicture = () => {
    const newProfileUrl = generateRandomProfilePicture();
    form.setValue('profileImageUrl', newProfileUrl);
  };

  const handleDeleteTrip = (tripId: string) => {
    if (confirm("Are you sure you want to delete this trip?")) {
      deleteTripMutation.mutate(tripId);
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100">
            <TabsTrigger value="my-trips" data-testid="tab-my-trips">My Trips</TabsTrigger>
            <TabsTrigger value="joined-trips" data-testid="tab-joined-trips">Joined Trips</TabsTrigger>
            <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
          </TabsList>

          {/* My Trips Tab */}
          <TabsContent value="my-trips">
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
          </TabsContent>

          {/* Joined Trips Tab */}
          <TabsContent value="joined-trips">
            <Card>
              <CardHeader>
                <CardTitle>Trips I've Joined</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myParticipations && myParticipations.length > 0 ? (
                    myParticipations.map((participation) => (
                      <div key={participation.id} className="bg-gray-50 rounded-lg p-4" data-testid={`joined-trip-${participation.id}`}>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-gray-800">{participation.trip.title}</h3>
                          <Badge 
                            variant={participation.status === "approved" ? "default" : "secondary"}
                            className={participation.status === "approved" ? "bg-ceylon-green" : ""}
                          >
                            {participation.status}
                          </Badge>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                          <div>📍 {participation.trip.fromLocation} → {participation.trip.toLocation}</div>
                          <div>📅 {new Date(participation.trip.date).toLocaleDateString()} • {participation.trip.time}</div>
                          <div>👤 Organized by {participation.trip.organizer.firstName} {participation.trip.organizer.lastName}</div>
                          <div>💰 LKR {participation.trip.price}/person</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-600" data-testid="empty-joined-trips">
                      You haven't joined any trips yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
                              src={form.watch('profileImageUrl') || user?.profileImageUrl || generateRandomProfilePicture(user?.id)} 
                              alt="Profile picture" 
                            />
                            <AvatarFallback className="text-lg">
                              {getInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium text-gray-800">Profile Picture</h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {user?.profileImageUrl ? 'Custom profile picture' : 'Auto-generated avatar'}
                            </p>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={generateNewProfilePicture}
                              data-testid="button-generate-avatar"
                              className="flex items-center gap-2"
                            >
                              <RefreshCw className="h-4 w-4" />
                              Generate New Avatar
                            </Button>
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
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Your phone number" 
                                  {...field} 
                                  data-testid="input-phone"
                                />
                              </FormControl>
                              <FormMessage />
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
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
}
