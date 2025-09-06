import { Link } from "wouter";
import { MapPin, Calendar, Users, DollarSign, Mail, Lock, Pin, PinOff, Star, StarOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { UserDisplay } from "@/components/ui/user-display";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TripWithNormalizedOrganizer } from "@shared/schema";
import { ActionsMenu } from "@/components/ActionsMenu";
import { EditContentDialog } from "@/components/EditContentDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { SaveControl } from "@/components/SaveControl";
import { createTripDetailLink } from "@/utils/searchParams";
import { useState } from "react";

interface TripCardProps {
  trip: TripWithNormalizedOrganizer & { isPinned?: boolean; isInterested?: boolean };
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
      if (pinned) {
        const response = await apiRequest('POST', `/api/trips/${trip.id}/pin`, {});
        return response;
      } else {
        const response = await apiRequest('DELETE', `/api/trips/${trip.id}/pin`, {});
        return response;
      }
    },
    onMutate: async (pinned) => {
      // Cancel ALL trip-related queries
      await queryClient.cancelQueries({ queryKey: ['/api/trips'] });
      
      // Snapshot the previous value
      const previousTrips = queryClient.getQueryData(['/api/trips']);
      
      // Optimistically update ALL variations of trip queries
      queryClient.getQueriesData({ queryKey: ['/api/trips'] }).forEach(([queryKey, data]) => {
        if (data && typeof data === 'object' && 'trips' in data) {
          queryClient.setQueryData(queryKey, {
            ...data,
            trips: (data as any).trips.map((t: any) => 
              t.id === trip.id ? { ...t, isPinned: pinned } : t
            )
          });
        }
      });
      
      return { previousTrips };
    },
    onSuccess: async (response, pinned) => {
      // The new API returns 204 No Content for successful pin/unpin
      if (response.status === 204) {
        // Update ALL trip cache entries optimistically  
        queryClient.getQueriesData({ queryKey: ['/api/trips'] }).forEach(([queryKey, data]) => {
          if (data && typeof data === 'object' && 'trips' in data) {
            queryClient.setQueryData(queryKey, {
              ...data,
              trips: (data as any).trips.map((t: any) => 
                t.id === trip.id ? { 
                  ...t, 
                  isPinned: pinned
                } : t
              )
            });
          }
        });
        
        // Invalidate related endpoints to refresh from server
        queryClient.invalidateQueries({ queryKey: ['/api/user/pins'] });
        queryClient.invalidateQueries({ queryKey: ['/api/user/history'] });
        
        queryClient.invalidateQueries({ queryKey: ['/api/calendar/aggregate'] });
        
        toast({
          title: pinned ? 'Trip pinned!' : 'Trip unpinned',
          description: pinned ? 'Trip added to your pins' : 'Trip removed from your pins',
        });
      }
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
      if (interested) {
        const response = await apiRequest('POST', `/api/trips/${trip.id}/interest`, {});
        return response;
      } else {
        const response = await apiRequest('POST', `/api/trips/${trip.id}/interest/withdraw`, {});
        return response;
      }
    },
    onMutate: async (interested) => {
      // Cancel ALL trip-related queries
      await queryClient.cancelQueries({ queryKey: ['/api/trips'] });
      
      // Snapshot the previous value
      const previousTrips = queryClient.getQueryData(['/api/trips']);
      
      // Optimistically update ALL variations of trip queries
      queryClient.getQueriesData({ queryKey: ['/api/trips'] }).forEach(([queryKey, data]) => {
        if (data && typeof data === 'object' && 'trips' in data) {
          queryClient.setQueryData(queryKey, {
            ...data,
            trips: (data as any).trips.map((t: any) => 
              t.id === trip.id ? { 
                ...t, 
                isInterested: interested,
                isPinned: interested ? false : t.isPinned // Force pinned=false when interested=true
              } : t
            )
          });
        }
      });
      
      return { previousTrips };
    },
    onSuccess: async (response, interested) => {
      // Handle different response types from new API
      if (response.status === 201 || response.status === 409 || response.status === 204) {
        // Update ALL trip cache entries optimistically  
        queryClient.getQueriesData({ queryKey: ['/api/trips'] }).forEach(([queryKey, data]) => {
          if (data && typeof data === 'object' && 'trips' in data) {
            queryClient.setQueryData(queryKey, {
              ...data,
              trips: (data as any).trips.map((t: any) => 
                t.id === trip.id ? { 
                  ...t, 
                  isInterested: interested
                } : t
              )
            });
          }
        });
        
        // Invalidate related endpoints to refresh from server
        queryClient.invalidateQueries({ queryKey: ['/api/user/pins'] });
        queryClient.invalidateQueries({ queryKey: ['/api/user/history'] });
        queryClient.invalidateQueries({ queryKey: ['/api/calendar/aggregate'] });
        
        toast({
          title: interested ? 'Interest request created!' : 'Interest withdrawn',
          description: interested 
            ? 'Your interest has been recorded' 
            : 'Interest removed from this trip',
        });
      }
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
    
    // Check if user is trip owner - show friendly message and do nothing
    if (user.id === trip.organizerId) {
      toast({
        title: 'This is your own trip',
        description: 'You cannot pin trips you organize',
      });
      return;
    }
    
    // If trying to pin but trip is interested, automatically remove interest and pin
    if (!trip.isPinned && trip.isInterested) {
      toast({
        title: 'Switching to Pin',
        description: 'Removing interest to pin this trip',
      });
      // First unmark interest, then pin
      interestMutation.mutate(false, {
        onSuccess: () => {
          // After successfully removing interest, pin the trip
          pinMutation.mutate(true);
        }
      });
    } else {
      pinMutation.mutate(!trip.isPinned);
    }
  };

  const handleInterest = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      window.location.href = '/auth/signin';
      return;
    }
    
    // Check if user is trip owner - show friendly message and do nothing
    if (user.id === trip.organizerId) {
      toast({
        title: 'This is your own trip',
        description: 'You cannot mark interest on trips you organize',
      });
      return;
    }
    
    interestMutation.mutate(!trip.isInterested);
  };

  // Removed handleContact function as View button now uses Link navigation

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
    // Priority 1: Use database image (user uploaded or Ceylon Expand logo)
    if (trip.imageUrl) {
      // If it's a local asset path, ensure it works in both dev and production
      if (trip.imageUrl.startsWith('/assets/')) {
        return trip.imageUrl;
      }
      return trip.imageUrl;
    }
    
    // Priority 2: Ceylon Expand logo as fallback (no more regional images)
    return '/assets/5_1756417819316.png';
  };

  // Create the trip detail link with preserved search state
  const tripDetailLink = createTripDetailLink(trip.id, true);

  return (
    <Link href={tripDetailLink}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group border-0 shadow-sm" data-testid={`trip-card-${trip.id}`}>
        <div className="relative">
          <img 
            src={getTripImage()}
            alt={`${trip.region} travel photo of Sri Lanka - ${trip.fromLocation} to ${trip.toLocation}`}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              // Fallback to Ceylon Expand logo if image fails
              e.currentTarget.src = '/assets/5_1756417819316.png';
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
            <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-2 line-clamp-2 hover:text-brand transition-colors" data-testid={`trip-title-${trip.id}`}>
              {trip.title}
            </h3>
            
            {/* Display badges if available */}
            {badges && badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2" data-testid={`trip-badges-${trip.id}`}>
                {badges.slice(0, 2).map((badge, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs bg-brand-subtle text-brand border-brand/20"
                  >
                    {badge}
                  </Badge>
                ))}
                {badges.length > 2 && (
                  <Badge variant="outline" className="text-xs text-text-muted border-ui-line">
                    +{badges.length - 2} more
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <div className="space-y-2 sm:space-y-3 mb-4 text-gray-600 text-xs sm:text-sm">
            <div className="flex items-center" data-testid={`trip-route-${trip.id}`}>
              <MapPin className="h-4 w-4 mr-2 text-brand flex-shrink-0" />
              <span className="truncate text-text-primary">{trip.fromLocation} → {trip.toLocation}</span>
            </div>
            
            <div className="flex items-center" data-testid={`trip-datetime-${trip.id}`}>
              <Calendar className="h-4 w-4 mr-2 text-brand flex-shrink-0" />
              <span className="text-text-secondary">{new Date(trip.date).toLocaleDateString()} • {trip.time}</span>
            </div>
            
            <div className="flex items-center" data-testid={`trip-seats-${trip.id}`}>
              <Users className="h-4 w-4 mr-2 text-brand flex-shrink-0" />
              <span className="text-text-secondary">{trip.seatsAvailable} seats available</span>
            </div>
            
            <div className="flex items-center" data-testid={`trip-price-${trip.id}`}>
              {!trip.price || Number(trip.price) === 0 ? (
                <>
                  <span className="text-lg mr-2">💚</span>
                  <span className="font-semibold text-brand">Free Trip</span>
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2 text-brand flex-shrink-0" />
                  <span className="font-semibold text-brand">LKR {trip.price}/person</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div data-testid={`trip-organizer-${trip.id}`}>
              <Link href={`/profile/${trip.organizerId}`} className="hover:opacity-80 transition-opacity">
                <UserDisplay 
                  user={trip.organizer}
                  avatarSize="md"
                  className="gap-2"
                  nameClassName="text-xs sm:text-sm text-gray-600 truncate max-w-[100px] sm:max-w-[120px]"
                />
              </Link>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              {user && (
                <>
                  {!isOwner && (
                    <SaveControl 
                      tripId={trip.id} 
                      variant="compact" 
                      className="text-xs"
                      data-testid={`save-control-${trip.id}`}
                    />
                  )}
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
                className="text-xs px-3 py-1.5 bg-brand text-white hover:bg-brand-hover font-medium"
                data-testid={`button-view-${trip.id}`}
                title="View trip details"
                asChild
              >
                <Link href={createTripDetailLink(trip.id, {
                  from: trip.fromLocation,
                  to: trip.toLocation
                })}>
                  View
                </Link>
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
