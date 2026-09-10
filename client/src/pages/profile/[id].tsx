import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, MapPin, Calendar, Globe, Shield, Lock, UserX } from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { UserDisplay } from "@/components/ui/user-display";
import { VerificationBadges } from "@/components/ui/verification-badges";
import { FollowButton } from "@/components/ui/follow-button";
import { ReportButton } from "@/components/ui/report-button";
import { getDisplayName } from "@/lib/profileUtils";
import ProfilePage from "@/pages/me"; // Fallback to own profile

interface UserProfile {
  id: string;
  displayName?: string | null;
  username?: string | null;
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
      const response = await fetch(`/api/users/${userId}/profile`, {
        credentials: 'include', // Include authentication cookies
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("User not found");
        }
        if (response.status === 403) {
          throw new Error("Profile is private");
        }
        if (response.status === 401) {
          throw new Error("Please sign in to view profiles");
        }
        throw new Error("Failed to load profile");
      }
      return response.json();
    },
  });

  // Fetch follow stats - only if profile query is successful or unauthenticated user viewing public profile
  const { data: followStats } = useQuery({
    queryKey: [`/api/users/${userId}/follow-stats`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/follow-stats`, {
        credentials: 'include', // Include authentication cookies
      });
      if (!response.ok) {
        if (response.status === 401) {
          // For unauthenticated users, return zeros instead of throwing error
          // This allows showing the profile layout without follow stats
          return { followersCount: 0, followingCount: 0 };
        }
        return { followersCount: 0, followingCount: 0 };
      }
      return response.json();
    },
    enabled: !error, // Only fetch if profile query didn't error
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
    const isAuthRequired = errorMessage === "Please sign in to view profiles";
    const isPrivate = errorMessage === "Profile is private";
    const isNotFound = errorMessage === "User not found";
    
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Navigation */}
          <div className="mb-6">
            <Link href="/browse-trips">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900" data-testid="button-back-browse">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Browse
              </Button>
            </Link>
          </div>

          <Card>
            <CardContent className="text-center py-12">
              {isAuthRequired ? (
                <>
                  <Lock className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2" data-testid="text-auth-required-title">Sign In Required</h2>
                  <p className="text-gray-600 mb-6" data-testid="text-auth-required-message">
                    Please sign in to view user profiles and connect with other travelers.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/auth/signin">
                      <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-sign-in">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/browse-trips">
                      <Button variant="outline" data-testid="button-browse-trips">
                        Browse Trips
                      </Button>
                    </Link>
                  </div>
                </>
              ) : isPrivate ? (
                <>
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2" data-testid="text-private-profile-title">Private Profile</h2>
                  <p className="text-gray-600 mb-6" data-testid="text-private-profile-message">
                    This user has set their profile to private. Only friends can view their information.
                  </p>
                  <Link href="/browse-trips">
                    <Button data-testid="button-browse-travelers">Browse Travelers</Button>
                  </Link>
                </>
              ) : (
                <>
                  <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2" data-testid="text-not-found-title">
                    {isNotFound ? "User Not Found" : "Profile Not Found"}
                  </h2>
                  <p className="text-gray-600 mb-6" data-testid="text-not-found-message">
                    {isNotFound 
                      ? "The user you're looking for doesn't exist or has been deactivated."
                      : "We couldn't load this profile. Please try again later."}
                  </p>
                  <Link href="/browse-trips">
                    <Button data-testid="button-browse-travelers">Browse Travelers</Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const displayName = getDisplayName(profile);

  const memberSince = profile.createdAt && 
    typeof profile.createdAt === 'string' && 
    profile.createdAt.trim() !== '' && 
    !isNaN(Date.parse(profile.createdAt))
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      })
    : 'Recently';

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
                <UserDisplay 
                  user={{
                    id: profile.id,
                    displayName: profile.displayName,
                    username: profile.username,
                    avatarUrl: profile.profileImageUrl,
                     initials: profile.displayName ? profile.displayName.slice(0, 2).toUpperCase() : 'U'
                  }}
                  showAvatar={true}
                  avatarSize="xl"
                  layout="vertical"
                  className="gap-4"
                  nameClassName="text-2xl font-bold text-gray-900"
                  clickable={false}
                />
                {profile.username && (
                  <p className="text-gray-600 -mt-2">@{profile.username}</p>
                )}

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

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 pt-4">
                  <div className="text-center">
                    <div className="font-bold text-lg text-gray-900">{profile.tripsOrganized || 0}</div>
                    <div className="text-sm text-gray-600">Trips</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-blue-600">{followStats?.followersCount || 0}</div>
                    <div className="text-sm text-gray-600">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-blue-600">{followStats?.followingCount || 0}</div>
                    <div className="text-sm text-gray-600">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-gray-900">{profile.tripsJoined || 0}</div>
                    <div className="text-sm text-gray-600">Joined</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-gray-900">
                      {profile.totalRating ? profile.totalRating.toFixed(1) : '—'}
                    </div>
                    <div className="text-sm text-gray-600">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-gray-900">{profile.reviewCount || 0}</div>
                    <div className="text-sm text-gray-600">Reviews</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <Link href={`/users/${profile.id}/trips`}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <MapPin className="h-4 w-4 mr-2" />
                    View Trips
                  </Button>
                </Link>
                <FollowButton userId={profile.id} />
                <ReportButton userId={profile.id} username={getDisplayName(profile)} />
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