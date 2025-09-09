import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, MapPin, Calendar, Globe, Shield } from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { VerificationBadges } from "@/components/ui/verification-badges";
import { FollowButton } from "@/components/ui/follow-button";
import { ReportButton } from "@/components/ui/report-button";
import ProfilePage from "@/pages/me"; // Fallback to own profile

interface UserProfile {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  profileImageUrl?: string;
  bio?: string;
  location?: string;
  languages?: string[];
  emailVerified: boolean;
  isVerifiedUser: boolean;
  verificationBadges: string[];
  verificationLevel: number;
  profileVisibility: 'public' | 'friends' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  showRealName: boolean;
  showBio: boolean;
  showLocation: boolean;
  showInterests: boolean;
  showTravelHistory: boolean;
  email?: string;
  phoneNumber?: string;
  interests?: string[];
  vibe?: string[];
  regions?: string[];
  createdAt: string;
  // Trip stats
  tripsOrganized?: number;
  tripsJoined?: number;
  totalRating?: number;
  reviewCount?: number;
}

export default function UserProfilePage() {
  const [match, params] = useRoute("/profile/:id");
  const { user: currentUser } = useAuth();
  
  if (!match || !params?.id) {
    return <div>Profile not found</div>;
  }

  const userId = params.id;
  const isOwnProfile = currentUser?.id === userId;

  // If viewing own profile, redirect to existing profile page
  if (isOwnProfile) {
    return <ProfilePage />;
  }

  // Fetch user profile with privacy controls
  const { data: profile, isLoading, error } = useQuery<UserProfile>({
    queryKey: [`/api/users/${userId}/profile`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/profile`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("User not found");
        }
        if (response.status === 403) {
          throw new Error("Profile is private");
        }
        throw new Error("Failed to load profile");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    const errorMessage = error?.message || "Profile not found";
    const isPrivate = errorMessage === "Profile is private";
    
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              {isPrivate ? (
                <>
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Private Profile</h2>
                  <p className="text-gray-600 mb-6">
                    This user has set their profile to private. Only friends can view their information.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
                  <p className="text-gray-600 mb-6">
                    The user you're looking for doesn't exist or has been deactivated.
                  </p>
                </>
              )}
              <Link href="/browse-trips">
                <Button>Browse Travelers</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  const displayName = profile.showRealName && profile.firstName && profile.lastName 
    ? `${profile.firstName} ${profile.lastName}`
    : profile.displayName || profile.username || 'Ceylon Traveler';

  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/browse-trips">
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Browse
            </Button>
          </Link>
        </div>

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarImage src={profile.profileImageUrl || undefined} />
                  <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="mt-4">
                  <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                  {profile.username && (
                    <p className="text-gray-600">@{profile.username}</p>
                  )}
                </div>

                {/* Verification Badges */}
                <div className="mt-3">
                  <VerificationBadges
                    badges={profile.verificationBadges}
                    isVerified={profile.isVerifiedUser}
                    verificationLevel={profile.verificationLevel}
                    size="md"
                  />
                </div>
              </div>

              {/* Profile Details */}
              <div className="flex-1 space-y-4">
                {/* Bio */}
                {profile.showBio && profile.bio && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                    <p className="text-gray-700">{profile.bio}</p>
                  </div>
                )}

                {/* Location */}
                {profile.showLocation && profile.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{profile.location}</span>
                  </div>
                )}

                {/* Languages */}
                {profile.languages && profile.languages.length > 0 && (
                  <div className="flex items-center text-gray-600">
                    <Globe className="h-4 w-4 mr-2" />
                    <span>Speaks: {profile.languages.join(', ')}</span>
                  </div>
                )}

                {/* Member Since */}
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Member since {memberSince}</span>
                </div>

                {/* Travel Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <div className="text-center">
                    <div className="font-bold text-lg text-gray-900">{profile.tripsOrganized || 0}</div>
                    <div className="text-sm text-gray-600">Trips Organized</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-gray-900">{profile.tripsJoined || 0}</div>
                    <div className="text-sm text-gray-600">Trips Joined</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-gray-900">
                      {profile.totalRating ? profile.totalRating.toFixed(1) : '—'}
                    </div>
                    <div className="text-sm text-gray-600">Average Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-gray-900">{profile.reviewCount || 0}</div>
                    <div className="text-sm text-gray-600">Reviews</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <FollowButton userId={profile.id} />
                <ReportButton userId={profile.id} username={profile.username || profile.displayName} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Travel Interests */}
        {profile.showInterests && profile.interests && profile.interests.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Travel Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <Badge key={interest} variant="secondary">
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Travel Preferences */}
        {profile.showInterests && (profile.vibe?.length || profile.regions?.length) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Travel Style</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.vibe && profile.vibe.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Preferred Vibe</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.vibe.map((v) => (
                      <Badge key={v} variant="outline">{v}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {profile.regions && profile.regions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Favorite Regions</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.regions.map((region) => (
                      <Badge key={region} variant="outline">{region}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      <Footer />
    </div>
  );
}