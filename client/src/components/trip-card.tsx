import { Link } from "wouter";
import { MapPin, Calendar, Users, DollarSign, Mail, Lock, Pin, PinOff, Star, StarOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { generateRandomProfilePicture, getDisplayName, getInitials } from "@/lib/profileUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TripWithOrganizer } from "@shared/schema";
import { ActionsMenu } from "@/components/ActionsMenu";
import { EditContentDialog } from "@/components/EditContentDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { useState } from "react";

interface TripCardProps {
  trip: TripWithOrganizer & { isPinned?: boolean; isInterested?: boolean };
  badges?: string[];
}

export default function TripCard({ trip, badges }: TripCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for edit and delete dialogs
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const pinMutation = useMutation({
    mutationFn: async (pinned: boolean) => {
      const response = await apiRequest('POST', `/api/trips/${trip.id}/pin`, { pinned });
      return response;
    },
    onMutate: async (pinned) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/trips'] });
      
      // Snapshot the previous value
      const previousTrips = queryClient.getQueryData(['/api/trips']);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['/api/trips'], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          trips: oldData.trips.map((t: any) => 
            t.id === trip.id ? { ...t, isPinned: pinned } : t
          )
        };
      });
      
      return { previousTrips };
    },
    onSuccess: (data, pinned) => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pinned-trips'] });
      queryClient.invalidateQueries({ queryKey: ['/api/interested-trips'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/aggregate'] });
      
      toast({
        title: pinned ? 'Trip Pinned' : 'Trip Unpinned',
        description: pinned 
          ? 'Trip has been added to your pinned trips' 
          : 'Trip has been removed from your pinned trips',
      });
    },
    onError: (error: any, pinned, context) => {
      // Rollback optimistic update on error
      if (context?.previousTrips) {
        queryClient.setQueryData(['/api/trips'], context.previousTrips);
      }
      
      // Handle special case for interested trips
      if (error.status === 409 && error.error === 'INTERESTED_ACTIVE') {
        toast({
          title: 'Cannot Pin Trip',
          description: 'This trip is marked as interested. Unmark to pin.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update pin status',
          variant: 'destructive',
        });
      }
    },
  });

  const interestMutation = useMutation({
    mutationFn: async (interested: boolean) => {
      const response = await apiRequest('POST', `/api/trips/${trip.id}/interest`, { interested });
      return response;
    },
    onMutate: async (interested) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/trips'] });
      
      // Snapshot the previous value
      const previousTrips = queryClient.getQueryData(['/api/trips']);
      
      // Optimistically update to the new value - interested=true forces pinned=false
      queryClient.setQueryData(['/api/trips'], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          trips: oldData.trips.map((t: any) => 
            t.id === trip.id ? { 
              ...t, 
              isInterested: interested,
              isPinned: interested ? false : t.isPinned // Force pinned=false when interested=true
            } : t
          )
        };
      });
      
      return { previousTrips };
    },
    onSuccess: (data, interested) => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pinned-trips'] });
      queryClient.invalidateQueries({ queryKey: ['/api/interested-trips'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/aggregate'] });
      
      toast({
        title: interested ? 'Marked as Interested' : 'Removed Interest',
        description: interested 
          ? 'Trip has been marked as interested' 
          : 'Trip interest has been removed',
      });
    },
    onError: (error: any, interested, context) => {
      // Rollback optimistic update on error
      if (context?.previousTrips) {
        queryClient.setQueryData(['/api/trips'], context.previousTrips);
      }
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to update interest status',
        variant: 'destructive',
      });
    },
  });

  // Edit trip mutation
  const editTripMutation = useMutation({
    mutationFn: async (tripData: any) => {
      const response = await apiRequest('PATCH', `/api/trips/${trip.id}`, tripData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/trips'] });
      toast({
        title: 'Trip Updated',
        description: 'Your trip has been updated successfully.',
      });
      setShowEditDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update trip',
        variant: 'destructive',
      });
    },
  });

  // Delete trip mutation
  const deleteTripMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/trips/${trip.id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/trips'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pinned-trips'] });
      queryClient.invalidateQueries({ queryKey: ['/api/interested-trips'] });
      toast({
        title: 'Trip Deleted',
        description: 'Your trip has been deleted successfully.',
      });
      setShowDeleteDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete trip',
        variant: 'destructive',
      });
    },
  });

  const handlePin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      window.location.href = '/auth/signin';
      return;
    }
    
    pinMutation.mutate(!trip.isPinned);
  };

  const handleInterest = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      window.location.href = '/auth/signin';
      return;
    }
    
    interestMutation.mutate(!trip.isInterested);
  };

  const handleContact = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      window.location.href = '/auth/signin';
      return;
    }
    
    if (trip.contactInfo.includes("@")) {
      window.open(`mailto:${trip.contactInfo}`, "_blank");
    } else {
      // Normalize phone number for WhatsApp
      let phoneNumber = trip.contactInfo.replace(/\D/g, "");
      
      // If number starts with 0, it's likely a local number
      if (phoneNumber.startsWith('0')) {
        // For Sri Lankan numbers (typical length after removing 0 is 9)
        if (phoneNumber.length === 10) {
          phoneNumber = '94' + phoneNumber.substring(1);
        }
        // For other countries, user should include country code manually
        // We'll just remove the leading 0 and let them specify
        else {
          phoneNumber = phoneNumber.substring(1);
        }
      }
      
      // If number is very short (less than 10 digits), likely missing country code
      // But we won't assume - user should provide complete international number
      
      console.log(`Opening WhatsApp for number: ${phoneNumber}`);
      window.open(`https://wa.me/${phoneNumber}`, "_blank");
    }
  };

  const handleEditTrip = () => {
    setShowEditDialog(true);
  };

  const handleDeleteTrip = () => {
    setShowDeleteDialog(true);
  };

  const handleSaveEdit = (content: any) => {
    editTripMutation.mutate(content);
  };

  const handleConfirmDelete = () => {
    deleteTripMutation.mutate();
  };

  // Check if current user is the trip organizer
  const isOwner = user && user.id === trip.organizerId;

  const getRegionColor = (region: string) => {
    const colors: Record<string, string> = {
      'western': 'bg-ceylon-green',
      'southern': 'bg-ceylon-blue', 
      'central': 'bg-orange-500',
      'northern': 'bg-purple-500',
      'eastern': 'bg-pink-500',
      'northwestern': 'bg-indigo-500',
      'north-central': 'bg-yellow-500',
      'sabaragamuwa': 'bg-red-500',
      'uva': 'bg-teal-500',
    };
    return colors[region] || 'bg-gray-500';
  };

  const getTripImage = () => {
    // Use assigned image from database first - this should contain the Sri Lankan regional photos
    if (trip.imageUrl) {
      console.log('Using database imageUrl:', trip.imageUrl); // Debug log
      return trip.imageUrl;
    }
    
    // Fallback to Sri Lankan regional images if database image is missing
    const sriLankanImages: Record<string, string> = {
      'southern': 'https://images.unsplash.com/photo-1605540436563-5bca919ae766?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200', // Stilt fishermen
      'central': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200', // Tea plantation
      'north central': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200', // Sigiriya
      'eastern': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200', // Surf waves
      'northern': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200', // Hindu kovil
      'western': 'https://images.unsplash.com/photo-1605540436563-5bca919ae766?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200', // Colombo
      'uva': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200', // Elephant safari
      'sabaragamuwa': 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200', // Mountain forest
    };
    
    console.log('No database image, using regional fallback for region:', trip.region); // Debug log
    return sriLankanImages[trip.region.toLowerCase()] || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200';
  };

  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group border-0 shadow-sm" data-testid={`trip-card-${trip.id}`}>
        <div className="relative">
          <img 
            src={getTripImage()}
            alt={`${trip.region} travel photo of Sri Lanka - ${trip.fromLocation} to ${trip.toLocation}`}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200';
            }}
          />
          <div className="absolute top-3 right-3">
            <Badge 
              className={`${getRegionColor(trip.region)} text-white border-0`}
              data-testid={`trip-region-${trip.id}`}
            >
              {trip.region.charAt(0).toUpperCase() + trip.region.slice(1)}
            </Badge>
          </div>
        </div>
        
        <CardContent className="p-4 sm:p-6 bg-white">
          <div className="mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 line-clamp-2" data-testid={`trip-title-${trip.id}`}>
              {trip.title}
            </h3>
            
            {/* Display badges if available */}
            {badges && badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2" data-testid={`trip-badges-${trip.id}`}>
                {badges.slice(0, 2).map((badge, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs bg-green-100 text-green-700 hover:bg-green-200"
                  >
                    {badge}
                  </Badge>
                ))}
                {badges.length > 2 && (
                  <Badge variant="outline" className="text-xs text-gray-500">
                    +{badges.length - 2} more
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <div className="space-y-2 sm:space-y-3 mb-4 text-gray-600 text-xs sm:text-sm">
            <div className="flex items-center" data-testid={`trip-route-${trip.id}`}>
              <MapPin className="h-4 w-4 mr-2 text-ceylon-blue flex-shrink-0" />
              <span className="truncate">{trip.fromLocation} → {trip.toLocation}</span>
            </div>
            
            <div className="flex items-center" data-testid={`trip-datetime-${trip.id}`}>
              <Calendar className="h-4 w-4 mr-2 text-ceylon-blue flex-shrink-0" />
              <span>{new Date(trip.date).toLocaleDateString()} • {trip.time}</span>
            </div>
            
            <div className="flex items-center" data-testid={`trip-seats-${trip.id}`}>
              <Users className="h-4 w-4 mr-2 text-ceylon-blue flex-shrink-0" />
              <span>{trip.seatsAvailable} seats available</span>
            </div>
            
            <div className="flex items-center" data-testid={`trip-price-${trip.id}`}>
              {!trip.price || Number(trip.price) === 0 ? (
                <>
                  <span className="text-lg mr-2">💚</span>
                  <span className="font-semibold text-ceylon-green">Free Trip</span>
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2 text-ceylon-blue flex-shrink-0" />
                  <span className="font-semibold text-ceylon-green">LKR {trip.price}/person</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-2" data-testid={`trip-organizer-${trip.id}`}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={trip.organizer?.profileImageUrl || generateRandomProfilePicture(trip.organizer?.id)} />
                <AvatarFallback className="text-xs">
                  {trip.organizer ? getInitials(trip.organizer) : 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs sm:text-sm text-gray-600 truncate max-w-[100px] sm:max-w-[120px]">
                {trip.organizer ? getDisplayName(trip.organizer) : 'Unknown'}
              </span>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              {user && (
                <>
                  <Button
                    size="sm"
                    variant={trip.isInterested ? "default" : "outline"}
                    className={`text-xs px-2 py-1 transition-all duration-200 ${
                      trip.isInterested 
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500' 
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={handleInterest}
                    disabled={interestMutation.isPending}
                    data-testid={`button-interested-${trip.id}`}
                    title={trip.isInterested ? "Remove interest" : "Mark as interested"}
                  >
                    {interestMutation.isPending ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : trip.isInterested ? (
                      <span>⭐</span>
                    ) : (
                      <StarOff className="h-3 w-3" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant={trip.isPinned ? "default" : "outline"}
                    className={`text-xs px-2 py-1 transition-all duration-200 ${
                      trip.isPinned 
                        ? 'bg-orange-500 text-white hover:bg-orange-600 border-orange-500' 
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={handlePin}
                    disabled={pinMutation.isPending}
                    data-testid={`button-pin-${trip.id}`}
                    title={trip.isPinned ? "Unpin trip" : "Pin trip"}
                  >
                    {pinMutation.isPending ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : trip.isPinned ? (
                      <span>📌</span>
                    ) : (
                      <PinOff className="h-3 w-3" />
                    )}
                  </Button>
                </>
              )}
              
              {/* Owner-only actions */}
              {isOwner && (
                <ActionsMenu
                  onEdit={handleEditTrip}
                  onDelete={handleDeleteTrip}
                  canEdit={true}
                  canDelete={true}
                  isDeleting={deleteTripMutation.isPending}
                  size="sm"
                />
              )}
              
              <Button 
                size="sm"
                className={`text-xs px-2 py-1 transition-all duration-200 ${user 
                  ? 'bg-ceylon-green text-white hover:bg-ceylon-green/90 shadow-sm hover:shadow-md' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
                onClick={handleContact}
                data-testid={`button-contact-${trip.id}`}
                title={user ? "Contact organizer" : "Sign in to contact"}
              >
                {user ? (
                  <Mail className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditContentDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSave={handleSaveEdit}
        isLoading={editTripMutation.isPending}
        title="Edit Trip"
        initialContent={{
          title: trip.title,
          body: trip.notes || '',
        }}
        fields={{
          title: true,
          body: true,
          content: false,
        }}
        contentType="trip"
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteTripMutation.isPending}
        itemType="trip"
        itemTitle={trip.title}
      />
    </Link>
  );
}
