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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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

// Profile Editor Component
function ProfileEditor({ profile, onUpdate }: any) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    displayName: profile.displayName || '',
    username: profile.username || '',
    bio: profile.bio || '',
    location: profile.location || '',
    languages: profile.languages || [],
    links: profile.linksJson || {}
  });
  const [isLoading, setIsLoading] = useState(false);

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Travel Style Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Your travel preferences help us recommend better trips for you.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Travel Vibe</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {preferences?.vibe?.map((item: string) => (
                  <Badge key={item} variant="secondary">{item}</Badge>
                )) || <span className="text-sm text-gray-500">None selected</span>}
              </div>
            </div>
            <div>
              <Label>When You Travel</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {preferences?.when?.map((item: string) => (
                  <Badge key={item} variant="secondary">{item}</Badge>
                )) || <span className="text-sm text-gray-500">None selected</span>}
              </div>
            </div>
          </div>
          <Button onClick={() => window.location.href = '/travel-style-settings'}>
            Update Travel Preferences
          </Button>
        </div>
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
                  <div key={question.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold">{question.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{question.body}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Score: {question.score || 0}</span>
                      <span>Views: {question.views || 0}</span>
                      <span>Answers: {question.answersCount || 0}</span>
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
                  <div key={trip.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold">{trip.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {trip.fromLocation} → {trip.toLocation}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Price: ${trip.price}</span>
                      <span>Seats: {trip.seatsAvailable}</span>
                      <Badge variant={trip.status === 'active' ? 'default' : 'secondary'}>
                        {trip.status}
                      </Badge>
                    </div>
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
            <div className="text-center py-8">
              <p className="text-gray-500">Saved items feature coming soon!</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Notification Settings Component
function NotificationSettings({ notifications, onUpdate }: any) {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    emailOn: notifications?.emailOn ?? true,
    pushOn: notifications?.pushOn ?? true,
    digest: notifications?.digest ?? 'instant',
    categories: notifications?.categoriesJson ?? {
      trip: 'instant',
      answers: 'instant',
      votes: 'digest',
      reports: 'instant',
      dm: 'instant',
      interest: 'instant'
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('PATCH', '/api/me/notifications', settings);
      if (response.ok) {
        toast({
          title: "Notifications Updated",
          description: "Your notification preferences have been saved.",
        });
        onUpdate();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Email Notifications</Label>
            <input
              type="checkbox"
              checked={settings.emailOn}
              onChange={(e) => setSettings({...settings, emailOn: e.target.checked})}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Push Notifications</Label>
            <input
              type="checkbox"
              checked={settings.pushOn}
              onChange={(e) => setSettings({...settings, pushOn: e.target.checked})}
            />
          </div>
        </div>

        <div>
          <Label>Digest Frequency</Label>
          <select
            value={settings.digest}
            onChange={(e) => setSettings({...settings, digest: e.target.value})}
            className="w-full mt-2 p-2 border rounded"
          >
            <option value="instant">Instant</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Notification Categories</h3>
          {Object.entries(settings.categories).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <Label className="capitalize">{key.replace('_', ' ')}</Label>
              <select
                value={value as string}
                onChange={(e) => setSettings({
                  ...settings,
                  categories: { ...settings.categories, [key]: e.target.value }
                })}
                className="p-1 border rounded text-sm"
              >
                <option value="instant">Instant</option>
                <option value="digest">Digest</option>
                <option value="off">Off</option>
              </select>
            </div>
          ))}
        </div>

        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}

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
    dmPolicy: privacy?.dmPolicy ?? 'everyone',
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
            <option value="friends">Friends only</option>
            <option value="private">Private</option>
          </select>
        </div>

        <div>
          <Label>Direct Message Policy</Label>
          <select
            value={settings.dmPolicy}
            onChange={(e) => setSettings({...settings, dmPolicy: e.target.value})}
            className="w-full mt-2 p-2 border rounded"
          >
            <option value="everyone">Everyone can message</option>
            <option value="followers">Followers only</option>
            <option value="nobody">Nobody</option>
          </select>
        </div>

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