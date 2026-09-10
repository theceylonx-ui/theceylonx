import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface ChatButtonProps {
  tripId: string;
  userId: string;
  organizerId: string;
  currentUserId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function ChatButton({
  tripId,
  userId,
  organizerId,
  currentUserId,
  variant = "default",
  size = "default",
  className = ""
}: ChatButtonProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Only show for organizers
  const isOrganizer = currentUserId === organizerId;
  const isTargetingDifferentUser = userId !== currentUserId;

  // Open chat thread mutation (organizer only)
  const openChatMutation = useMutation({
    mutationFn: async (): Promise<{ thread: { id: string }; existed: boolean }> => {
      const response = await apiRequest("POST", "/api/chat/threads/open", {
        tripId,
        userId,
      });
      return await response.json() as { thread: { id: string }; existed: boolean };
    },
    onSuccess: (data) => {
      // Navigate to the chat thread
      setLocation(`/chat/${data.thread.id}`);
      
      // Show success message
      toast({
        title: data.existed ? "Chat reopened" : "Chat started",
        description: data.existed 
          ? "Redirecting to existing conversation"
          : "New chat conversation started",
      });

      // Invalidate chat threads to refresh the list
      queryClient.invalidateQueries({
        queryKey: ["/api/chat/threads"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start chat",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenChat = () => {
    if (openChatMutation.isPending) return;
    openChatMutation.mutate();
  };

  // Don't render if not organizer or targeting same user
  if (!isOrganizer || !isTargetingDifferentUser) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleOpenChat}
      disabled={openChatMutation.isPending}
      className={className}
      data-testid="chat-button"
    >
      {openChatMutation.isPending ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <MessageCircle className="w-4 h-4 mr-2" />
      )}
      {openChatMutation.isPending ? "Starting..." : "Start Chat"}
    </Button>
  );
}

// Simpler version for just checking if chat exists and navigating
interface ChatLinkButtonProps {
  tripId: string;
  currentUserId: string;
  otherUserId: string;
  organizerId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export function ChatLinkButton({
  tripId,
  currentUserId,
  otherUserId,
  organizerId,
  variant = "outline",
  size = "sm",
  className = "",
  children
}: ChatLinkButtonProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    // Navigate to chat page - the ChatPage will handle finding/creating the thread
    setLocation(`/chat`);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
      data-testid="chat-link-button"
    >
      {children || (
        <>
          <MessageCircle className="w-4 h-4 mr-2" />
          Chat
        </>
      )}
    </Button>
  );
}