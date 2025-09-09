import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import Navigation from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { TipsBox } from '@/components/TipsBox';
import Footer from '@/components/Footer';
import { 
  MessageSquare, 
  Send, 
  Star, 
  Users, 
  Clock, 
  Heart,
  Eye,
  ArrowLeft,
  MessageCircle
} from 'lucide-react';

interface User {
  id: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  initials: string;
  email?: string;
}

interface Message {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  createdAt: string;
  author: User;
}

interface ChatThread {
  id: string;
  tripId: string;
  createdAt: string;
  updatedAt: string;
}

interface TripStatus {
  status: 'none' | 'pending' | 'accepted' | 'rejected';
  chatThreadId?: string;
}

export default function ChatBuddy() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get tripId from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get('tripId');

  // Fetch trip data and status for current user
  const { data: tripData, isLoading: tripLoading } = useQuery<any>({
    queryKey: ['/api/trips', tripId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/trips/${tripId}`);
      return response.json();
    },
    enabled: !!tripId,
  });

  // Fetch trip status for current user
  const { data: tripStatus, isLoading: statusLoading } = useQuery<TripStatus>({
    queryKey: ['/api/trips', tripId, 'status'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/trips/${tripId}/status`);
      return response.json();
    },
    enabled: !!tripId,
  });

  // Fetch chat-eligible users (only if accepted)
  const { data: chatUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/chat/users', tripId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/chat/users?tripId=${tripId}`);
      return response.json();
    },
    enabled: !!tripId && tripStatus?.status === 'accepted',
  });

  // Fetch messages for selected user
  const { data: chatData, isLoading: messagesLoading } = useQuery<{
    thread: ChatThread;
    messages: Message[];
  }>({
    queryKey: ['/api/chat', selectedUserId, tripId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/chat/${selectedUserId}?tripId=${tripId}`);
      return response.json();
    },
    enabled: !!tripId && !!selectedUserId && tripStatus?.status === 'accepted',
    refetchInterval: 3000, // Poll every 3 seconds for real-time feel
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', `/api/chat/${selectedUserId}?tripId=${tripId}`, {
        message: message.trim(),
      });
      return response.json();
    },
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['/api/chat', selectedUserId, tripId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send message',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Mark as read when user is selected (commented out for now)
  // const markAsReadMutation = useMutation({
  //   mutationFn: async () => {
  //     await apiRequest('POST', `/api/chat/${selectedUserId}/read?tripId=${tripId}`);
  //   },
  // });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatData?.messages]);

  // Mark as read when selecting a user (commented out for now)
  // useEffect(() => {
  //   if (selectedUserId && tripStatus?.status === 'accepted') {
  //     markAsReadMutation.mutate();
  //   }
  // }, [selectedUserId, tripStatus?.status]);

  const handleSendMessage = () => {
    if (!messageText.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(messageText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const insertCannedMessage = (message: string) => {
    setMessageText(message);
  };

  if (!tripId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-2">Invalid Chat Link</h2>
              <p className="text-muted-foreground">Please access Chat Buddy through a trip page.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Check if trip is deleted or unavailable
  if (tripData && ['deleted', 'cancelled', 'inactive'].includes(tripData.status)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageCircle className="h-8 w-8 text-purple-600" />
              Chat Buddy
            </h1>
          </div>

          <Card>
            <CardContent className="p-12 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-10 w-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Trip No Longer Available</h2>
                <p className="text-muted-foreground text-lg mb-4">
                  This trip has been {tripData.status}. Chat functionality is no longer available.
                </p>
                <p className="text-sm text-gray-400 mb-8">
                  {tripData.status === 'deleted' ? 'The trip organizer has removed this trip.' :
                   tripData.status === 'cancelled' ? 'This trip has been cancelled.' :
                   'This trip is currently inactive.'}
                </p>
              </div>

              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (statusLoading || tripLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state for non-accepted users or inactive trips
  if (tripStatus?.status !== 'accepted' || (tripData && !['active', 'full'].includes(tripData.status))) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageCircle className="h-8 w-8 text-purple-600" />
              Chat Buddy
            </h1>
          </div>

          <Card>
            <CardContent className="p-12 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">
                  {tripData && !['active', 'full'].includes(tripData.status) 
                    ? 'Chat unavailable for this trip' 
                    : 'Chat will unlock after acceptance'}
                </h2>
                <p className="text-muted-foreground text-lg mb-8">
                  {tripData && !['active', 'full'].includes(tripData.status)
                    ? `This trip is ${tripData.status}. Chat functionality is not available.`
                    : 'You can message the organizer once they accept your request for this trip.'}
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-4 text-left">💡 Tips to get started:</h3>
                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3">
                    <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">Use ⭐ <strong>Interested</strong> on trips you like; the organizer will review your request.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">Once accepted, coordinate routes, costs, and meeting points here.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Heart className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">Be respectful and keep messages trip-focused.</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                View Trip Details
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <MessageCircle className="w-8 h-8" />
                  <h1 className="text-3xl md:text-4xl font-bold">Chat Buddy</h1>
                </div>
                <p className="text-lg opacity-90">
                  Connect with fellow travelers and coordinate your journey
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - User List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Trip Members
                  {chatUsers && (
                    <Badge variant="outline">{chatUsers.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !chatUsers || chatUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No other members yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chatUsers
                      .filter(chatUser => chatUser.id !== user?.id)
                      .map((chatUser) => (
                        <div
                          key={chatUser.id}
                          onClick={() => setSelectedUserId(chatUser.id)}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedUserId === chatUser.id
                              ? 'bg-purple-50 border border-purple-200'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={chatUser.avatarUrl} />
                            <AvatarFallback>
                              {chatUser.initials || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {chatUser.displayName || 'Anonymous'}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              Tap to chat
                            </p>
                          </div>
                          {selectedUserId === chatUser.id && (
                            <MessageSquare className="h-4 w-4 text-purple-600" />
                          )}
                        </div>
                      ))
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Chat Area */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              {!selectedUserId ? (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="font-semibold mb-2">Select a member to chat</h3>
                    <p className="text-muted-foreground text-sm">
                      Choose someone from the left to start messaging
                    </p>
                  </div>
                </CardContent>
              ) : messagesLoading ? (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading chat...</p>
                  </div>
                </CardContent>
              ) : (
                <>
                  {/* Chat Header */}
                  <CardHeader className="border-b">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={chatUsers?.find(u => u.id === selectedUserId)?.avatarUrl} />
                        <AvatarFallback>
                          {chatUsers?.find(u => u.id === selectedUserId)?.initials || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {chatUsers?.find(u => u.id === selectedUserId)?.displayName || 'Anonymous'}
                        </p>
                        {tripData && (
                          <p className="text-xs text-muted-foreground">
                            About: {tripData.title}
                          </p>
                        )}
                        {isTyping && (
                          <p className="text-xs text-muted-foreground">Typing...</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages Area */}
                  <CardContent className="flex-1 overflow-y-auto p-4">
                    {!chatData?.messages || chatData.messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center">
                        <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="font-semibold mb-2">No chat available yet</h3>
                        <div className="bg-blue-50 rounded-lg p-4 max-w-md">
                          <p className="text-sm text-muted-foreground mb-3">💡 Start the conversation:</p>
                          <div className="space-y-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => insertCannedMessage("Hi! Thanks for accepting. Where shall we meet?")}
                              className="w-full text-left justify-start text-xs border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                            >
                              Hi! Thanks for accepting. Where shall we meet?
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => insertCannedMessage("Can we confirm the cost and split?")}
                              className="w-full text-left justify-start text-xs border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                            >
                              Can we confirm the cost and split?
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => insertCannedMessage("What time should we start?")}
                              className="w-full text-left justify-start text-xs border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                            >
                              What time should we start?
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatData.messages.map((message) => {
                          const isOwnMessage = message.authorId === user?.id;
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  isOwnMessage
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <p className="text-sm">{message.body}</p>
                                <p
                                  className={`text-xs mt-1 ${
                                    isOwnMessage ? 'text-green-100' : 'text-gray-500'
                                  }`}
                                >
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {new Date(message.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </CardContent>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        disabled={sendMessageMutation.isPending}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sendMessageMutation.isPending}
                        size="icon"
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Press Enter to send, Shift+Enter for new line
                    </p>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-16 mb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <TipsBox
            title="💬 Chat Buddy Safety & Tips"
            tips={[
              "Your <strong>contact info stays private</strong> until you choose to share it",
              "Use the platform chat first to get to know potential travel companions", 
              "Only share personal details when you feel <strong>comfortable and safe</strong>",
              "Report any <strong>inappropriate messages</strong> using the report feature",
              "Ask questions about the trip, meeting points, and group dynamics",
              "Trust your instincts - if something feels off, don't hesitate to block users"
            ]}
          />
        </div>
      </div>
      
      <Footer />
    </div>
  );
}