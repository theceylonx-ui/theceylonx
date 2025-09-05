import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { ChatThreadsList } from "@/components/chat/ChatThreadsList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatTips } from "@/components/chat/ChatTips";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

interface ChatPageProps {
  params?: { threadId?: string };
}

export default function ChatPage({ params }: ChatPageProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    params?.threadId || null
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        <div className="pt-20 pb-10">
          <div className="max-w-4xl mx-auto p-6">
            <div className="text-center">Loading...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        <div className="pt-20 pb-10">
          <div className="max-w-4xl mx-auto p-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Chat Buddy
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">Sign in to access Chat Buddy</h3>
                <p className="text-muted-foreground mb-4">
                  Connect with fellow travelers and trip organizers through private messaging
                </p>
                <button
                  onClick={() => window.location.href = "/auth/signin"}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90"
                  data-testid="button-signin-to-chat"
                >
                  Sign In
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      <div className="pt-20 pb-10">
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Chat Buddy</h1>
            <p className="text-muted-foreground">
              Connect with fellow travelers and trip organizers
            </p>
          </div>

          {/* Chat Tips */}
          <div className="mb-6">
            <ChatTips userRole="both" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chat Threads List */}
            <div className={selectedThreadId ? "hidden lg:block" : ""}>
              <ChatThreadsList
                currentUserId={user.id}
                onThreadSelect={setSelectedThreadId}
              />
            </div>

            {/* Chat Window */}
            <div className={!selectedThreadId ? "hidden lg:block" : ""}>
              {selectedThreadId ? (
                <ChatWindow
                  threadId={selectedThreadId}
                  currentUserId={user.id}
                  onBack={() => setSelectedThreadId(null)}
                />
              ) : (
                <Card className="h-[600px] flex items-center justify-center">
                  <CardContent className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                    <p className="text-muted-foreground">
                      Choose a chat from your inbox to start messaging
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}