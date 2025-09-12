import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ArrowLeft, Check, X, MessageCircle, Clock, User, Mail, Phone, Calendar } from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { UserDisplay } from "@/components/ui/user-display";
import type { TripInterestRequest, User as UserType } from "@shared/schema";

interface TripInterestRequestWithUser extends TripInterestRequest {
  user: UserType;
}

interface TripRequestsPageProps {
  params: { id: string };
}

export default function TripRequestsPage({ params }: TripRequestsPageProps) {
  const { id } = params;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  // Fetch trip details
  const { data: trip, isLoading: tripLoading } = useQuery({
    queryKey: ["/api/trips", id],
    queryFn: async () => {
      const response = await fetch(`/api/trips/${id}`);
      if (!response.ok) throw new Error("Failed to fetch trip");
      return response.json();
    },
  });

  // Fetch interest requests for this trip
  const { data: requests = [], isLoading: requestsLoading, refetch } = useQuery<TripInterestRequestWithUser[]>({
    queryKey: [`/api/trips/${id}/interest-requests`],
    queryFn: async () => {
      const response = await fetch(`/api/trips/${id}/interest-requests`);
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Not authorized to view requests for this trip");
        }
        throw new Error("Failed to fetch interest requests");
      }
      return response.json();
    },
    enabled: !!id,
  });

  // Accept request mutation
  const acceptMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await apiRequest('PUT', `/api/interest-requests/${requestId}`, { 
        status: 'accepted' 
      });
      return response;
    },
    onMutate: (requestId) => {
      setProcessingRequests(prev => new Set([...Array.from(prev), requestId]));
    },
    onSuccess: () => {
      toast({
        title: "Request Accepted!",
        description: "The user has been notified and can now chat with you.",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept request",
        variant: "destructive",
      });
    },
    onSettled: (_, __, requestId) => {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    },
  });

  // Reject request mutation  
  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await apiRequest('PUT', `/api/interest-requests/${requestId}`, { 
        status: 'rejected' 
      });
      return response;
    },
    onMutate: (requestId) => {
      setProcessingRequests(prev => new Set([...Array.from(prev), requestId]));
    },
    onSuccess: () => {
      toast({
        title: "Request Rejected",
        description: "The user has been notified.",
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject request",
        variant: "destructive",
      });
    },
    onSettled: (_, __, requestId) => {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <Check className="h-4 w-4" />;
      case 'rejected': return <X className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (tripLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ceylon-yellow via-ceylon-orange to-ceylon-red">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-8">
            <p className="text-white">Loading trip details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ceylon-yellow via-ceylon-orange to-ceylon-red">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">Trip not found.</p>
              <Link href="/browse-trips">
                <Button className="mt-4">Browse Trips</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Check if current user is the trip organizer
  if (user?.id !== trip.organizer?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ceylon-yellow via-ceylon-orange to-ceylon-red">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">You are not authorized to view requests for this trip.</p>
              <Link href={`/trips/${id}`}>
                <Button className="mt-4">Back to Trip</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ceylon-yellow via-ceylon-orange to-ceylon-red">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/trips/${id}`}>
              <Button variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Trip
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Interest Requests</h1>
              <p className="text-white/80">{trip.title}</p>
            </div>
          </div>
        </div>

        {/* Trip Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Trip Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Route:</span> {trip.fromLocation} → {trip.toLocation}
              </div>
              <div>
                <span className="font-medium">Date:</span> {new Date(trip.date).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Seats:</span> {trip.seatsAvailable} available
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Interest Requests ({requests.length})</span>
              <Badge variant="secondary">
                {requests.filter(r => r.status === 'pending').length} pending
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No requests yet</h3>
                <p className="text-gray-500">
                  When people express interest in your trip, they'll appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {requests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    {/* Request Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <UserDisplay 
                          user={request.user ? {
                            id: request.user.id,
                            displayName: request.user.displayName,
                            username: request.user.username,
                            avatarUrl: request.user.profileImageUrl,
                            initials: request.user.initials || 'U'
                          } : null}
                          showAvatar={true}
                          avatarSize="md"
                          className="gap-3"
                          nameClassName="font-semibold"
                          clickable={!!request.user?.id}
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">
                            Requested {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Date unknown'}
                          </p>
                        </div>
                      </div>
                      
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">{request.status}</span>
                      </Badge>
                    </div>

                    {/* User Contact Info */}
                    {request.user.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Mail className="h-4 w-4" />
                        {request.user.email}
                      </div>
                    )}

                    {/* Request Message */}
                    {request.message && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-1">Message:</p>
                        <div className="bg-gray-50 rounded-lg p-3 text-sm">
                          {request.message}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {request.status === 'pending' && (
                      <div className="flex items-center gap-3 pt-4 border-t">
                        <Button
                          size="sm"
                          onClick={() => acceptMutation.mutate(request.id)}
                          disabled={processingRequests.has(request.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Accept Request
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectMutation.mutate(request.id)}
                          disabled={processingRequests.has(request.id)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                        {request.chatThreadId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.location.href = `/chat/${request.chatThreadId}`}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Chat
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Post-decision actions */}
                    {request.status === 'accepted' && request.chatThreadId && (
                      <div className="flex items-center gap-3 pt-4 border-t">
                        <Button
                          size="sm"
                          onClick={() => window.location.href = `/chat/${request.chatThreadId}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Continue Chat
                        </Button>
                      </div>
                    )}

                    {request.status !== 'pending' && (
                      <div className="text-xs text-gray-500 mt-2">
                        {request.status === 'accepted' ? 'Accepted' : 'Declined'} on{' '}
                        {request.updatedAt ? new Date(request.updatedAt).toLocaleDateString() : 'Date unknown'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}