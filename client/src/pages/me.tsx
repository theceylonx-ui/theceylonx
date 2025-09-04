import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Lock, 
  Activity,
  MapPin,
  Calendar,
  Mail,
  Home,
  ArrowLeft
} from "lucide-react";
import { getDisplayName, getInitials, getAvatarOptions, AVATAR_STYLES } from "@/lib/profileUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  // Fetch aggregated profile data
  const { data: profileData, isLoading, refetch } = useQuery({
    queryKey: ["/api/me"],
    enabled: !!user,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ceylon-green"></div>
      </div>
    );
  }

  if (!user || !profileData) {
    return <div>Loading...</div>;
  }

  const { profile, preferences, privacy, notifications, stats } = profileData;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
            className="flex items-center gap-2"
            data-testid="button-home"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.profileImageUrl} alt="Profile" />
              <AvatarFallback className="text-xl">
                {getInitials(profile)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {getDisplayName(profile)}
              </h1>
              {profile.username && (
                <p className="text-lg text-gray-600">@{profile.username}</p>
              )}
              {profile.bio && (
                <p className="text-gray-700 mt-2">{profile.bio}</p>
              )}
              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                {profile.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {profile.location}
                  </div>
                )}
                {profile.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {profile.email}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-ceylon-green">
                    {stats.questions_count}
                  </div>
                  <div className="text-sm text-gray-500">Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-ceylon-green">
                    {stats.trips_count}
                  </div>
                  <div className="text-sm text-gray-500">Trips</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-ceylon-green">
                    {profile.profileCompletePct || 0}%
                  </div>
                  <div className="text-sm text-gray-500">Complete</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white rounded-lg shadow-sm p-1">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center space-x-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <ProfileOverview profile={profile} stats={stats} preferences={preferences} />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <ProfileEditor profile={profile} onUpdate={refetch} />
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <TravelPreferences preferences={preferences} onUpdate={refetch} />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <UserActivity />
          </TabsContent>

          {/* Notification settings tab removed - notification bell functionality remains active */}

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <SecuritySettings profile={profile} />
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <PrivacySettings privacy={privacy} onUpdate={refetch} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Helper function to calculate travel preferences completion
function calculatePreferencesCompletion(preferences: any): number {
  if (!preferences) return 0;
  
  let completed = 0;
  let total = 4; // vibe, when, companions, interests
  
  if (preferences.vibe?.length > 0) completed++;
  if (preferences.when?.length > 0) completed++;
  if (preferences.companions?.length > 0) completed++;
  if (preferences.interests?.length > 0) completed++;
  
  return Math.round((completed / total) * 100);
}

// Profile Overview Component
function ProfileOverview({ profile, stats, preferences }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profile Completion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Profile Picture</span>
              <span className={profile.profileImageUrl ? "text-green-600" : "text-gray-400"}>
                {profile.profileImageUrl ? "✓" : "○"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Display Name</span>
              <span className={profile.displayName ? "text-green-600" : "text-gray-400"}>
                {profile.displayName ? "✓" : "○"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Bio</span>
              <span className={profile.bio ? "text-green-600" : "text-gray-400"}>
                {profile.bio ? "✓" : "○"}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Travel Preferences</span>
              <div className="flex items-center gap-2">
                {preferences ? (
                  <>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-ceylon-green h-1.5 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${calculatePreferencesCompletion(preferences)}%` 
                        }}
                      />
                    </div>
                    <span className="text-ceylon-green text-xs font-medium">
                      {calculatePreferencesCompletion(preferences)}%
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400">○</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Questions Asked</span>
              <Badge variant="secondary">{stats.questions_count}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Trips Posted</span>
              <Badge variant="secondary">{stats.trips_count}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Trips Saved</span>
              <Badge variant="secondary">{stats.saved_count}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">
            Member since {new Date(profile.createdAt).toLocaleDateString()}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Last updated {new Date(profile.updatedAt).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Profile Editor Component
function ProfileEditor({ profile, onUpdate }: any) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    displayName: profile.displayName || '',
    username: profile.username || '',
    bio: profile.bio || '',
    location: profile.location || '',
    languages: profile.languages || [],
    links: profile.linksJson || {},
    profileImageUrl: profile.profileImageUrl || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Predefined avatar options
  // Get diverse avatar options using DiceBear API with different styles
  const avatarOptions = getAvatarOptions(profile?.id || 'default');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest('PATCH', '/api/me/profile', formData);
      if (response.ok) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        });
        onUpdate();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Selection */}
          <div className="space-y-4">
            <Label>Profile Picture</Label>
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={formData.profileImageUrl} alt="Profile" />
                <AvatarFallback className="text-lg">
                  {getInitials(profile)}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAvatarPicker(true)}
                >
                  Change Avatar
                </Button>
                {formData.profileImageUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={() => setFormData({...formData, profileImageUrl: ''})}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>

            {/* Enhanced Avatar Selection Modal */}
            {showAvatarPicker && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Choose Your Avatar</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAvatarPicker(false)}
                    >
                      ✕
                    </Button>
                  </div>
                  
                  {/* Upload Custom Picture Section */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      📸 Upload Your Own Picture
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Upload a custom profile picture (max 5MB, JPG/PNG)
                    </p>
                    <ObjectUploader
                      onGetUploadParameters={async () => {
                        const response = await apiRequest('POST', '/api/profile/upload-url');
                        const data = await response.json();
                        return {
                          method: 'PUT' as const,
                          url: data.uploadURL,
                        };
                      }}
                      onComplete={(uploadUrl) => {
                        console.log('Upload completed, URL:', uploadUrl);
                        
                        // Update profile with uploaded image URL directly
                        apiRequest('PUT', '/api/profile/picture', {
                          profileImageUrl: uploadUrl
                        }).then(() => {
                          setFormData({...formData, profileImageUrl: uploadUrl});
                          setShowAvatarPicker(false);
                          toast({
                            title: "Profile picture updated!",
                            description: "Your new profile picture has been saved.",
                          });
                        }).catch((error) => {
                          console.error('Profile update error:', error);
                          toast({
                            title: "Error",
                            description: "Failed to update profile picture.",
                            variant: "destructive",
                          });
                        });
                      }}
                      buttonClassName="w-full"
                      accept="image/*"
                    >
                      📁 Choose File to Upload
                    </ObjectUploader>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-sm text-gray-500">or choose from avatars</span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>
                  
                  {/* Random Avatar Button */}
                  <div className="mb-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const randomIndex = Math.floor(Math.random() * avatarOptions.length);
                        const randomOption = avatarOptions[randomIndex];
                        setFormData({...formData, profileImageUrl: randomOption.url});
                      }}
                    >
                      🎲 Choose Random Avatar
                    </Button>
                  </div>

                  {/* Avatar Options Grid - Grouped by Style */}
                  <div className="space-y-6 mb-6 max-h-96 overflow-y-auto">
                    {/* Group avatars by style */}
                    {AVATAR_STYLES.slice(0, 8).map((styleName) => {
                      const styleOptions = avatarOptions.filter(option => option.style === styleName);
                      const displayName = styleName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                      
                      return (
                        <div key={styleName} className="border rounded-lg p-4 bg-gray-50">
                          <h4 className="font-medium text-sm mb-3 text-gray-700">{displayName}</h4>
                          <div className="grid grid-cols-4 gap-2">
                            {styleOptions.map((option) => (
                              <div key={`${option.style}-${option.variation}`} className="text-center">
                                <button
                                  type="button"
                                  className={`relative rounded-full overflow-hidden border-2 transition-all hover:scale-105 ${
                                    formData.profileImageUrl === option.url 
                                      ? 'border-ceylon-green ring-2 ring-ceylon-green ring-offset-2' 
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                  onClick={() => setFormData({...formData, profileImageUrl: option.url})}
                                  data-testid={`avatar-option-${option.style}-${option.variation}`}
                                >
                                  <img
                                    src={option.url}
                                    alt={`${option.name} ${option.variation}`}
                                    className="w-12 h-12 object-cover"
                                    loading="lazy"
                                  />
                                  {formData.profileImageUrl === option.url && (
                                    <div className="absolute inset-0 bg-ceylon-green bg-opacity-20 flex items-center justify-center">
                                      <div className="text-white text-sm">✓</div>
                                    </div>
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAvatarPicker(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowAvatarPicker(false)}
                      className="bg-ceylon-green hover:bg-ceylon-green-dark"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                placeholder="Your display name"
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="@username"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="City, Country"
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Travel Preferences Component (reuse existing logic)
function TravelPreferences({ preferences, onUpdate }: any) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  
  const handleUpdateClick = () => {
    setIsUpdating(true);
    toast({
      title: "Redirecting...",
      description: "Taking you to travel preferences settings.",
    });
    setTimeout(() => {
      window.location.href = '/travel-style-settings';
    }, 500);
  };

  const completionPercentage = () => {
    let completed = 0;
    let total = 4;
    if (preferences?.vibe?.length > 0) completed++;
    if (preferences?.when?.length > 0) completed++;
    if (preferences?.companions?.length > 0) completed++;
    if (preferences?.interests?.length > 0) completed++;
    return Math.round((completed / total) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Travel Style Preferences
          <Badge variant={completionPercentage() === 100 ? "default" : "secondary"} className="ml-2">
            {completionPercentage()}% Complete
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Your travel preferences help us recommend better trips for you.
            </p>
            {completionPercentage() < 100 && (
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-ceylon-green h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage()}%` }}
                ></div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                Travel Vibe
                {preferences?.vibe?.length > 0 && <span className="text-green-600 text-sm">✓</span>}
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {preferences?.vibe?.length > 0 ? (
                  preferences.vibe.map((item: string) => (
                    <Badge key={item} variant="default" className="bg-ceylon-green">{item}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 italic">None selected - update your preferences!</span>
                )}
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-2">
                When You Travel
                {preferences?.when?.length > 0 && <span className="text-green-600 text-sm">✓</span>}
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {preferences?.when?.length > 0 ? (
                  preferences.when.map((item: string) => (
                    <Badge key={item} variant="default" className="bg-ceylon-green">{item}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 italic">None selected - update your preferences!</span>
                )}
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-2">
                Travel Companions
                {preferences?.companions?.length > 0 && <span className="text-green-600 text-sm">✓</span>}
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {preferences?.companions?.length > 0 ? (
                  preferences.companions.map((item: string) => (
                    <Badge key={item} variant="default" className="bg-ceylon-green">{item}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 italic">None selected - update your preferences!</span>
                )}
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-2">
                Interests
                {preferences?.interests?.length > 0 && <span className="text-green-600 text-sm">✓</span>}
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {preferences?.interests?.length > 0 ? (
                  preferences.interests.slice(0, 3).map((item: string) => (
                    <Badge key={item} variant="default" className="bg-ceylon-green">{item}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 italic">None selected - update your preferences!</span>
                )}
                {preferences?.interests?.length > 3 && (
                  <Badge variant="secondary">+{preferences.interests.length - 3} more</Badge>
                )}
              </div>
            </div>
          </div>
          <Button 
            onClick={handleUpdateClick}
            disabled={isUpdating}
            className="w-full"
            data-testid="button-update-preferences"
          >
            {isUpdating ? "Redirecting..." : "Update Travel Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Saved Trips Component
function SavedTrips() {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState("pinned");
  
  const { data: pinnedTrips, isLoading: pinnedLoading } = useQuery({
    queryKey: ['/api/me/pinned-trips'],
    enabled: !!user,
  });

  const { data: interestedTrips, isLoading: interestedLoading } = useQuery({
    queryKey: ['/api/me/interested-trips'],
    enabled: !!user,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Trips</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pinned">📌 Pinned</TabsTrigger>
            <TabsTrigger value="interested">💫 Interested</TabsTrigger>
          </TabsList>

          <TabsContent value="pinned" className="mt-6">
            {pinnedLoading ? (
              <div>Loading pinned trips...</div>
            ) : pinnedTrips?.length > 0 ? (
              <div className="space-y-4">
                {pinnedTrips.map((item: any) => (
                  <div key={item.trip.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.trip.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.trip.fromLocation} → {item.trip.toLocation}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span>💰 ${item.trip.price}</span>
                          <span>👥 {item.trip.seatsAvailable} seats</span>
                          <span>📅 {new Date(item.trip.date).toLocaleDateString()}</span>
                          <Badge variant="secondary">
                            Pinned {new Date(item.createdAt).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = `/trips/${item.trip.id}`}
                      >
                        View Trip
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No pinned trips yet.</p>
                <Button className="mt-4" onClick={() => window.location.href = '/browse-trips'}>
                  Browse Trips to Pin
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="interested" className="mt-6">
            {interestedLoading ? (
              <div>Loading interested trips...</div>
            ) : interestedTrips?.length > 0 ? (
              <div className="space-y-4">
                {interestedTrips.map((item: any) => (
                  <div key={item.trip.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.trip.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.trip.fromLocation} → {item.trip.toLocation}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span>💰 ${item.trip.price}</span>
                          <span>👥 {item.trip.seatsAvailable} seats</span>
                          <span>📅 {new Date(item.trip.date).toLocaleDateString()}</span>
                          <Badge variant={item.status === 'pending' ? 'secondary' : 'default'}>
                            Interest {item.status}
                          </Badge>
                        </div>
                        {item.message && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <strong>Your message:</strong> {item.message}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = `/trips/${item.trip.id}`}
                      >
                        View Trip
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No interested trips yet.</p>
                <Button className="mt-4" onClick={() => window.location.href = '/browse-trips'}>
                  Browse Trips to Join
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// User Activity Component
function UserActivity() {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState("questions");
  
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/me/activity/questions'],
    enabled: !!user,
  });

  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ['/api/me/activity/trips'],
    enabled: !!user,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="trips">Trips</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="mt-6">
            {questionsLoading ? (
              <div>Loading questions...</div>
            ) : questions?.length > 0 ? (
              <div className="space-y-4">
                {questions.map((question: any) => (
                  <div key={question.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{question.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{question.body}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span>📈 Score: {question.score || 0}</span>
                          <span>👀 Views: {question.views || 0}</span>
                          <span>💬 Answers: {question.answersCount || 0}</span>
                          <Badge variant={question.acceptedAnswerId ? 'default' : 'secondary'}>
                            {question.acceptedAnswerId ? 'Answered' : 'Open'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location.href = `/question/${question.id}`}
                          data-testid={`button-view-question-${question.id}`}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => window.location.href = `/question/${question.id}/edit`}
                          data-testid={`button-edit-question-${question.id}`}
                        >
                          ✏️ Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            if(confirm('Are you sure you want to delete this question?')) {
                              // Add delete functionality
                              console.log('Delete question:', question.id);
                            }
                          }}
                          data-testid={`button-delete-question-${question.id}`}
                        >
                          🗑️ Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No questions asked yet.</p>
                <Button className="mt-4" onClick={() => window.location.href = '/community'}>
                  Ask Your First Question
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trips" className="mt-6">
            {tripsLoading ? (
              <div>Loading trips...</div>
            ) : trips?.length > 0 ? (
              <div className="space-y-4">
                {trips.map((trip: any) => (
                  <div key={trip.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{trip.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {trip.fromLocation} → {trip.toLocation}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span>💰 ${trip.price}</span>
                          <span>👥 {trip.seatsAvailable} seats</span>
                          <span>📅 {trip.date ? new Date(trip.date).toLocaleDateString() : 'Date TBD'}</span>
                          <Badge variant={trip.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                            {trip.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location.href = `/trip/${trip.id}`}
                          data-testid={`button-view-trip-${trip.id}`}
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => window.location.href = `/trip/${trip.id}/edit`}
                          data-testid={`button-edit-trip-${trip.id}`}
                        >
                          ✏️ Edit
                        </Button>
                      </div>
                    </div>
                    {trip.notes && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                        <strong>Notes:</strong> {trip.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No trips posted yet.</p>
                <Button className="mt-4" onClick={() => window.location.href = '/post'}>
                  Post Your First Trip
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            <SavedTrips />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// NotificationSettings component removed - notification bell functionality remains active

// Security Settings Component
function SecuritySettings({ profile }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Account Information</h3>
            <div className="mt-2 space-y-2 text-sm">
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Provider:</strong> {profile.provider || 'Email'}</p>
              <p><strong>Email Verified:</strong> {profile.emailVerified ? '✅ Verified' : '❌ Not verified'}</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium">Login Methods</h3>
            <div className="mt-2 space-y-2">
              {profile.googleId && (
                <Badge variant="secondary">Google Connected</Badge>
              )}
              {profile.facebookId && (
                <Badge variant="secondary">Facebook Connected</Badge>
              )}
              {profile.microsoftId && (
                <Badge variant="secondary">Microsoft Connected</Badge>
              )}
              {profile.appleId && (
                <Badge variant="secondary">Apple Connected</Badge>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium">Account Actions</h3>
            <div className="mt-2 space-y-2">
              <Button variant="outline" onClick={() => window.location.href = '/user/delete'}>
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Privacy Settings Component
function PrivacySettings({ privacy, onUpdate }: any) {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    visibility: privacy?.visibility ?? 'public',
    showOnline: privacy?.showOnline ?? true,
    showJoinedTrips: privacy?.showJoinedTrips ?? true,
    cityVisibility: privacy?.cityVisibility ?? 'show'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('PATCH', '/api/me/privacy', settings);
      if (response.ok) {
        toast({
          title: "Privacy Updated",
          description: "Your privacy settings have been saved.",
        });
        onUpdate();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update privacy settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Profile Visibility</Label>
          <select
            value={settings.visibility}
            onChange={(e) => setSettings({...settings, visibility: e.target.value})}
            className="w-full mt-2 p-2 border rounded"
          >
            <option value="public">Public - Everyone can see</option>
            <option value="private">Private</option>
          </select>
        </div>

        {/* Direct Message Policy removed - messaging is handled through trip-based chat system */}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Show Online Status</Label>
            <input
              type="checkbox"
              checked={settings.showOnline}
              onChange={(e) => setSettings({...settings, showOnline: e.target.checked})}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Show Joined Trips</Label>
            <input
              type="checkbox"
              checked={settings.showJoinedTrips}
              onChange={(e) => setSettings({...settings, showJoinedTrips: e.target.checked})}
            />
          </div>
        </div>

        <div>
          <Label>City Visibility</Label>
          <select
            value={settings.cityVisibility}
            onChange={(e) => setSettings({...settings, cityVisibility: e.target.value})}
            className="w-full mt-2 p-2 border rounded"
          >
            <option value="show">Show my city</option>
            <option value="hide">Hide my city</option>
          </select>
        </div>

        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}