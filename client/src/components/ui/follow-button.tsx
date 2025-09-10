import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, HeartOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FollowButtonProps {
  userId: string;
}

export function FollowButton({ userId }: FollowButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if currently following
  const { data: isFollowing, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}/following-status`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/following-status`);
      if (!response.ok) throw new Error("Failed to check follow status");
      const data = await response.json();
      return data.isFollowing;
    },
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/users/${userId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/following-status`] });
      toast({
        title: "Following",
        description: "You will be notified when this user posts new trips.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to follow user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/users/${userId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/following-status`] });
      toast({
        title: "Unfollowed",
        description: "You will no longer receive notifications from this user.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to unfollow user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFollowClick = () => {
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        <Heart className="h-4 w-4 mr-2" />
        Follow
      </Button>
    );
  }

  return (
    <Button 
      variant={isFollowing ? "default" : "outline"}
      onClick={handleFollowClick}
      disabled={followMutation.isPending || unfollowMutation.isPending}
      data-testid={`follow-button-${userId}`}
      className={isFollowing ? "bg-green-600 hover:bg-green-700" : ""}
    >
      {isFollowing ? (
        <>
          <HeartOff className="h-4 w-4 mr-2" />
          Unfollow
        </>
      ) : (
        <>
          <Heart className="h-4 w-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
}