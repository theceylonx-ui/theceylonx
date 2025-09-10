import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { EmptyState } from "@/components/EmptyState";
import { getDisplayName } from "@/lib/profileUtils";

interface ChatThread {
  id: string;
  tripId: string;
  organizerId: string;
  userId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  trip?: {
    id: string;
    title: string;
    fromLocation: string;
    toLocation: string;
    date: string;
    status: string;
  };
  otherUser?: {
    id: string;
    displayName?: string | null;
    username?: string | null;
    avatarUrl?: string;
    initials: string;
  };
  unreadCount: number;
}

interface ChatThreadsListProps {
  onThreadSelect?: (threadId: string) => void;
}

export function ChatThreadsList({ onThreadSelect }: ChatThreadsListProps = {}) {
  const [, setLocation] = useLocation();
  const { data: threadsData, isLoading, error } = useQuery<ChatThread[]>({
    queryKey: ["/api/threads"],
    refetchInterval: 5000, // Refresh every 5 seconds for faster updates
    staleTime: 0, // Always fetch fresh data
  });

  // Sort threads by updatedAt (WhatsApp style - newest conversations first)
  const threads = threadsData ? [...threadsData].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ) : [];

  const handleThreadClick = (threadId: string) => {
    onThreadSelect?.(threadId);
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-y-auto">
        <Card className="p-6 text-center">
          <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Failed to load chat threads</p>
        </Card>
      </div>
    );
  }

  if (!threads || threads.length === 0) {
    return (
      <div className="h-full overflow-y-auto">
        <EmptyState 
          type="chat"
          primaryAction={{
            label: "Browse Trips",
            onClick: () => setLocation('/browse-trips')
          }}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-xl font-semibold">Your Chats</h2>
        <Badge variant="secondary">
          {threads.length} conversation{threads.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      {/* Scrollable chat list - WhatsApp style */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {threads.map((thread) => (
          <Link 
            key={thread.id} 
            href={`/chat-buddy/${thread.id}`}
            onClick={() => handleThreadClick(thread.id)}
          >
            <Card 
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              data-testid={`chat-thread-${thread.id}`}
            >
              <div className="flex items-center space-x-4">
                {/* Other User Avatar */}
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage 
                      src={thread.otherUser?.avatarUrl} 
                      alt={getDisplayName(thread.otherUser) || "User"} 
                    />
                    <AvatarFallback>
                      {thread.otherUser?.initials || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {thread.unreadCount > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 w-5 h-5 text-xs flex items-center justify-center p-0"
                      variant="destructive"
                    >
                      {thread.unreadCount > 9 ? "9+" : thread.unreadCount}
                    </Badge>
                  )}
                </div>

                {/* Chat Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">
                      {getDisplayName(thread.otherUser)}
                      {thread.otherUser?.username && (
                        <span className="text-gray-500 ml-1">@{thread.otherUser.username}</span>
                      )}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 ml-2">
                      <Clock className="w-3 h-3 mr-1" />
                      {format(new Date(thread.updatedAt), "MMM d")}
                    </div>
                  </div>
                  
                  {/* Trip Info */}
                  {thread.trip ? (
                    <div className="mt-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {thread.trip.title}
                        {(thread.trip.status === 'deleted' || thread.trip.status === 'cancelled') && (
                          <span className="ml-2 text-red-500 text-xs">[{thread.trip.status.toUpperCase()}]</span>
                        )}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          {thread.trip.fromLocation} → {thread.trip.toLocation}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{format(new Date(thread.trip.date), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <p className="text-sm text-red-500 italic">Trip no longer available</p>
                    </div>
                  )}

                  {/* Thread Status */}
                  <div className="flex items-center mt-2">
                    <Badge 
                      variant={
                        thread.status === 'open' ? 'default' : 
                        thread.status === 'locked' ? 'secondary' : 'destructive'
                      }
                      className="text-xs"
                    >
                      {thread.status}
                    </Badge>
                    {thread.trip?.status && (
                      <>
                        <span className="mx-2 text-gray-300">•</span>
                        <Badge 
                          variant={
                            thread.trip.status === 'active' ? 'outline' :
                            thread.trip.status === 'inactive' ? 'secondary' :
                            ['deleted', 'cancelled'].includes(thread.trip.status) ? 'destructive' : 'outline'
                          }
                          className="text-xs"
                        >
                          Trip: {thread.trip.status}
                        </Badge>
                      </>
                    )}
                    {!thread.trip && (
                      <>
                        <span className="mx-2 text-gray-300">•</span>
                        <Badge variant="destructive" className="text-xs">
                          Trip: Deleted
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}