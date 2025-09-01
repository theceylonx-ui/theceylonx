import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

interface JoinRequestButtonProps {
  tripId: string;
  isAuthenticated: boolean;
  isOwner: boolean;
  hasExistingRequest?: boolean;
}

export function JoinRequestButton({ 
  tripId, 
  isAuthenticated, 
  isOwner, 
  hasExistingRequest = false 
}: JoinRequestButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const joinRequestMutation = useMutation({
    mutationFn: async (requestMessage: string) => {
      console.log("Attempting to join trip:", tripId, "with message:", requestMessage);
      try {
        const response = await apiRequest("POST", `/api/trips/${tripId}/join`, { 
          message: requestMessage 
        });
        console.log("Join request successful:", response);
        return response;
      } catch (error) {
        console.error("Join request failed:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Join Request Sent!",
        description: "Your request has been sent to the trip organizer. They'll be notified and can approve or decline your request.",
      });
      setIsOpen(false);
      setMessage("");
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId, "existing-request"] });
    },
    onError: (error: any) => {
      console.error("Join request error:", error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to join trips. Redirecting...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth/signin";
        }, 1000);
        return;
      }
      
      const errorMessage = error?.message || "Failed to send join request. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    joinRequestMutation.mutate(message);
  };

  // Don't show if user is the trip owner
  if (isOwner) {
    return null;
  }

  // Show different states based on authentication and existing request
  if (!isAuthenticated) {
    return (
      <Button 
        onClick={() => window.location.href = "/auth/signin"}
        className="w-full"
        data-testid="button-signin-to-join"
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Sign In to Join Trip
      </Button>
    );
  }

  if (hasExistingRequest) {
    return (
      <Button 
        disabled
        variant="secondary"
        className="w-full"
        data-testid="button-request-pending"
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        Request Pending
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="w-full"
          data-testid="button-join-trip"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Join This Trip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request to Join Trip</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="message">Message to Organizer (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Tell the organizer why you'd like to join this trip..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              data-testid="textarea-join-message"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              data-testid="button-cancel-join"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={joinRequestMutation.isPending}
              data-testid="button-send-request"
            >
              {joinRequestMutation.isPending ? "Sending..." : "Send Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}