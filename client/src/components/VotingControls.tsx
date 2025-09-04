import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface VotingControlsProps {
  votableType: 'question' | 'answer';
  votableId: string;
  currentScore: number;
  className?: string;
}

export default function VotingControls({ 
  votableType, 
  votableId, 
  currentScore, 
  className = "" 
}: VotingControlsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [optimisticScore, setOptimisticScore] = useState(currentScore);

  // Get current user's vote
  const { data: voteData } = useQuery<{ vote: any }>({
    queryKey: [`/api/votes/${votableType}/${votableId}`],
    enabled: !!user && !!votableId,
  });

  const currentVote = voteData?.vote;
  
  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (value: number): Promise<{ vote: any; score: number; message: string }> => {
      const response = await apiRequest('POST', '/api/votes', {
        votableType,
        votableId,
        value
      });
      return response as unknown as { vote: any; score: number; message: string };
    },
    onMutate: async (newValue) => {
      // Optimistic update
      const previousValue = currentVote?.voteType === 'up' ? 1 : (currentVote?.voteType === 'down' ? -1 : 0);
      const scoreDelta = newValue - previousValue;
      setOptimisticScore(prev => prev + scoreDelta);
    },
    onSuccess: (response) => {
      // Update actual score from server response
      setOptimisticScore(response.score);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [`/api/votes/${votableType}/${votableId}`] });
      if (votableType === 'question') {
        queryClient.invalidateQueries({ queryKey: [`/api/questions/${votableId}`] });
      } else {
        queryClient.invalidateQueries({ queryKey: [`/api/questions`] });
      }
      
      toast({ 
        title: response.message,
        description: `New score: ${response.score}`
      });
    },
    onError: (error) => {
      // Revert optimistic update
      setOptimisticScore(currentScore);
      toast({ 
        title: "Failed to process vote", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleVote = (value: number) => {
    if (!user) {
      toast({ 
        title: "Sign in required", 
        description: "Please sign in to vote",
        variant: "destructive" 
      });
      return;
    }
    
    // If clicking the same vote, clear it (set to 0)
    const currentUserVote = currentVote?.voteType === 'up' ? 1 : (currentVote?.voteType === 'down' ? -1 : 0);
    const finalValue = currentUserVote === value ? 0 : value;
    voteMutation.mutate(finalValue);
  };

  return (
    <div className={`flex items-center gap-1 ${className}`} data-testid="voting-controls">
      <Button
        variant={currentVote?.voteType === 'up' ? "default" : "outline"}
        size="sm"
        onClick={() => handleVote(1)}
        disabled={voteMutation.isPending}
        className="p-1.5 h-7 w-7"
        data-testid="upvote-button"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </Button>
      
      <span 
        className={`font-semibold text-sm min-w-[20px] text-center ${
          optimisticScore > 0 
            ? 'text-green-600 dark:text-green-400' 
            : optimisticScore < 0 
            ? 'text-red-600 dark:text-red-400'
            : 'text-gray-600 dark:text-gray-400'
        }`}
        data-testid="vote-score"
      >
        {optimisticScore}
      </span>
      
      <Button
        variant={currentVote?.voteType === 'down' ? "destructive" : "outline"}
        size="sm"
        onClick={() => handleVote(-1)}
        disabled={voteMutation.isPending}
        className="p-1.5 h-7 w-7"
        data-testid="downvote-button"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}