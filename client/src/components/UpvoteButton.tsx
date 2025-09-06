import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUp } from 'lucide-react';
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

  // Reset state when props change
  useEffect(() => {
    setHasUpvoted(initialHasUpvoted);
    setScore(initialScore);
  }, [initialHasUpvoted, initialScore, itemId]);

  const toggleUpvoteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/upvotes/toggle', {
        method: 'POST',
        body: { itemType, itemId }
      });
    },
    onSuccess: (data) => {
      // Update local state with server response
      setHasUpvoted(data.hasUpvoted);
      setScore(data.score);

      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      if (itemType === 'question') {
        queryClient.invalidateQueries({ queryKey: ['/api/questions', itemId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/questions'] }); // Answers are part of question data
      }
    },
    onError: (error) => {
      // Revert optimistic update
      setHasUpvoted(!hasUpvoted);
      setScore(hasUpvoted ? score - 1 : score + 1);

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
    // Optimistic update
    const newHasUpvoted = !hasUpvoted;
    const newScore = newHasUpvoted ? score + 1 : score - 1;
    
    setHasUpvoted(newHasUpvoted);
    setScore(newScore);
    
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
      <ArrowUp 
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