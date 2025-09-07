import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Clock,
  MoreVertical,
  AlertTriangle,
  Image as ImageIcon,
  Eye,
  EyeOff
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "./ImageUpload";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  kind: string;
  text?: string;
  meta?: any;
  createdAt: string;
  sender: {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    profileImageUrl?: string;
  };
}

interface ChatThread {
  id: string;
  tripId: string;
  organizerId: string;
  userId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Trip {
  id: string;
  title: string;
  fromLocation: string;
  toLocation: string;
  date: string;
  status: string;
}

interface ChatWindowProps {
  threadId: string;
  currentUserId: string;
  onBack?: () => void;
}

export function ChatWindow({ threadId, currentUserId, onBack }: ChatWindowProps) {
  const [messageText, setMessageText] = useState("");
  const [reportReason, setReportReason] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch thread details
  const { data: threadData, isLoading: threadLoading } = useQuery<{
    thread: ChatThread;
    trip: Trip | null;
  }>({
    queryKey: [`/api/chat/threads/${threadId}`],
    retry: 1,
  });

  // Fetch messages
  const { data: messagesData, isLoading: messagesLoading } = useQuery<{
    messages: ChatMessage[];
  }>({
    queryKey: [`/api/chat/threads/${threadId}/messages`],
    refetchInterval: 5000, // Polling for new messages
    retry: 1,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      return apiRequest("POST", `/api/chat/threads/${threadId}/messages`, { text });
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({
        queryKey: [`/api/chat/threads/${threadId}/messages`],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/chat/threads"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Share contact mutation
  const shareContactMutation = useMutation({
    mutationFn: async (fields: string[]) => {
      return apiRequest("POST", `/api/chat/threads/${threadId}/share-contact`, { fields });
    },
    onSuccess: () => {
      toast({
        title: "Contact details shared",
        description: "Your contact information has been shared in this chat",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/chat/threads/${threadId}/messages`],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to share contact",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Report message mutation
  const reportMessageMutation = useMutation({
    mutationFn: async ({ messageId, reason }: { messageId: string; reason: string }) => {
      return apiRequest("POST", `/api/chat/messages/${messageId}/report`, { reason, notes: "" });
    },
    onSuccess: () => {
      toast({
        title: "Message reported",
        description: "Thank you for reporting. The chat has been muted for you.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to report message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(messageText.trim());
    }
  };

  const handleShareContact = (fields: string[]) => {
    shareContactMutation.mutate(fields);
  };

  const handleReportMessage = (messageId: string, reason: string) => {
    reportMessageMutation.mutate({ messageId, reason });
  };

  const isOrganizer = threadData?.thread?.organizerId === currentUserId;
  const canSendMessages = threadData?.thread?.status === 'open';

  if (threadLoading || messagesLoading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading chat...</p>
        </div>
      </Card>
    );
  }

  if (!threadData?.thread) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Chat not found</p>
          {onBack && (
            <Button variant="outline" onClick={onBack} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to chats
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <h3 className="font-semibold">{threadData.trip?.title}</h3>
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <div className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {threadData.trip?.fromLocation} → {threadData.trip?.toLocation}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {threadData.trip && format(new Date(threadData.trip.date), "MMM d, yyyy")}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={threadData.thread.status === 'open' ? 'default' : 'secondary'}>
              {threadData.thread.status}
            </Badge>
            
            {isOrganizer && threadData.thread.status === 'open' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => handleShareContact(['phone'])}
                    disabled={shareContactMutation.isPending}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Share Phone
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleShareContact(['email'])}
                    disabled={shareContactMutation.isPending}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Share Email
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleShareContact(['phone', 'email'])}
                    disabled={shareContactMutation.isPending}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Share Both
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messagesData?.messages?.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messagesData?.messages?.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
              onReport={(reason) => handleReportMessage(message.id, reason)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {canSendMessages ? (
        <>
          <Separator />
          <form onSubmit={handleSendMessage} className="p-4">
            <div className="flex space-x-2">
              <ImageUpload 
                threadId={threadId}
                disabled={sendMessageMutation.isPending}
                onImageSent={() => {
                  // Refresh messages after image is sent
                  queryClient.invalidateQueries({
                    queryKey: [`/api/chat/threads/${threadId}/messages`],
                  });
                }}
              />
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                disabled={sendMessageMutation.isPending}
                data-testid="message-input"
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={!messageText.trim() || sendMessageMutation.isPending}
                data-testid="send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </>
      ) : (
        <div className="p-4 text-center text-gray-500 bg-gray-50 dark:bg-gray-800">
          <p>This chat is {threadData.thread.status}. No new messages can be sent.</p>
        </div>
      )}
    </Card>
  );
}

// Message Bubble Component
interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  onReport: (reason: string) => void;
}

function MessageBubble({ message, isOwn, onReport }: MessageBubbleProps) {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [imageViewed, setImageViewed] = useState(false);

  // Handle contact share messages
  if (message.kind === 'contact_share') {
    return (
      <div className="flex justify-center my-4">
        <Card className="p-3 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
            <Phone className="w-4 h-4" />
            <span className="text-sm font-medium">Contact details shared</span>
          </div>
          {message.meta?.contactData && (
            <div className="mt-2 space-y-1 text-sm">
              {message.meta.contactData.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-3 h-3" />
                  <span>{message.meta.contactData.phone}</span>
                </div>
              )}
              {message.meta.contactData.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-3 h-3" />
                  <span>{message.meta.contactData.email}</span>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Handle image/media messages
  if (message.kind === 'media') {
    const isEphemeral = message.meta?.ephemeral;
    const attachmentUrl = message.meta?.attachmentId;
    const consumed = imageViewed && isEphemeral;

    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
          {!isOwn && (
            <div className="flex items-center space-x-2 mb-1">
              <Avatar className="w-6 h-6">
                <AvatarImage src={message.sender.profileImageUrl} />
                <AvatarFallback className="text-xs">
                  {message.sender.firstName?.[0] || message.sender.username?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-500">
                {message.sender.firstName} {message.sender.lastName}
              </span>
            </div>
          )}
          
          <Card className={`p-3 ${
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          }`}>
            {consumed ? (
              <div className="text-center py-8 text-gray-500">
                <EyeOff className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Image consumed</p>
                <p className="text-xs">No longer available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attachmentUrl && (
                  <div className="relative">
                    <img
                      src={attachmentUrl}
                      alt="Shared image"
                      className="max-w-full h-auto rounded cursor-pointer"
                      onClick={() => {
                        if (isEphemeral) {
                          setImageViewed(true);
                        }
                      }}
                    />
                    {isEphemeral && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          View once
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                {message.text && (
                  <p className="text-sm">{message.text}</p>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs ${isOwn ? 'text-primary-foreground/70' : 'text-gray-500'}`}>
                {format(new Date(message.createdAt), "HH:mm")}
              </span>
              {isEphemeral && !consumed && (
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>24h</span>
                </div>
              )}
              {!isOwn && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2">
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onReport('inappropriate')}>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
        {!isOwn && (
          <div className="flex items-center space-x-2 mb-1">
            <Avatar className="w-6 h-6">
              <AvatarImage src={message.sender.profileImageUrl} />
              <AvatarFallback className="text-xs">
                {message.sender.firstName?.[0] || message.sender.username?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-500">
              {message.sender.firstName} {message.sender.lastName}
            </span>
          </div>
        )}
        
        <div
          className={`p-3 rounded-lg ${
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          }`}
        >
          <p className="text-sm">{message.text}</p>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-xs ${isOwn ? 'text-primary-foreground/70' : 'text-gray-500'}`}>
              {format(new Date(message.createdAt), "HH:mm")}
            </span>
            {!isOwn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2">
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onReport('inappropriate')}>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}