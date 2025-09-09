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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    displayName: string;
    username?: string;
    avatarUrl?: string;
    initials: string;
  };
}

interface ChatThread {
  id: string;
  tripId: string;
  status: string;
  participants: Array<{
    id: string;
    displayName: string;
    username?: string;
    avatarUrl?: string;
    initials: string;
  }>;
  trip: {
    id: string;
    title: string;
    origin: string;
    destination: string;
    departureDate: string;
    organizer: {
      id: string;
      displayName: string;
      username?: string;
      avatarUrl?: string;
      initials: string;
      phone?: string;
      email?: string;
    };
  };
}

interface ChatWindowProps {
  threadId?: string;
  currentUserId?: string;
  onBack?: () => void;
}

export function ChatWindow({ threadId, currentUserId, onBack }: ChatWindowProps) {
  // Show placeholder when no thread is selected
  if (!threadId) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 21l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Select a conversation
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a chat from your inbox to start messaging
          </p>
        </div>
      </Card>
    );
  }
  const [messageText, setMessageText] = useState("");
  const [isContactShareOpen, setIsContactShareOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Apply consistent threadId fallback for ALL operations
  const finalThreadId = threadId || "thread-organizer-test-001";

  // Fetch thread data (FORCE FRESH - NO CACHE)
  const { data: threadData, isLoading: threadLoading } = useQuery({
    queryKey: [`/api/chat/threads/${finalThreadId}`],
    refetchInterval: 5000,
    enabled: !!finalThreadId,
    staleTime: 0, // Always consider data stale
    cacheTime: 0, // Don't cache at all
  });

  // Fetch messages
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/chat/threads/${finalThreadId}/messages`],
    refetchInterval: 3000,
    enabled: !!finalThreadId,
  });

  // Sort messages chronologically like WhatsApp (oldest to newest)
  const messages = (messagesData?.messages || []).sort((a: ChatMessage, b: ChatMessage) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { text: string; attachmentId?: string; ephemeral?: boolean }) => {
      return apiRequest("POST", `/api/chat/threads/${finalThreadId}/messages`, data);
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: [`/api/chat/threads/${finalThreadId}/messages`] });
      scrollToBottom();
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Report message mutation
  const reportMessageMutation = useMutation({
    mutationFn: async (data: { messageId: string; reason: string }) => {
      return apiRequest("POST", `/api/messages/${data.messageId}/report`, {
        reason: data.reason
      });
    },
    onSuccess: () => {
      toast({
        title: "Message reported",
        description: "Thank you for helping keep our community safe.",
      });
    },
  });

  // Share contact mutation  
  const shareContactMutation = useMutation({
    mutationFn: async (fields: string[]) => {
      return apiRequest("POST", `/api/chat/threads/${finalThreadId}/share-contact`, {
        fields
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/threads/${threadId}/messages`] });
      setIsContactShareOpen(false);
      toast({
        title: "Contact shared",
        description: "Your contact details have been shared with the participants.",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    sendMessageMutation.mutate({ text: messageText.trim() });
  };

  const handleImageUploaded = (result: any) => {
    const uploadUrl = result.successful[0]?.uploadURL;
    if (uploadUrl) {
      sendMessageMutation.mutate({
        text: "",
        attachmentId: uploadUrl,
        ephemeral: false,
      });
      
      toast({
        title: "Image sent!",
        description: "Your image has been shared successfully.",
      });
    }
  };

  const handleReport = (messageId: string, reason: string) => {
    reportMessageMutation.mutate({ messageId, reason });
  };

  const isOrganizer = threadData?.trip?.organizer?.id === currentUserId;
  const canShareContact = isOrganizer && (threadData?.trip?.organizer?.phone || threadData?.trip?.organizer?.email);

  if (threadLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading chat...</p>
        </div>
      </Card>
    );
  }

  if (!threadData) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>Chat not found</p>
          <Button onClick={onBack} className="mt-4">
            Go Back
          </Button>
        </div>
      </Card>
    );
  }

  // Check if trip is deleted or unavailable
  if (!threadData.trip) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Trip No Longer Available</h3>
          <p className="mb-4">This trip has been deleted or is no longer accessible.</p>
          <p className="text-sm text-gray-400 mb-4">Your chat history is preserved but no new messages can be sent.</p>
          <Button onClick={onBack} className="mt-4">
            Go Back
          </Button>
        </div>
      </Card>
    );
  }

  // Check if trip is inactive/cancelled
  const tripStatus = threadData?.trip?.status;
  const isTripUnavailable = tripStatus && ['deleted', 'cancelled', 'inactive'].includes(tripStatus);


  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div>
            <h3 className="font-semibold text-lg">
              {threadData.trip?.title || 'Trip Chat'}
              {isTripUnavailable && (
                <span className="ml-2 text-red-500 text-sm">[{tripStatus.toUpperCase()}]</span>
              )}
            </h3>
            <p className="text-sm text-gray-500">
              {threadData.trip?.fromLocation || 'Location'} → {threadData.trip?.toLocation || 'Destination'}
              {isTripUnavailable && (
                <span className="ml-2 text-red-500">• Trip no longer active</span>
              )}
            </p>
          </div>
        </div>

        {canShareContact && (
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setIsContactShareOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Phone className="w-4 h-4 mr-2" />
            Share Contact
          </Button>
        )}

      </div>

      {/* Contact Share Dialog - moved outside header */}
      {canShareContact && (
        <Dialog open={isContactShareOpen} onOpenChange={setIsContactShareOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Contact Information</DialogTitle>
                  <DialogDescription>
                    Choose which contact details to share with trip participants.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {threadData.trip?.organizer?.phoneNumber && (
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>{threadData.trip.organizer.phoneNumber}</span>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => shareContactMutation.mutate(['phone'])}
                        disabled={shareContactMutation.isPending}
                      >
                        Share Phone
                      </Button>
                    </div>
                  )}
                  
                  {threadData.trip?.organizer?.email && (
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>{threadData.trip.organizer.email}</span>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => shareContactMutation.mutate(['email'])}
                        disabled={shareContactMutation.isPending}
                      >
                        Share Email
                      </Button>
                    </div>
                  )}

                  {threadData.trip?.organizer?.phoneNumber && threadData.trip?.organizer?.email && (
                    <div className="pt-2 border-t">
                      <Button 
                        className="w-full" 
                        onClick={() => shareContactMutation.mutate(['phone', 'email'])}
                        disabled={shareContactMutation.isPending}
                      >
                        Share Both
                      </Button>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsContactShareOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messagesLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
              onReport={(reason) => handleReport(message.id, reason)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {(threadData.status === 'open' || threadData.thread?.status === 'open') && !isTripUnavailable ? (
        <>
          <Separator />
          <form onSubmit={handleSendMessage} className="p-4">
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
              </div>
              
              <ImageUpload
                onComplete={handleImageUploaded}
                maxFiles={1}
                maxFileSize={10 * 1024 * 1024}
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
          {isTripUnavailable ? (
            <div>
              <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-red-500" />
              <p>This trip is {tripStatus}. Chat is read-only.</p>
              <p className="text-sm mt-1">No new messages can be sent for inactive trips.</p>
            </div>
          ) : (
            <p>This chat is {threadData.status || threadData.thread?.status}. No new messages can be sent.</p>
          )}
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
  const [showReportConfirm, setShowReportConfirm] = useState(false);
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
      <>
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
            {!isOwn && (
              <div className="flex items-center space-x-2 mb-1">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={message.sender.avatarUrl} />
                  <AvatarFallback className="text-xs">
                    {message.sender.initials || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-500">
                  {message.sender.displayName}
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
                <div className="space-y-0">
                  {attachmentUrl && (
                    <div className="relative mb-3">
                      <img
                        src={attachmentUrl}
                        alt="Shared image"
                        className="max-w-full h-auto rounded-lg cursor-pointer"
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
                    <div className={`text-sm leading-relaxed ${attachmentUrl ? 'mt-2' : ''}`}>
                      {message.text}
                    </div>
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
                      <DropdownMenuItem onClick={() => setShowReportConfirm(true)}>
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

        {/* Report Confirmation Dialog */}
        <Dialog open={showReportConfirm} onOpenChange={setShowReportConfirm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>⚠️ Report Message</DialogTitle>
              <DialogDescription>
                Are you sure you want to report this message for inappropriate content? 
                This action will notify the administrators and may result in chat restrictions.
              </DialogDescription>
            </DialogHeader>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                "Image message"
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowReportConfirm(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  onReport('inappropriate');
                  setShowReportConfirm(false);
                }}
              >
                🚨 Report Message
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Handle regular text messages
  return (
    <>
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
          {!isOwn && (
            <div className="flex items-center space-x-2 mb-1">
              <Avatar className="w-6 h-6">
                <AvatarImage src={message.sender.avatarUrl} />
                <AvatarFallback className="text-xs">
                  {message.sender.initials || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-500">
                {message.sender.displayName}
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
                    <DropdownMenuItem onClick={() => setShowReportConfirm(true)}>
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

      {/* Report Confirmation Dialog */}
      <Dialog open={showReportConfirm} onOpenChange={setShowReportConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>⚠️ Report Message</DialogTitle>
            <DialogDescription>
              Are you sure you want to report this message for inappropriate content? 
              This action will notify the administrators and may result in chat restrictions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              "{message.text?.substring(0, 100)}{message.text?.length > 100 ? '...' : ''}"
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setShowReportConfirm(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                onReport('inappropriate');
                setShowReportConfirm(false);
              }}
            >
              🚨 Report Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}