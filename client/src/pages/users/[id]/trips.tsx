import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, MapPin, Calendar, Users, DollarSign } from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { VerificationBadges } from "@/components/ui/verification-badges";
import TripCard from "@/components/trip-card";

interface UserTripsData {
  user: {
    id: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    profileImageUrl?: string;
    isVerifiedUser: boolean;
    verificationBadges: string[];
    verificationLevel: number;
  };
  trips: Array<{
    id: string;
    title: string;
    fromLocation: string;
    toLocation: string;
    date: string;
    time: string;
    seatsAvailable: number;
    price?: number;
    region: string;
    category: string;
    imageUrl?: string;
    mediaUrls?: string[];
    coverImageIndex?: number;
    status: string;
    organizer: {
      id: string;
      displayName: string;
      profileImageUrl?: string;
    };
    createdAt: string;
  }>;
}

export default function UserTripsPage() {
  const [match, params] = useRoute("/users/:id/trips");
  const { user: currentUser } = useAuth();
  
  if (!match || !params?.id) {
    return <div>User not found</div>;
  }

  const userId = params.id;

  // Fetch user's trips
  const { data, isLoading, error } = useQuery<UserTripsData>({
    queryKey: [`/api/users/${userId}/trips`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/trips`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("User not found");
        }
        if (response.status === 403) {
          throw new Error("Cannot view this user's trips");
        }
        throw new Error("Failed to load trips");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading trips...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    const errorMessage = error?.message || "User not found";
    
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Cannot Load Trips</h2>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              <Link href="/browse-trips">
                <Button>Browse All Trips</Button>
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

  const displayName = data.user.displayName || data.user.username || 'Ceylon Traveler';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href={`/profile/${userId}`}>
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
          </Link>
        </div>

        {/* User Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                <AvatarImage src={data.user.profileImageUrl || undefined} />
                <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  {displayName}'s Trips
                </h1>
                {data.user.username && (
                  <p className="text-gray-600">@{data.user.username}</p>
                )}
                
                {/* Verification Badges */}
                <div className="mt-2">
                  <VerificationBadges
                    badges={data.user.verificationBadges}
                    isVerified={data.user.isVerifiedUser}
                    verificationLevel={data.user.verificationLevel}
                    size="sm"
                  />
                </div>
              </div>

              {/* Trip Stats */}
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{data.trips.length}</div>
                <div className="text-sm text-gray-600">
                  {data.trips.length === 1 ? 'Trip' : 'Trips'} Posted
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trips Grid */}
        {data.trips.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Trips Posted Yet</h3>
              <p className="text-gray-600 mb-6">
                {displayName} hasn't posted any trips yet. Check back later!
              </p>
              <Link href="/browse-trips">
                <Button>Browse Other Trips</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                All Trips ({data.trips.length})
              </h2>
              
              {/* Filter by status */}
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Active: {data.trips.filter(t => t.status === 'active').length}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Past: {data.trips.filter(t => new Date(t.date) < new Date()).length}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  currentUser={currentUser}
                  showOrganizerInfo={false} // Don't show organizer info since it's all from the same user
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}