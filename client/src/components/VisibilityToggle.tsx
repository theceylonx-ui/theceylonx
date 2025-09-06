import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useUserContentStore, type TripStatus, type QuestionVisibility } from '@/store/userContentStore';
import { apiRequest } from '@/lib/queryClient';

interface VisibilityToggleProps {
  type: 'trip' | 'question';
  id: string;
  currentValue: boolean | string;
  disabled?: boolean;
}

export function VisibilityToggle({ type, id, currentValue, disabled = false }: VisibilityToggleProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    tripStatuses,
    questionVisibilities,
    isUpdatingTrip,
    isUpdatingQuestion,
    setTripStatus,
    setQuestionVisibility,
    revertTripStatus,
    revertQuestionVisibility,
    setTripUpdating,
    setQuestionUpdating,
  } = useUserContentStore();

  // Determine current state from store or props
  const isTrip = type === 'trip';
  const optimisticValue = isTrip 
    ? tripStatuses[id] 
    : questionVisibilities[id];
    
  const actualValue = optimisticValue !== undefined 
    ? optimisticValue 
    : currentValue;

  // Convert to boolean for switch
  const isChecked = isTrip 
    ? actualValue === 'active'
    : actualValue === 'public';

  const isLoading = isTrip ? isUpdatingTrip[id] : isUpdatingQuestion[id];

  // Trip status mutation
  const tripMutation = useMutation({
    mutationFn: async (newStatus: TripStatus) => {
      return apiRequest(`/api/trips/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-trips'] });
      queryClient.invalidateQueries({ queryKey: [`/api/trips/${id}`] });
      setTripUpdating(id, false);
    },
    onError: (error) => {
      console.error('Failed to update trip status:', error);
      revertTripStatus(id);
      setTripUpdating(id, false);
      toast({
        title: "Couldn't save",
        description: "Failed to update trip status. Try again.",
        variant: "destructive",
      });
    },
  });

  // Question visibility mutation
  const questionMutation = useMutation({
    mutationFn: async (newVisibility: QuestionVisibility) => {
      return apiRequest(`/api/questions/${id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: newVisibility }),
      });
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-questions'] });
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${id}`] });
      setQuestionUpdating(id, false);
    },
    onError: (error) => {
      console.error('Failed to update question visibility:', error);
      revertQuestionVisibility(id);
      setQuestionUpdating(id, false);
      toast({
        title: "Couldn't save",
        description: "Failed to update question visibility. Try again.",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (checked: boolean) => {
    if (disabled || isLoading) return;

    if (isTrip) {
      const newStatus: TripStatus = checked ? 'active' : 'inactive';
      setTripStatus(id, newStatus);
      setTripUpdating(id, true);
      tripMutation.mutate(newStatus);
    } else {
      const newVisibility: QuestionVisibility = checked ? 'public' : 'hidden';
      setQuestionVisibility(id, newVisibility);
      setQuestionUpdating(id, true);
      questionMutation.mutate(newVisibility);
    }
  };

  const getLabel = () => {
    return isTrip ? 'Trip Active' : 'Show Question';
  };

  const getHelperText = () => {
    if (isTrip) {
      return isChecked 
        ? 'Others can discover and join this trip.'
        : 'Hidden from discovery; only you can see it here.';
    } else {
      return isChecked
        ? 'Visible to the community.'
        : 'Hidden from the community; only you can see it here.';
    }
  };

  return (
    <div className="flex items-center justify-between space-x-3">
      <div className="flex-1">
        <Label 
          htmlFor={`visibility-${type}-${id}`}
          className="text-sm font-medium"
        >
          {getLabel()}
        </Label>
        <p className="text-xs text-muted-foreground mt-1">
          {getHelperText()}
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
        <Switch
          id={`visibility-${type}-${id}`}
          checked={isChecked}
          onCheckedChange={handleToggle}
          disabled={disabled || isLoading}
          aria-label={getLabel()}
          aria-describedby={`visibility-${type}-${id}-description`}
          data-testid={`switch-${type}-visibility-${id}`}
        />
      </div>
    </div>
  );
}