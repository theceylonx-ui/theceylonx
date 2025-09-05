import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Heart, Pin, ChevronDown } from 'lucide-react';
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
    mutationFn: async (saveType: 'pinned' | 'interested'): Promise<SaveResponse> => {
      return apiRequest(`/api/trips/${tripId}/save`, {
        method: 'POST',
        body: { saveType },
      });
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
        description: `Trip ${saveType === 'pinned' ? 'pinned' : 'marked as interested'} successfully`,
      });
    },
    onError: (error, saveType) => {
      // Revert optimistic update
      setOptimisticSave(null);
      console.error('Error saving trip:', error);
      toast({
        title: 'Save Failed',
        description: `Failed to ${saveType === 'pinned' ? 'pin' : 'mark as interested'} trip`,
        variant: 'destructive',
      });
    },
  });

  // Remove save mutation
  const removeMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      return apiRequest(`/api/trips/${tripId}/save`, {
        method: 'DELETE',
      });
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

  const handleSave = (saveType: 'pinned' | 'interested') => {
    saveMutation.mutate(saveType);
  };

  const handleRemove = () => {
    removeMutation.mutate();
  };

  const isPending = saveMutation.isPending || removeMutation.isPending;

  if (isLoading) {
    return (
      <Button 
        variant="outline" 
        size={variant === 'compact' ? 'sm' : 'default'} 
        disabled 
        className={className}
        data-testid="save-control-loading"
      >
        <Heart className="w-4 h-4" />
      </Button>
    );
  }

  // If trip is already saved, show current state with option to remove or change
  if (currentStatus?.isSaved) {
    const icon = currentStatus.saveType === 'pinned' ? 
      <Pin className="w-4 h-4 fill-current" /> : 
      <Heart className="w-4 h-4 fill-current" />;

    if (variant === 'compact') {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRemove}
          disabled={isPending}
          className={`${className} text-primary border-primary bg-primary/5`}
          data-testid={`save-control-${currentStatus.saveType}`}
        >
          {icon}
        </Button>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={isPending}
            className={`${className} text-primary border-primary bg-primary/5`}
            data-testid={`save-control-${currentStatus.saveType}`}
          >
            {icon}
            <span className="ml-1 capitalize">{currentStatus.saveType}</span>
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={() => handleSave('pinned')}
            disabled={currentStatus.saveType === 'pinned'}
            data-testid="save-option-pinned"
          >
            <Pin className="w-4 h-4 mr-2" />
            Pin Trip
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleSave('interested')}
            disabled={currentStatus.saveType === 'interested'}
            data-testid="save-option-interested"
          >
            <Heart className="w-4 h-4 mr-2" />
            Mark as Interested
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleRemove}
            className="text-destructive"
            data-testid="save-option-remove"
          >
            Remove from Saved
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // If trip is not saved, show dropdown to choose save type
  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            className={className}
            data-testid="save-control-unsaved"
          >
            <Heart className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={() => handleSave('pinned')}
            data-testid="save-option-pinned"
          >
            <Pin className="w-4 h-4 mr-2" />
            Pin Trip
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleSave('interested')}
            data-testid="save-option-interested"
          >
            <Heart className="w-4 h-4 mr-2" />
            Mark as Interested
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={isPending}
          className={className}
          data-testid="save-control-unsaved"
        >
          <Heart className="w-4 h-4 mr-2" />
          Save Trip
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleSave('pinned')}
          data-testid="save-option-pinned"
        >
          <Pin className="w-4 h-4 mr-2" />
          Pin Trip
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleSave('interested')}
          data-testid="save-option-interested"
        >
          <Heart className="w-4 h-4 mr-2" />
          Mark as Interested
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}