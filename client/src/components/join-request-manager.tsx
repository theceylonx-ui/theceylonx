import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, MessageSquare, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface JoinRequest {
  id: string;
  tripId: string;
  requesterId: string;
  message?: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  createdAt: string;
  updatedAt: string;
  requester: {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    profileImageUrl?: string;
  };
}

interface JoinRequestManagerProps {
  tripId: string;
  isOwner: boolean;
}

export function JoinRequestManager({ tripId, isOwner }: JoinRequestManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: joinRequests, isLoading } = useQuery<JoinRequest[]>({
    queryKey: ["/api/trips", tripId, "joins"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/trips/${tripId}/joins`);
      return response.json();
    },
    enabled: isOwner, // Only fetch if user is owner
  });

  const acceptJoinMutation = useMutation({
    mutationFn: async (joinId: string) => {
      return await apiRequest("POST", `/api/joins/${joinId}/accept`);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Join Request Accepted!",
        description: "A private chat has been created. You can now message with the traveler.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId, "joins"] });
      
      // Show option to open chat
      if (data.chatThreadId) {
        toast({
          title: "Chat Available",
          description: "Click to open your new conversation",
          action: (
            <Button
              size="sm"
              onClick={() => window.location.href = `/chat/${data.chatThreadId}`}
            >
              Open Chat
            </Button>
          ),
        });
      }
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth/signin";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to accept join request",
        variant: "destructive",
      });
    },
  });

  const declineJoinMutation = useMutation({
    mutationFn: async (joinId: string) => {
      return await apiRequest("POST", `/api/joins/${joinId}/decline`);
    },
    onSuccess: () => {
      toast({
        title: "Join Request Declined",
        description: "The traveler has been notified",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId, "joins"] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth/signin";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to decline join request",
        variant: "destructive",
      });
    },
  });

  if (!isOwner) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Join Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading join requests...</div>
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = joinRequests?.filter(req => req.status === "pending") || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Join Requests
          {pendingRequests.length > 0 && (
            <Badge variant="secondary">{pendingRequests.length} pending</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {joinRequests?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No join requests yet</p>
            <p className="text-sm">When travelers request to join your trip, they'll appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {joinRequests?.map((request) => (
              <div 
                key={request.id} 
                className="border rounded-lg p-4 space-y-3"
                data-testid={`join-request-${request.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={request.requester.profileImageUrl} />
                      <AvatarFallback>
                        {request.requester.firstName?.[0] || request.requester.username?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {request.requester.firstName || request.requester.username || "Anonymous"}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      request.status === "pending" ? "secondary" : 
                      request.status === "accepted" ? "default" : 
                      "destructive"
                    }
                  >
                    {request.status}
                  </Badge>
                </div>

                {request.message && (
                  <div className="bg-muted/50 rounded-md p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Message:</span>
                    </div>
                    <p className="text-sm">{request.message}</p>
                  </div>
                )}

                {request.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => acceptJoinMutation.mutate(request.id)}
                      disabled={acceptJoinMutation.isPending}
                      data-testid={`button-accept-${request.id}`}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => declineJoinMutation.mutate(request.id)}
                      disabled={declineJoinMutation.isPending}
                      data-testid={`button-decline-${request.id}`}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                )}

                {request.status === "accepted" && (
                  <div className="text-sm text-green-600 font-medium">
                    ✓ Accepted - Chat created
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}