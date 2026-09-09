import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { ChatThreadsList } from "@/components/chat/ChatThreadsList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ChatPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [match, params] = useRoute("/chat/:threadId?");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    params?.threadId || null
  );

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need to be signed in to access your chat conversations.
            </p>
            <Button asChild>
              <a href="/api/auth/google">Sign In</a>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Mobile-first responsive design
  const showThreadsList = !selectedThreadId;
  const showChatWindow = selectedThreadId;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-5 lg:gap-6 lg:h-[600px]">
          {/* Threads List - Left Sidebar */}
          <div className="lg:col-span-2">
            <ChatThreadsList />
          </div>
          
          {/* Chat Window - Main Area */}
          <div className="lg:col-span-3">
            {selectedThreadId ? (
              <ChatWindow
                threadId={selectedThreadId}
                currentUserId={user.id}
                onBack={() => setSelectedThreadId(null)}
              />
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p className="text-lg mb-2">Select a conversation</p>
                  <p className="text-sm">Choose a chat from the left to start messaging</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden">
          {showThreadsList && (
            <div>
              <div className="mb-6">
                <Button variant="ghost" asChild className="mb-4">
                  <Link href="/">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Link>
                </Button>
                <h1 className="text-2xl font-bold">Your Chats</h1>
              </div>
              <ChatThreadsList />
            </div>
          )}
          
          {showChatWindow && selectedThreadId && (
            <div>
              <ChatWindow
                threadId={selectedThreadId}
                currentUserId={user.id}
                onBack={() => setSelectedThreadId(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}