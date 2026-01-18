import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Pin, Star } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SaveControlProps {
  tripId: string;
  variant?: 'default' | 'compact';
  className?: string;
}

interface SaveStatus {
  isSaved: boolean;
  saveType: 'pinned' | 'interested' | null;
  savedAt: string | null;
}

interface SaveResponse {
  message: string;
  savedTrip: {
    id: string;
    saveType: 'pinned' | 'interested';
    savedAt: string;
  };
}

export function SaveControl({ tripId, variant = 'default', className = '' }: SaveControlProps) {
  const [optimisticSave, setOptimisticSave] = useState<SaveStatus | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch current save status
  const { data: saveStatus, isLoading } = useQuery<SaveStatus>({
    queryKey: [`/api/trips/${tripId}/save-status`],
    enabled: !!tripId,
  });

  // Display either optimistic state or actual state
  const currentStatus = optimisticSave || saveStatus;

  // Save trip mutation
  const saveMutation = useMutation({
    mutationFn: async (saveType: 'pinned'): Promise<SaveResponse> => {
      const response = await apiRequest('POST', `/api/trips/${tripId}/save`, { saveType });
      return await response.json();
    },
    onMutate: async (saveType) => {
      // Optimistic update
      setOptimisticSave({
        isSaved: true,
        saveType,
        savedAt: new Date().toISOString(),
      });
    },
    onSuccess: (data, saveType) => {
      // Clear optimistic state and invalidate cache
      setOptimisticSave(null);
      queryClient.invalidateQueries({ queryKey: [`/api/trips/${tripId}/save-status`] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/saved-trips'] });
      
      toast({
        title: 'Trip Saved',
        description: `Trip pinned successfully`,
      });
    },
    onError: (error, saveType) => {
      // Revert optimistic update
      setOptimisticSave(null);
      console.error('Error saving trip:', error);
      toast({
        title: 'Save Failed',
        description: `Failed to pin trip`,
        variant: 'destructive',
      });
    },
  });

  // Remove save mutation
  const removeMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      await apiRequest('DELETE', `/api/trips/${tripId}/save`, {});
    },
    onMutate: async () => {
      // Optimistic update
      setOptimisticSave({
        isSaved: false,
        saveType: null,
        savedAt: null,
      });
    },
    onSuccess: () => {
      // Clear optimistic state and invalidate cache
      setOptimisticSave(null);
      queryClient.invalidateQueries({ queryKey: [`/api/trips/${tripId}/save-status`] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/saved-trips'] });
      
      toast({
        title: 'Trip Removed',
        description: 'Trip removed from your saved list',
      });
    },
    onError: (error) => {
      // Revert optimistic update
      setOptimisticSave(null);
      console.error('Error removing saved trip:', error);
      toast({
        title: 'Remove Failed',
        description: 'Failed to remove trip from saved list',
        variant: 'destructive',
      });
    },
  });

  const handleSave = (saveType: 'pinned') => {
    if (currentStatus?.isSaved && currentStatus.saveType === saveType) {
      // If already saved with same type, remove it
      removeMutation.mutate();
    } else {
      // Save with new type
      saveMutation.mutate(saveType);
    }
  };

  const isPending = saveMutation.isPending || removeMutation.isPending;
  const isCompact = variant === 'compact';

  if (isLoading) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Button 
          variant="outline" 
          size={isCompact ? 'sm' : 'default'} 
          disabled 
          className={isCompact ? 'text-xs px-2 py-1' : ''}
          data-testid="pin-button-loading"
        >
          <Pin className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  const isPinned = currentStatus?.isSaved && currentStatus.saveType === 'pinned';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Pin Button */}
      <Button
        variant={isPinned ? 'default' : 'outline'}
        size={isCompact ? 'sm' : 'default'}
        onClick={() => handleSave('pinned')}
        disabled={isPending}
        className={`${isCompact ? 'h-11 w-11 p-0 min-h-[44px] min-w-[44px]' : 'h-11 w-11 p-0 min-h-[44px] min-w-[44px]'} transition-all duration-200 ${
          isPinned 
            ? 'bg-orange-500 text-white hover:bg-orange-600 border-orange-500 shadow-md' 
            : 'border-ui-line text-text-muted hover:bg-ui-surface hover:border-orange-400'
        }`}
        data-testid={`pin-button-${tripId}`}
        title={isPinned ? "Unpin trip" : "Pin trip"}
      >
        {isPending && currentStatus?.saveType === 'pinned' ? (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : isPinned ? (
          <span className="text-orange-200">📌</span>
        ) : (
          <Pin className="w-3 h-3" />
        )}
      </Button>
    </div>
  );
}