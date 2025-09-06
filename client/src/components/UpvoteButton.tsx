import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';

interface UpvoteButtonProps {
  itemType: 'question' | 'answer';
  itemId: string;
  initialScore?: number;
  initialHasUpvoted?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function UpvoteButton({
  itemType,
  itemId,
  initialScore = 0,
  initialHasUpvoted = false,
  className,
  size = 'md'
}: UpvoteButtonProps) {
  const [hasUpvoted, setHasUpvoted] = useState(initialHasUpvoted);
  const [score, setScore] = useState(initialScore);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current upvote status when component loads
  const { data: upvoteStatus } = useQuery({
    queryKey: [`/api/upvotes/${itemType}/${itemId}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/upvotes/${itemType}/${itemId}`);
      return response.json();
    },
    enabled: !!itemId,
  });

  // Update state when upvote status is fetched or props change
  useEffect(() => {
    if (upvoteStatus) {
      setHasUpvoted(upvoteStatus.hasUpvoted);
    } else {
      setHasUpvoted(initialHasUpvoted);
    }
    setScore(initialScore);
  }, [upvoteStatus, initialHasUpvoted, initialScore, itemId]);

  const toggleUpvoteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/upvotes/toggle', { itemType, itemId });
      return response.json();
    },
    onSuccess: (data) => {
      // Update local state with server response - this is the authoritative data
      setHasUpvoted(data.hasUpvoted);
      setScore(data.score);

      // Invalidate ALL relevant queries to force refetch with latest data
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      queryClient.invalidateQueries({ queryKey: [`/api/upvotes/${itemType}/${itemId}`] });
      
      // Force refresh the specific question data
      if (itemType === 'question') {
        queryClient.invalidateQueries({ queryKey: ['/api/questions', itemId] });
      }
      
      // Invalidate all upvote status queries to sync across components
      queryClient.invalidateQueries({ queryKey: ['/api/upvotes'] });
    },
    onError: (error) => {
      // Revert optimistic update to previous state
      setHasUpvoted(initialHasUpvoted);
      setScore(initialScore);

      if (isUnauthorizedError(error)) {
        toast({
          title: "Authentication Required",
          description: "Please log in to upvote content.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1500);
      } else {
        toast({
          title: "Error",
          description: "Failed to update upvote. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  const handleToggleUpvote = () => {
    // Disable optimistic updates to avoid race conditions
    // Let the server response be the source of truth
    toggleUpvoteMutation.mutate();
  };

  const sizeClasses = {
    sm: 'h-8 px-2 text-xs gap-1',
    md: 'h-10 px-3 text-sm gap-2',
    lg: 'h-12 px-4 text-base gap-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <button
      onClick={handleToggleUpvote}
      disabled={toggleUpvoteMutation.isPending}
      className={cn(
        // Base styles
        'inline-flex items-center rounded-lg border transition-all duration-200',
        'hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
        
        // Size classes
        sizeClasses[size],
        
        // State-based styles
        hasUpvoted
          ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300',
        
        // Disabled state
        toggleUpvoteMutation.isPending && 'opacity-60 cursor-not-allowed',
        
        className
      )}
      title={hasUpvoted ? "Remove upvote" : "Upvote this content"}
      data-testid={`upvote-button-${itemType}-${itemId}`}
    >
      <ThumbsUp 
        className={cn(
          iconSizes[size], 
          'transition-transform duration-200',
          hasUpvoted && 'fill-current',
          toggleUpvoteMutation.isPending && 'animate-pulse'
        )} 
      />
      <span className="font-medium min-w-[1ch]">
        {score}
      </span>
    </button>
  );
}