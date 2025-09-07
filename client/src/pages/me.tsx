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
  ArrowLeft,
  TrendingUp,
  Eye,
  Zap,
  Heart
} from "lucide-react";
import { getDisplayName, getInitials, getAvatarOptions, AVATAR_STYLES } from "@/lib/profileUtils";
import { VisibilityToggle } from "@/components/VisibilityToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import { PreferencesForm } from "@/components/preferences/PreferencesForm";

// Travel Quote Component that uses session-based quote selection
function TravelQuote() {
  const travelQuotes = [
    { quote: "Travel makes one modest. You see what a tiny place you occupy in the world.", author: "Gustave Flaubert" },
    { quote: "The world is a book and those who do not travel read only one page.", author: "Saint Augustine" },
    { quote: "Adventure is worthwhile in itself.", author: "Amelia Earhart" },
    { quote: "To travel is to live.", author: "Hans Christian Andersen" },
    { quote: "Not all those who wander are lost.", author: "J.R.R. Tolkien" },
    { quote: "Life is short and the world is wide.", author: "Simon Raven" },
    { quote: "Travel far enough, you meet yourself.", author: "David Mitchell" },
    { quote: "The journey not the arrival matters.", author: "T.S. Eliot" },
    { quote: "Wherever you go becomes a part of you somehow.", author: "Anita Desai" },
    { quote: "We travel, initially, to lose ourselves; and we travel, next, to find ourselves.", author: "Pico Iyer" },
    { quote: "A journey is best measured in friends, rather than miles.", author: "Tim Cahill" },
    { quote: "Travel is the only thing you buy that makes you richer.", author: "Anonymous" },
    { quote: "Man cannot discover new oceans unless he has the courage to lose sight of the shore.", author: "André Gide" },
    { quote: "Jobs fill your pocket, but adventures fill your soul.", author: "Jaime Lyn Beatty" },
    { quote: "Take only memories, leave only footprints.", author: "Chief Seattle" }
  ];

  // Get or generate session quote - only changes on fresh login
  const getSessionQuote = () => {
    const sessionQuoteKey = 'ceylon_session_quote';
    let sessionQuote = sessionStorage.getItem(sessionQuoteKey);
    
    if (!sessionQuote) {
      // Generate new quote for this session
      const randomIndex = Math.floor(Math.random() * travelQuotes.length);
      sessionQuote = JSON.stringify(travelQuotes[randomIndex]);
      sessionStorage.setItem(sessionQuoteKey, sessionQuote);
    }
    
    return JSON.parse(sessionQuote);
  };

  const sessionQuote = getSessionQuote();

  return (
    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6 lg:p-8 border border-white/20 max-w-2xl mx-auto text-center">
      <div className="text-lg lg:text-xl font-medium text-white leading-relaxed mb-3">
        "{sessionQuote.quote}"
      </div>
      <div className="text-sm text-white/70 font-light italic">
        — {sessionQuote.author}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Check URL parameters for tab selection
  const getTabFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    // Valid tabs: overview, profile, preferences, activity, security, privacy
    const validTabs = ['overview', 'profile', 'preferences', 'activity', 'security', 'privacy'];
    return validTabs.includes(tabParam) ? tabParam : 'overview';
  };
  
  const [activeTab, setActiveTab] = useState(() => getTabFromUrl());

  // Listen for URL changes to update active tab
  useEffect(() => {
    const handleUrlChange = () => {
      const newTab = getTabFromUrl();
      if (newTab !== activeTab) {
        setActiveTab(newTab);
      }
    };

    // Listen for browser navigation events
    window.addEventListener('popstate', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [activeTab]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('🔍 Auth redirect triggered - user not authenticated');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Header */}
        <div className="pt-6 pb-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white hover:shadow-md transition-all duration-200"
            data-testid="button-home"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Stunning Profile Header with Gradient */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shadow-2xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-black/10">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
          </div>
          
          <div className="relative p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
              {/* Avatar and Info */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="h-28 w-28 lg:h-32 lg:w-32 ring-4 ring-white/30 shadow-xl">
                    <AvatarImage src={profile.profileImageUrl} alt="Profile" />
                    <AvatarFallback className="text-2xl bg-white/20 text-white backdrop-blur-sm">
                      {getInitials(profile)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online indicator */}
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-400 rounded-full ring-4 ring-white/30"></div>
                </div>
                
                <div className="flex-1 text-white">
                  <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                    {getDisplayName(profile)}
                  </h1>
                  {profile.username && (
                    <p className="text-lg lg:text-xl text-white/90 mb-2">@{profile.username}</p>
                  )}
                  {profile.bio && (
                    <p className="text-white/80 max-w-md leading-relaxed">{profile.bio}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-white/80">
                    {profile.location && (
                      <div className="flex items-center bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                        <MapPin className="h-4 w-4 mr-2" />
                        {profile.location}
                      </div>
                    )}
                    {profile.email && (
                      <div className="flex items-center bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                        <Mail className="h-4 w-4 mr-2" />
                        {profile.email}
                      </div>
                    )}
                    <div className="flex items-center bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      Member since {new Date(profile.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Inspirational Travel Quote */}
              <TravelQuote />
            </div>
          </div>
        </div>

        {/* Enhanced Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-2">
            <TabsList className="grid w-full grid-cols-6 bg-transparent gap-2">
              <TabsTrigger 
                value="overview" 
                className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-3 rounded-xl border-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
              >
                <TrendingUp className="h-5 w-5" />
                <span className="text-xs sm:text-sm font-medium">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="profile" 
                className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-3 rounded-xl border-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
              >
                <User className="h-5 w-5" />
                <span className="text-xs sm:text-sm font-medium">Profile</span>
              </TabsTrigger>
              <TabsTrigger 
                value="preferences" 
                className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-3 rounded-xl border-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
              >
                <Heart className="h-5 w-5" />
                <span className="text-xs sm:text-sm font-medium">Preferences</span>
              </TabsTrigger>
              <TabsTrigger 
                value="activity" 
                className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-3 rounded-xl border-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
              >
                <Zap className="h-5 w-5" />
                <span className="text-xs sm:text-sm font-medium">Activity</span>
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-3 rounded-xl border-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
              >
                <Shield className="h-5 w-5" />
                <span className="text-xs sm:text-sm font-medium">Security</span>
              </TabsTrigger>
              <TabsTrigger 
                value="privacy" 
                className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-3 rounded-xl border-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
              >
                <Eye className="h-5 w-5" />
                <span className="text-xs sm:text-sm font-medium">Privacy</span>
              </TabsTrigger>
            </TabsList>
          </div>

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
            <div className="max-w-4xl mx-auto space-y-6">
              <PreferencesForm />
              
              {/* How This Helps You Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  How This Helps You
                </h3>
                <ul className="text-blue-800 space-y-3">
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Get trip recommendations that match your travel style and interests</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Discover trips within your preferred budget range</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Find travel companions who share similar interests</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>See relevant trips for your preferred travel times and regions</span>
                  </li>
                </ul>
              </div>
            </div>
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

// Enhanced Profile Overview Component with Stunning Design
function ProfileOverview({ profile, stats, preferences }: any) {
  const completionPercentage = profile.profileCompletePct || 0;
  const preferencesCompletion = calculatePreferencesCompletion(preferences);

  return (
    <div className="space-y-8">
      {/* Profile Completion Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg mr-3">
              <User className="h-5 w-5 text-white" />
            </div>
            Profile Completion
          </h3>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{completionPercentage}%</div>
            <div className="text-sm text-gray-600">Complete</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${profile.profileImageUrl ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                <span className="text-sm font-medium">Profile Picture</span>
              </div>
              <span className={`text-sm font-bold ${profile.profileImageUrl ? 'text-green-600' : 'text-gray-400'}`}>
                {profile.profileImageUrl ? '✓' : '○'}
              </span>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${profile.displayName ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                <span className="text-sm font-medium">Display Name</span>
              </div>
              <span className={`text-sm font-bold ${profile.displayName ? 'text-green-600' : 'text-gray-400'}`}>
                {profile.displayName ? '✓' : '○'}
              </span>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${profile.bio ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                <span className="text-sm font-medium">Bio</span>
              </div>
              <span className={`text-sm font-bold ${profile.bio ? 'text-green-600' : 'text-gray-400'}`}>
                {profile.bio ? '✓' : '○'}
              </span>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${preferencesCompletion > 0 ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                <span className="text-sm font-medium">Travel Prefs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-indigo-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${preferencesCompletion}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-blue-600">{preferencesCompletion}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold mb-2">{stats.questions_count || 0}</div>
              <div className="text-emerald-100 font-medium">Questions Asked</div>
              <div className="text-xs text-emerald-200 mt-1">Get answers from the community</div>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Activity className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold mb-2">{stats.trips_count || 0}</div>
              <div className="text-orange-100 font-medium">Trips Posted</div>
              <div className="text-xs text-orange-200 mt-1">Share your adventures</div>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <MapPin className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold mb-2">{stats.saved_count || 0}</div>
              <div className="text-purple-100 font-medium">Trips Saved</div>
              <div className="text-xs text-purple-200 mt-1">Your wishlist collection</div>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Heart className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Account Info Card */}
      <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <div className="bg-gradient-to-r from-gray-600 to-slate-700 p-2 rounded-lg mr-3">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            Account Information
          </h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50">
            <div className="text-sm text-gray-600 mb-1">Member Since</div>
            <div className="font-semibold text-gray-900">{new Date(profile.createdAt).toLocaleDateString()}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50">
            <div className="text-sm text-gray-600 mb-1">Last Updated</div>
            <div className="font-semibold text-gray-900">{new Date(profile.updatedAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>
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
  const [selectedAvatarStyle, setSelectedAvatarStyle] = useState<string | null>(null);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null);

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

            {/* Simple Avatar Selection Modal */}
            {showAvatarPicker && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Choose Your Avatar</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAvatarPicker(false);
                        setSelectedAvatarStyle(null);
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                  
                  {/* Upload Custom Picture Section */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      📸 Upload Your Own Picture
                    </h4>
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
                          setSelectedAvatarStyle(null);
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
                    <span className="text-sm text-gray-500">or choose avatar style</span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>
                  
                  {/* Avatar Style Selection - Show ALL Styles */}
                  {!selectedAvatarStyle ? (
                    <div>
                      <h4 className="font-medium mb-3">Select Avatar Style to Randomize:</h4>
                      <div className="grid grid-cols-2 gap-2 mb-4 max-h-64 overflow-y-auto">
                        {AVATAR_STYLES.map((styleName) => {
                          const displayName = styleName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                          const sampleUrl = `https://api.dicebear.com/7.x/${styleName}/svg?seed=sample-${styleName}&size=40`;
                          
                          return (
                            <button
                              key={styleName}
                              type="button"
                              className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                              onClick={() => setSelectedAvatarStyle(styleName)}
                              data-testid={`style-option-${styleName}`}
                            >
                              <img
                                src={sampleUrl}
                                alt={displayName}
                                className="w-8 h-8 rounded-full flex-shrink-0"
                                loading="lazy"
                              />
                              <span className="text-xs font-medium truncate">{displayName}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : !previewAvatarUrl ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">
                          {selectedAvatarStyle.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Style
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAvatarStyle(null);
                            setPreviewAvatarUrl(null);
                          }}
                        >
                          ← Back
                        </Button>
                      </div>
                      
                      <div className="text-center mb-6">
                        <Button
                          type="button"
                          className="w-full bg-ceylon-green hover:bg-ceylon-green-dark text-white"
                          onClick={() => {
                            // Generate random avatar within selected style for preview
                            const randomSeed = Math.random().toString(36).substring(7);
                            const randomUrl = `https://api.dicebear.com/7.x/${selectedAvatarStyle}/svg?seed=${randomSeed}&size=128`;
                            setPreviewAvatarUrl(randomUrl);
                          }}
                          data-testid="button-choose-random"
                        >
                          🎲 Choose Random
                        </Button>
                      </div>
                      
                      <p className="text-sm text-gray-600 text-center">
                        Click to generate a random avatar in this style
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Preview Avatar</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPreviewAvatarUrl(null);
                          }}
                        >
                          ← Try Another
                        </Button>
                      </div>
                      
                      {/* Preview the generated avatar */}
                      <div className="text-center mb-6">
                        <div className="inline-block p-4 bg-gray-50 rounded-lg mb-4">
                          <img
                            src={previewAvatarUrl}
                            alt="Preview Avatar"
                            className="w-24 h-24 rounded-full"
                          />
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Do you like this {selectedAvatarStyle?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} avatar?
                        </p>
                        
                        <div className="space-y-3">
                          <Button
                            type="button"
                            className="w-full bg-ceylon-green hover:bg-ceylon-green-dark text-white"
                            onClick={async () => {
                              try {
                                // Update profile with the previewed avatar
                                const response = await apiRequest('PUT', '/api/profile/picture', {
                                  profileImageUrl: previewAvatarUrl
                                });
                                
                                if (response.ok) {
                                  setFormData({...formData, profileImageUrl: previewAvatarUrl});
                                  setShowAvatarPicker(false);
                                  setSelectedAvatarStyle(null);
                                  setPreviewAvatarUrl(null);
                                  toast({
                                    title: "Avatar updated!",
                                    description: `Your new ${selectedAvatarStyle?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} avatar has been saved.`,
                                  });
                                }
                              } catch (error) {
                                console.error('Avatar update error:', error);
                                toast({
                                  title: "Error",
                                  description: "Failed to update avatar. Please try again.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            data-testid="button-use-avatar"
                          >
                            ✅ Use This Avatar & Update Profile
                          </Button>
                          
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              // Generate another random avatar
                              const randomSeed = Math.random().toString(36).substring(7);
                              const randomUrl = `https://api.dicebear.com/7.x/${selectedAvatarStyle}/svg?seed=${randomSeed}&size=128`;
                              setPreviewAvatarUrl(randomUrl);
                            }}
                            data-testid="button-try-another"
                          >
                            🎲 Try Another Random
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAvatarPicker(false);
                        setSelectedAvatarStyle(null);
                      }}
                    >
                      Cancel
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
  const [activeSubTab, setActiveSubTab] = useState("all");
  
  // Get all saved trips
  const { data: allSavedTrips, isLoading: allLoading } = useQuery({
    queryKey: ['/api/user/saved-trips'],
    enabled: !!user,
  });

  // Get pinned trips only
  const { data: pinnedTrips, isLoading: pinnedLoading } = useQuery({
    queryKey: ['/api/user/saved-trips', { saveType: 'pinned' }],
    queryFn: () => fetch('/api/user/saved-trips?saveType=pinned').then(res => res.json()),
    enabled: !!user,
  });

  // Get interested trips only
  const { data: interestedTrips, isLoading: interestedLoading } = useQuery({
    queryKey: ['/api/user/saved-trips', { saveType: 'interested' }],
    queryFn: () => fetch('/api/user/saved-trips?saveType=interested').then(res => res.json()),
    enabled: !!user,
  });

  const renderTripCard = (item: any) => (
    <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow" data-testid={`saved-trip-${item.id}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{item.title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {item.fromLocation} → {item.toLocation}
          </p>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span>💰 ${item.price}</span>
            <span>👥 {item.seatsAvailable} seats</span>
            <span>📅 {new Date(item.date).toLocaleDateString()}</span>
            <Badge variant={item.saveType === 'pinned' ? 'default' : 'secondary'}>
              {item.saveType === 'pinned' ? '📌 Pinned' : '💫 Interested'} {new Date(item.savedAt).toLocaleDateString()}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.href = `/trips/${item.id}`}
            data-testid={`view-trip-${item.id}`}
          >
            View Trip
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Trips</CardTitle>
        <p className="text-sm text-gray-600">
          Manage your pinned and interested trips
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" data-testid="tab-all-saved">All Saved</TabsTrigger>
            <TabsTrigger value="pinned" data-testid="tab-pinned">📌 Pinned</TabsTrigger>
            <TabsTrigger value="interested" data-testid="tab-interested">💫 Interested</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {allLoading ? (
              <div className="text-center py-8" data-testid="loading-all-saved">Loading saved trips...</div>
            ) : allSavedTrips?.items?.length > 0 ? (
              <div className="space-y-4">
                {allSavedTrips.items.map(renderTripCard)}
                {allSavedTrips.totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <p className="text-sm text-gray-500">
                      Showing {allSavedTrips.items.length} of {allSavedTrips.total} saved trips
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8" data-testid="empty-all-saved">
                <p className="text-gray-500">No saved trips yet.</p>
                <p className="text-sm text-gray-400 mt-1">
                  Pin trips you want to join or mark them as interested to keep track.
                </p>
                <Button className="mt-4" onClick={() => window.location.href = '/browse-trips'}>
                  Browse Trips
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pinned" className="mt-6">
            {pinnedLoading ? (
              <div className="text-center py-8" data-testid="loading-pinned">Loading pinned trips...</div>
            ) : pinnedTrips?.items?.length > 0 ? (
              <div className="space-y-4">
                {pinnedTrips.items.map(renderTripCard)}
              </div>
            ) : (
              <div className="text-center py-8" data-testid="empty-pinned">
                <p className="text-gray-500">No pinned trips yet.</p>
                <p className="text-sm text-gray-400 mt-1">
                  Pin trips you're committed to joining.
                </p>
                <Button className="mt-4" onClick={() => window.location.href = '/browse-trips'}>
                  Browse Trips to Pin
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="interested" className="mt-6">
            {interestedLoading ? (
              <div className="text-center py-8" data-testid="loading-interested">Loading interested trips...</div>
            ) : interestedTrips?.items?.length > 0 ? (
              <div className="space-y-4">
                {interestedTrips.items.map(renderTripCard)}
              </div>
            ) : (
              <div className="text-center py-8" data-testid="empty-interested">
                <p className="text-gray-500">No interested trips yet.</p>
                <p className="text-sm text-gray-400 mt-1">
                  Mark trips as interested to track ones you might want to join.
                </p>
                <Button className="mt-4" onClick={() => window.location.href = '/browse-trips'}>
                  Browse Trips to Save
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
                          <Badge variant={question.visibility === 'hidden' ? 'secondary' : 'default'}>
                            {question.visibility === 'hidden' ? '🔒 Hidden' : '🌐 Visible'}
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
                          👁️ View
                        </Button>
                      </div>
                    </div>
                    
                    {/* Question Visibility Controls */}
                    <div className="border-t border-gray-200 pt-4 mt-4 bg-green-50 p-3 rounded">
                      <div className="text-sm font-semibold text-gray-700 mb-2">👁️ Question Visibility Controls</div>
                      <div className="text-xs text-gray-500 mb-2">Toggle to show/hide this question from the community</div>
                      <VisibilityToggle
                        type="question"
                        id={question.id}
                        currentVisibility={question.visibility || "public"}
                      />
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
                          <span>💰 {!trip.price || Number(trip.price) === 0 ? 'Free Trip' : `LKR ${trip.price}`}</span>
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
                          onClick={() => window.location.href = `/trips/${trip.id}`}
                          data-testid={`button-view-trip-${trip.id}`}
                        >
                          👁️ View Details
                        </Button>
                      </div>
                    </div>
                    
                    {/* Trip Visibility Controls */}
                    <div className="border-t border-gray-200 pt-4 mt-4 bg-blue-50 p-3 rounded">
                      <div className="text-sm font-semibold text-gray-700 mb-2">🔄 Trip Status Controls</div>
                      <div className="text-xs text-gray-500 mb-2">Toggle to show/hide this trip from others</div>
                      <VisibilityToggle
                        type="trip"
                        id={trip.id}
                        currentVisibility={trip.status || "active"}
                      />
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