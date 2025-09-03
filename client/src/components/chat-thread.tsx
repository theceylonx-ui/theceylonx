import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, ArrowLeft, Users, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { getDisplayName, getInitials, generateRandomProfilePicture } from "@/lib/profileUtils";

interface Message {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    profileImageUrl?: string;
  };
}

interface ChatThreadData {
  id: string;
  tripId: string;
  createdAt: string;
  trip?: {
    id: string;
    title: string;
    origin: string;
    destination: string;
  };
  users: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    profileImageUrl?: string;
  }>;
}

interface ChatThreadProps {
  threadId: string;
  userId: string;
  onBack?: () => void;
}

export function ChatThread({ threadId, userId, onBack }: ChatThreadProps) {
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: thread, isLoading: threadLoading } = useQuery<ChatThreadData>({
    queryKey: ["/api/threads", threadId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/threads/${threadId}`);
      return response.json();
    },
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/threads", threadId, "messages"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/threads/${threadId}/messages`);
      return response.json();
    },
    refetchInterval: 5000, // Refetch every 5 seconds for basic real-time feel
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (body: string) => {
      return await apiRequest("POST", `/api/threads/${threadId}/messages`, { body });
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/threads", threadId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
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
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendMessageMutation.mutate(messageText.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (threadLoading) {
    return (
      <Card className="h-[600px]">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const otherUser = thread?.users.find(user => user.id !== userId);
  const displayName = getDisplayName(otherUser);

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              data-testid="button-back-to-inbox"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <Avatar className="w-8 h-8">
            <AvatarImage src={otherUser?.profileImageUrl || generateRandomProfilePicture(otherUser?.id)} />
            <AvatarFallback>
              {getInitials(otherUser)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg">{displayName}</CardTitle>
            {thread && thread.trip && (
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {thread.trip.title || `${thread.trip.origin || 'Unknown'} → ${thread.trip.destination || 'Unknown'}`}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messagesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-12 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Start the conversation!</p>
              <p className="text-sm">Send a message to begin chatting about your trip</p>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isOwn = message.authorId === userId;
                const author = message.author;
                const authorName = author.firstName || author.username || "Unknown";

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                    data-testid={`message-${message.id}`}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={author.profileImageUrl} />
                      <AvatarFallback>
                        {authorName[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 max-w-xs ${isOwn ? "text-right" : ""}`}>
                      <div className="text-xs text-muted-foreground mb-1">
                        {isOwn ? "You" : authorName} • {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </div>
                      <div
                        className={`rounded-lg px-3 py-2 ${
                          isOwn
                            ? "bg-primary text-primary-foreground ml-auto"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <div className="flex-shrink-0 border-t pt-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={2}
              className="flex-1 resize-none"
              data-testid="textarea-message-input"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              className="self-end"
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </CardContent>
    </Card>
  );
}