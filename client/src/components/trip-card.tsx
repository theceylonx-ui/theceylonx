import { Link } from "wouter";
import { MapPin, Calendar, Users, DollarSign, Mail, Lock, Pin, PinOff, Star, StarOff, Zap, Clock, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { UserDisplay } from "@/components/ui/user-display";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TripWithOrganizer } from "@shared/types/api";
import { ActionsMenu } from "@/components/ActionsMenu";
import { EditContentDialog } from "@/components/EditContentDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { SaveControl } from "@/components/SaveControl";
import { createTripDetailLink } from "@/utils/searchParams";
import { useState, useCallback, useEffect } from "react";
import { NeonBadge } from "@/components/ui/neon-badge";
import { LazyImage } from "@/components/common/LazyImage";
import newLogo from "@assets/Copy of CEY  X Letter Digital Company Logo.png";

function useCountdownHours(expiresAt: string | Date | null | undefined): number | null {
  const [hoursLeft, setHoursLeft] = useState<number | null>(null);
  
  useEffect(() => {
    if (!expiresAt) {
      setHoursLeft(null);
      return;
    }
    
    const calc = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
    };
    
    setHoursLeft(calc());
    const interval = setInterval(() => setHoursLeft(calc()), 60 * 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);
  
  return hoursLeft;
}

interface TripCardProps {
  trip: TripWithOrganizer & { isPinned?: boolean; isInterested?: boolean; tripType?: 'quick' | 'detailed'; expiresAt?: string | Date | null };
  badges?: string[];
}

export default function TripCard({ trip, badges }: TripCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const isQuickTrip = (trip as any).tripType === 'quick';
  const hoursLeft = useCountdownHours(isQuickTrip ? (trip as any).expiresAt : null);
  
  const isSampleTrip = trip.id.startsWith('sample-') || trip.organizer?.email === 'system@ceylonexpand.com';

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

  const [quickInterestSent, setQuickInterestSent] = useState(false);

  const quickTripInterestMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/quick-trips/${trip.id}/interest`, {});
    },
    onSuccess: () => {
      setQuickInterestSent(true);
      toast({
        title: 'Interest Sent!',
        description: 'The trip organizer has been notified.',
      });
    },
    onError: (error: any) => {
      if (error?.status === 409) {
        setQuickInterestSent(true);
        toast({
          title: 'Already Interested',
          description: 'You have already shown interest in this trip.',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to send interest',
          variant: 'destructive',
        });
      }
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

  const handlePin = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      window.location.href = '/auth/signin';
      return;
    }
    
    // Check if user is trip owner - show friendly message and do nothing
    if (user.id === trip.organizer.id) {
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
  }, [user, trip.organizer.id, trip.isPinned, trip.isInterested, toast, interestMutation, pinMutation]);

  const handleInterest = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      window.location.href = '/auth/signin';
      return;
    }
    
    // Check if user is trip owner - show friendly message and do nothing
    if (user.id === trip.organizer.id) {
      toast({
        title: 'This is your own trip',
        description: 'You cannot mark interest on trips you organize',
      });
      return;
    }
    
    interestMutation.mutate(!trip.isInterested);
  }, [user, trip.organizer.id, trip.isInterested, toast, interestMutation]);

  // Removed handleContact function as View button now uses Link navigation

  const handleEditTrip = useCallback(() => {
    setShowEditDialog(true);
  }, []);

  const handleDeleteTrip = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const handleSaveEdit = useCallback((content: any) => {
    editTripMutation.mutate(content);
  }, [editTripMutation]);

  const handleConfirmDelete = useCallback(() => {
    deleteTripMutation.mutate();
  }, [deleteTripMutation]);

  // Check if current user is the trip organizer
  const isOwner = user && user.id === trip.organizer.id;

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
    // Priority 1: Use user-uploaded images from mediaUrls
    if (trip.mediaUrls && trip.mediaUrls.length > 0) {
      const coverIndex = trip.coverImageIndex || 0;
      const coverImageUrl = trip.mediaUrls[Math.min(coverIndex, trip.mediaUrls.length - 1)];
      
      // Debug logging
      console.log('Trip mediaUrls:', trip.mediaUrls);
      console.log('Cover index:', coverIndex);
      console.log('Selected image URL:', coverImageUrl);
      
      return coverImageUrl;
    }
    
    // Priority 2: Use database imageUrl (fallback or external image)
    if (trip.imageUrl) {
      console.log('Using trip.imageUrl:', trip.imageUrl);
      // If it's a local asset path, ensure it works in both dev and production
      if (trip.imageUrl.startsWith('/assets/')) {
        return trip.imageUrl;
      }
      return trip.imageUrl;
    }
    
    // Priority 3: Ceylon Expand logo as fallback
    console.log('Using fallback image');
    return newLogo;
  };

  const tripDetailLink = isQuickTrip 
    ? `/quick-trips/${trip.id}` 
    : createTripDetailLink(trip.id, true);

  return (
    <Link href={tripDetailLink}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group border-0 shadow-sm" data-testid={`trip-card-${trip.id}`}>
        <div className="relative">
          {getTripImage() === newLogo && !trip.mediaUrls?.length && !trip.imageUrl ? (
            // Beautiful Ceylon Expand fallback design
            <div className="w-full h-48 bg-gradient-to-br from-ceylon-green via-ceylon-blue to-purple-600 flex flex-col items-center justify-center relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4 w-8 h-8 border-2 border-white rounded-full"></div>
                <div className="absolute top-12 right-8 w-4 h-4 border border-white rounded-full"></div>
                <div className="absolute bottom-8 left-12 w-6 h-6 border border-white rounded-full"></div>
                <div className="absolute bottom-4 right-4 w-3 h-3 bg-white rounded-full opacity-50"></div>
              </div>
              
              {/* Tribe icon */}
              <div className="text-white mb-2">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-sm">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  <circle cx="18" cy="8" r="2"/>
                  <circle cx="6" cy="8" r="2"/>
                  <path d="M18 10c-1.33 0-2.67.33-3.33 1H15v2h1.67c.66-.67 2-.33 3.33-1v-2z"/>
                  <path d="M6 10v2c1.33.67 2.67.33 3.33 1H11v-2H9.33C8.67 10.33 7.33 10 6 10z"/>
                </svg>
              </div>
              
              {/* Ceylon Expand text */}
              <div className="text-center text-white">
                <div className="text-lg font-bold tracking-wide drop-shadow-sm">Ceylon Expand</div>
                <div className="text-xs opacity-90 mt-1">Travel Together</div>
              </div>
            </div>
          ) : (
            <LazyImage 
              src={getTripImage()}
              alt={`${trip.region} travel photo of Sri Lanka - ${trip.fromLocation} to ${trip.toLocation}`}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              fallback={newLogo}
              onError={() => {
                console.log('LazyImage failed to load:', getTripImage());
                // Fallback handled by LazyImage component automatically
              }}
            />
          )}
          <div className="absolute top-3 right-3 flex gap-1.5">
            {isQuickTrip && (
              <Badge className="bg-orange-500 text-white border-0 shadow-md">
                <Zap className="w-3 h-3 mr-1" /> Quick
              </Badge>
            )}
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
            
            {isQuickTrip && hoursLeft !== null && (
              <div className="mb-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span className="text-sm font-medium text-orange-700">
                  {hoursLeft > 0 ? `Expires in ${hoursLeft}h` : 'Expiring soon'}
                </span>
                <span className="text-xs text-orange-500 ml-auto">Quick Trip</span>
              </div>
            )}
            
            {isSampleTrip && (
              <div className="mb-2">
                <NeonBadge text="🎯 Sample Trip" className="mb-1" />
              </div>
            )}
            
            {/* Category badge */}
            <div className="flex flex-wrap gap-2 mb-2">
              {trip.category && trip.category !== 'unknown' && (
                <Badge 
                  variant="outline" 
                  className="text-xs text-ceylon-blue border-ceylon-blue/30 bg-ceylon-blue/5"
                  data-testid={`trip-category-${trip.id}`}
                >
                  {trip.category.charAt(0).toUpperCase() + trip.category.slice(1)}
                </Badge>
              )}
              
              {/* Display other badges if available */}
              {badges && badges.length > 0 && (
                <>
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
                </>
              )}
            </div>
          </div>
          
          <div className="space-y-2 sm:space-y-3 mb-4 text-gray-600 text-xs sm:text-sm">
            <div className="flex items-center" data-testid={`trip-route-${trip.id}`}>
              <MapPin className="h-4 w-4 mr-2 text-brand flex-shrink-0" />
              <span className="truncate text-text-primary">{trip.fromLocation} → {trip.toLocation}</span>
            </div>
            
            <div className="flex items-center" data-testid={`trip-datetime-${trip.id}`}>
              <Calendar className="h-4 w-4 mr-2 text-brand flex-shrink-0" />
              <span className="text-text-secondary">{trip.date ? (() => { const d = new Date(trip.date); return isNaN(d.getTime()) ? 'Date TBD' : d.toLocaleDateString(); })() : 'Date TBD'} • {trip.time}</span>
            </div>
            
            <div className="flex items-center" data-testid={`trip-seats-${trip.id}`}>
              <Users className="h-4 w-4 mr-2 text-brand flex-shrink-0" />
              <span className="text-text-secondary">{trip.seatsAvailable} seats available</span>
            </div>
            
            <div className="flex items-center" data-testid={`trip-price-${trip.id}`}>
              {isQuickTrip ? (
                (trip as any).isFree === false && (trip as any).seatPrice ? (
                  <>
                    <DollarSign className="h-4 w-4 mr-2 text-brand flex-shrink-0" />
                    <span className="font-semibold text-brand">LKR {Number((trip as any).seatPrice).toLocaleString()}/seat</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg mr-2">💚</span>
                    <span className="font-semibold text-brand">Free Trip</span>
                  </>
                )
              ) : !trip.price || Number(trip.price) === 0 ? (
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
          
          {/* Trip Footer with Clean Two-Row Layout */}
          <div className="border-t border-ui-line mt-6 pt-4 space-y-4">
            {/* Row 1: Organizer Info */}
            <div className="flex items-center" data-testid={`trip-organizer-${trip.id}`}>
              <div 
                className="hover:opacity-80 transition-opacity cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `/profile/${trip.organizer?.username || trip.organizer?.id}`;
                }}
              >
                <UserDisplay 
                  user={trip.organizer}
                  avatarSize="lg"
                  className="gap-3"
                  nameClassName="text-sm font-medium text-text-primary"
                />
              </div>
            </div>
            
            {/* Row 2: Action Buttons - Well Spaced */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user && !isOwner && !isQuickTrip && (
                  <SaveControl 
                    tripId={trip.id} 
                    variant="compact" 
                    className=""
                    data-testid={`save-control-${trip.id}`}
                  />
                )}

                {isQuickTrip && user && !isOwner && (
                  <Button
                    size="sm"
                    variant={quickInterestSent ? "outline" : "default"}
                    className={quickInterestSent 
                      ? "text-sm px-3 py-2 text-green-600 border-green-300 bg-green-50 h-9" 
                      : "text-sm px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white h-9"}
                    disabled={quickInterestSent || quickTripInterestMutation.isPending}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!quickInterestSent) {
                        quickTripInterestMutation.mutate();
                      }
                    }}
                  >
                    {quickInterestSent ? (
                      <><Heart className="w-3.5 h-3.5 mr-1 fill-green-600" /> Interested</>
                    ) : quickTripInterestMutation.isPending ? (
                      <><div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-1" /> Sending...</>
                    ) : (
                      <><Heart className="w-3.5 h-3.5 mr-1" /> I'm Interested</>
                    )}
                  </Button>
                )}
                
                {/* Owner-only actions */}
                {isOwner && !isQuickTrip && (
                  <ActionsMenu
                    onEdit={handleEditTrip}
                    onDelete={handleDeleteTrip}
                    canEdit={true}
                    canDelete={true}
                    isDeleting={deleteTripMutation.isPending}
                    size="sm"
                  />
                )}
              </div>
              
              <Button 
                size="sm"
                className="text-sm px-6 py-2.5 bg-brand text-white hover:bg-brand-hover font-medium h-10 shadow-sm"
                data-testid={`button-view-${trip.id}`}
                title="View trip details"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = isQuickTrip ? `/quick-trips/${trip.id}` : createTripDetailLink(trip.id);
                }}
              >
                View Details
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
