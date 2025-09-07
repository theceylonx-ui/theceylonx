import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Pin, Heart, CheckCircle, XCircle } from "lucide-react";
import { Link } from "wouter";

interface UserHistoryEntry {
  action: string;
  tripId: string;
  createdAt: string;
  meta?: any;
  trip: {
    id: string;
    title: string;
    fromLocation: string;
    toLocation: string;
    organizer: {
      displayName: string;
      avatarUrl?: string;
    };
  };
}

interface UserHistoryResponse {
  items: UserHistoryEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const actionIcons = {
  PIN: Pin,
  UNPIN: Pin,
  INTEREST: Heart,
  WITHDRAW: Heart,
  INTEREST_ACCEPTED: CheckCircle,
  INTEREST_DECLINED: XCircle,
};

const actionColors = {
  PIN: "bg-blue-500",
  UNPIN: "bg-gray-500", 
  INTEREST: "bg-red-500",
  WITHDRAW: "bg-gray-500",
  INTEREST_ACCEPTED: "bg-green-500",
  INTEREST_DECLINED: "bg-red-500",
};

const actionLabels = {
  PIN: "Pinned trip",
  UNPIN: "Unpinned trip",
  INTEREST: "Showed interest",
  WITHDRAW: "Withdrew interest",
  INTEREST_ACCEPTED: "Interest accepted",
  INTEREST_DECLINED: "Interest declined",
};

export function UserHistoryTab() {
  const { data: historyData, isLoading, error } = useQuery<UserHistoryResponse>({
    queryKey: ['/api/user/history'],
    retry: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Failed to load activity history</p>
        </CardContent>
      </Card>
    );
  }

  if (!historyData?.items?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
            <p className="text-gray-500 mb-4">
              Your trip actions like pins and interests will appear here
            </p>
            <Link href="/browse-trips">
              <Button>Browse Trips</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity History
        </CardTitle>
        <p className="text-sm text-gray-600">
          {historyData.total} total actions
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {historyData.items.map((entry) => {
            const ActionIcon = actionIcons[entry.action as keyof typeof actionIcons] || Clock;
            const actionColor = actionColors[entry.action as keyof typeof actionColors] || "bg-gray-500";
            const actionLabel = actionLabels[entry.action as keyof typeof actionLabels] || entry.action;

            return (
              <div key={`${entry.action}-${entry.tripId}-${entry.createdAt}`} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <div className={`p-2 rounded-full ${actionColor} text-white flex-shrink-0`}>
                  <ActionIcon className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{actionLabel}</span>
                    <Badge variant="outline" className="text-xs">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                  
                  <Link href={`/trips/${entry.tripId}`}>
                    <div className="text-sm text-gray-900 hover:text-blue-600 cursor-pointer mb-1">
                      <span className="font-medium">{entry.trip.title}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {entry.trip.fromLocation} → {entry.trip.toLocation}
                    </div>
                    <div className="text-xs text-gray-500">
                      Organized by {entry.trip.organizer.displayName}
                    </div>
                  </Link>
                  
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(entry.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {historyData.totalPages > 1 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Showing page {historyData.page} of {historyData.totalPages}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}