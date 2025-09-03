import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Send, Shield, ShieldOff, AlertTriangle, User, UserCheck } from "lucide-react";

interface AdminChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  reportDetails: {
    tripTitle: string;
    organizerName: string;
    reason: string;
    description: string;
  };
}

interface ChatThread {
  id: string;
  reportId: string;
  adminId: string;
  organizerId: string;
  isBlocked: boolean;
  blockedAt: string | null;
  blockedBy: string | null;
  admin: {
    id: string;
    firstName: string;
    lastName: string;
  };
  organizer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  report: {
    id: string;
    reason: string;
    description: string;
  };
  messageCount: number;
}

interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderType: 'admin' | 'organizer';
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export function AdminChatModal({ isOpen, onClose, reportId, reportDetails }: AdminChatModalProps) {
  const [message, setMessage] = useState("");
  const [thread, setThread] = useState<ChatThread | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create or get chat thread
  const createThreadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/admin/reports/${reportId}/chat`, {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      setThread(data);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create chat thread",
        variant: "destructive",
      });
    },
  });

  // Get messages
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: [`/api/admin/chat/${thread?.id}/messages`],
    enabled: !!thread?.id,
    refetchInterval: 3000, // Poll for new messages every 3 seconds
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest(`/api/admin/chat/${thread!.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: () => {
      setMessage("");
      refetchMessages();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Block/unblock chat
  const toggleBlockMutation = useMutation({
    mutationFn: async (isBlocked: boolean) => {
      return await apiRequest(`/api/admin/chat/${thread!.id}/block`, {
        method: "PATCH",
        body: JSON.stringify({ isBlocked }),
      });
    },
    onSuccess: (data) => {
      setThread(prev => prev ? { ...prev, ...data } : null);
      toast({
        title: "Success",
        description: data.action === 'blocked' ? "Chat blocked successfully" : "Chat unblocked successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update chat status",
        variant: "destructive",
      });
    },
  });

  // Initialize thread when modal opens
  useEffect(() => {
    if (isOpen && !thread) {
      createThreadMutation.mutate();
    }
  }, [isOpen, thread]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setThread(null);
      setMessage("");
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    if (!message.trim() || !thread) return;
    sendMessageMutation.mutate(message.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Admin Investigation Chat</span>
              {thread?.isBlocked && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Blocked
                </Badge>
              )}
            </div>
            {thread && (
              <Button
                variant={thread.isBlocked ? "default" : "destructive"}
                size="sm"
                onClick={() => toggleBlockMutation.mutate(!thread.isBlocked)}
                disabled={toggleBlockMutation.isPending}
                data-testid={thread.isBlocked ? "button-unblock-chat" : "button-block-chat"}
              >
                {thread.isBlocked ? (
                  <>
                    <ShieldOff className="w-4 h-4 mr-1" />
                    Unblock
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-1" />
                    Block
                  </>
                )}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Report Details */}
        <div className="bg-muted p-3 rounded-lg mb-4" data-testid="report-details">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="font-medium">Report: {reportDetails.reason}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Trip: "{reportDetails.tripTitle}" by {reportDetails.organizerName}
          </p>
          {reportDetails.description && (
            <p className="text-sm italic">"{reportDetails.description}"</p>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 border rounded-lg">
          <div className="space-y-4">
            {messages.map((msg: ChatMessage, index: number) => {
              const isAdmin = msg.senderType === 'admin';
              const showDate = index === 0 || 
                formatDate(messages[index - 1]?.createdAt) !== formatDate(msg.createdAt);

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="text-center text-xs text-muted-foreground py-2">
                      {formatDate(msg.createdAt)}
                    </div>
                  )}
                  <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isAdmin ? 'order-2' : 'order-1'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {isAdmin ? (
                          <UserCheck className="w-4 h-4 text-blue-500" />
                        ) : (
                          <User className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="text-sm font-medium">
                          {isAdmin ? 'Admin' : 'Organizer'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                      <div className={`p-3 rounded-lg ${
                        isAdmin 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="flex gap-2 pt-4">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message to the organizer..."
            disabled={sendMessageMutation.isPending}
            data-testid="input-message"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending || !thread}
            data-testid="button-send-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {thread?.isBlocked && (
          <p className="text-xs text-muted-foreground mt-2">
            Chat is blocked. The organizer cannot send messages, but you can still send messages to them.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}