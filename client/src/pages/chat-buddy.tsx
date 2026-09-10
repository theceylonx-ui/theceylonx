import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useRoute, useLocation } from 'wouter';
import Navigation from '@/components/navigation';
import { Card } from '@/components/ui/card';
import Footer from '@/components/Footer';
import { MessageCircle } from 'lucide-react';
import { ChatThreadsList } from '@/components/chat/ChatThreadsList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { TipsBox } from '@/components/TipsBox';

interface TripStatus {
  status: 'none' | 'pending' | 'accepted' | 'rejected';
  chatThreadId?: string | null;
}

// Component to show all chat threads when accessed directly from navigation
function ChatThreadsListView() {
  const { user } = useAuth();
  const [match, params] = useRoute('/chat-buddy/:threadId');
  const threadId = match ? params?.threadId : undefined;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent-subtle to-brand-subtle dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        {/* Chat Buddy Header with beautiful gradient like HiBowan Tribes */}
        <div className="py-8">
          <div className="max-w-6xl mx-auto p-6">
            <div className="bg-gradient-to-r from-brand to-brand-hover rounded-2xl shadow-lg shadow-brand/20 p-8 mb-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-2">💬 Chat Buddy</h1>
                <p className="text-white/90 text-lg">Connect with fellow travelers and trip organizers</p>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-20 pb-10">
          <div className="max-w-4xl mx-auto p-6">
            <div className="text-center">Please sign in to access your chats.</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-subtle to-brand-subtle dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      <div className="py-8">
        <div className="max-w-6xl mx-auto p-6">
          {/* Chat Buddy Header with beautiful gradient like HiBowan Tribes */}
          <div className="bg-gradient-to-r from-brand to-brand-hover rounded-2xl shadow-lg shadow-brand/20 p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">💬 Chat Buddy</h1>
                <p className="text-white/90 text-lg">Connect with fellow travelers and trip organizers</p>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="grid lg:grid-cols-3 gap-6 h-[600px] mb-8">
            {/* Threads List */}
            <div className="lg:col-span-1 h-full overflow-y-auto">
              <ChatThreadsList />
            </div>

            {/* Chat Window */}
            <div className="lg:col-span-2 h-full">
              {threadId ? (
                <ChatWindow
                  threadId={threadId}
                  currentUserId={user?.id}
                  onBack={() => {
                    // Clear the URL parameter to deselect the chat
                    window.history.replaceState({}, '', '/chat-buddy');
                    // Trigger a location change event to update the UI
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                />
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">Select a chat to start messaging</p>
                    <p className="text-sm">Choose a conversation from the list to begin chatting</p>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Tips Section - Moved to bottom */}
          <TipsBox
            title="How to use Chat Buddy"
            tips={[
              "💬 View all your trip conversations in one place",
              "📱 Share contact details with trip participants when you're the organizer",
              "📸 Send photos and messages to coordinate trip details",
              "🔔 Get notifications when you receive new messages",
              "⭐ Chat history is preserved even if trips are modified"
            ]}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Old links (from trip cards, notifications) sometimes point at
// /chat-buddy?tripId=X rather than a specific thread. Look up the
// thread for the current user's own accepted request on that trip
// and forward to the real /chat-buddy/:threadId URL.
function TripChatRedirect({ tripId }: { tripId: string }) {
  const [, setLocation] = useLocation();

  const { data: tripStatus, isLoading } = useQuery<TripStatus>({
    queryKey: ['/api/trips', tripId, 'status'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/trips/${tripId}/status`);
      return response.json();
    },
    enabled: !!tripId,
  });

  useEffect(() => {
    if (tripStatus?.chatThreadId) {
      setLocation(`/chat-buddy/${tripStatus.chatThreadId}`, { replace: true });
    }
  }, [tripStatus?.chatThreadId, setLocation]);

  if (isLoading || tripStatus?.chatThreadId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-2xl font-semibold mb-2">Chat not available yet</h2>
        <p className="text-muted-foreground text-lg">
          You'll be able to message the organizer once your request for this trip is accepted.
        </p>
      </div>
      <Footer />
    </div>
  );
}

export default function ChatBuddy() {
  // Old-style links pass a tripId query param instead of a thread path
  // param; redirect those to the real thread instead of rendering a
  // second, separate chat UI for them.
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get('tripId');

  if (tripId) {
    return <TripChatRedirect tripId={tripId} />;
  }

  return <ChatThreadsListView />;
}
