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
  Mail
} from "lucide-react";
import { getDisplayName, getInitials } from "@/lib/profileUtils";

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
          <TabsList className="grid w-full grid-cols-7 bg-white rounded-lg shadow-sm p-1">
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
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
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

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <NotificationSettings notifications={notifications} onUpdate={refetch} />
          </TabsContent>

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
            <div className="flex justify-between text-sm">
              <span>Travel Preferences</span>
              <span className={preferences ? "text-green-600" : "text-gray-400"}>
                {preferences ? "✓" : "○"}
              </span>
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

// Placeholder components for other tabs - to be implemented
function ProfileEditor({ profile, onUpdate }: any) {
  return <div>Profile Editor - To be implemented</div>;
}

function TravelPreferences({ preferences, onUpdate }: any) {
  return <div>Travel Preferences - To be implemented</div>;
}

function UserActivity() {
  return <div>User Activity - To be implemented</div>;
}

function NotificationSettings({ notifications, onUpdate }: any) {
  return <div>Notification Settings - To be implemented</div>;
}

function SecuritySettings({ profile }: any) {
  return <div>Security Settings - To be implemented</div>;
}

function PrivacySettings({ privacy, onUpdate }: any) {
  return <div>Privacy Settings - To be implemented</div>;
}