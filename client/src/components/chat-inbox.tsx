import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface ChatThread {
  id: string;
  tripId: string;
  createdAt: string;
  updatedAt: string;
  trip?: {
    id: string;
    title: string;
    origin: string;
    destination: string;
  };
  otherUser?: {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    profileImageUrl?: string;
  };
  lastMessage?: {
    id: string;
    body: string;
    createdAt: string;
    authorId: string;
  };
  unreadCount?: number;
}

interface ChatInboxProps {
  userId: string;
  onThreadSelect?: (threadId: string) => void;
}

export function ChatInbox({ userId, onThreadSelect }: ChatInboxProps) {
  const { data: threads, isLoading } = useQuery<ChatThread[]>({
    queryKey: ["/api/threads"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/threads");
      return response.json();
    },
  });

  const handleThreadClick = (threadId: string) => {
    if (onThreadSelect) {
      onThreadSelect(threadId);
    } else {
      window.location.href = `/chat/${threadId}`;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Chat Buddy Inbox
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Chat Buddy Inbox
          {threads && threads.length > 0 && (
            <Badge variant="secondary">{threads.length} conversation{threads.length !== 1 ? 's' : ''}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!threads || threads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No conversations yet</p>
            <p className="text-sm">When you join trips or accept join requests, chat conversations will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {threads.map((thread) => {
              // Get the other user in the conversation
              const otherUser = thread.otherUser;
              const displayName = otherUser?.firstName || otherUser?.username || "Unknown User";
              
              return (
                <div
                  key={thread.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleThreadClick(thread.id)}
                  data-testid={`chat-thread-${thread.id}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={otherUser?.profileImageUrl} />
                      <AvatarFallback>
                        {displayName[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium truncate">{displayName}</div>
                        <div className="flex items-center gap-1">
                          {thread.unreadCount && thread.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {thread.unreadCount}
                            </Badge>
                          )}
                          {thread.lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(thread.lastMessage.createdAt), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-2">
                        {thread.trip ? (
                          <>Trip: {thread.trip.origin || 'Unknown'} → {thread.trip.destination || 'Unknown'}</>
                        ) : (
                          <>Trip: General Chat</>
                        )}
                      </div>
                      
                      {thread.lastMessage ? (
                        <div className="text-sm text-muted-foreground truncate">
                          {thread.lastMessage.authorId === userId ? "You: " : ""}
                          {thread.lastMessage.body}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground italic">
                          No messages yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}