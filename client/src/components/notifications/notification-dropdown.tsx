import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, MoreVertical, Trash2, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import type { Notification } from "@shared/schema";

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: isOpen,
  });

  // Fetch unread count
  const { data: unreadCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = unreadCountData?.count || 0;

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("DELETE", `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    console.log('Notification clicked:', notification);
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    // Try primary action URL first, then fallback to actionUrl
    const targetUrl = notification.primaryActionUrl || notification.actionUrl;
    if (targetUrl) {
      console.log('Navigating to:', targetUrl);
      window.location.href = targetUrl;
    } else {
      console.log('No action URL found for notification:', notification);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "trip_interest_request":
        return "👋";
      case "trip_interest_approved":
        return "✅";
      case "trip_interest_declined":
        return "❌";
      case "trip_reported":
        return "⚠️";
      case "trip_cancelled":
        return "🚫";
      case "trip_updated":
        return "📝";
      case "comment_added":
        return "💬";
      default:
        return "🔔";
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-500"
              data-testid="badge-unread-count"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-80" 
        align="end"
        data-testid="dropdown-notifications"
      >
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="text-sm font-semibold">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="h-4 w-4" />
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group relative flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                    !notification.isRead ? "bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="text-lg flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium leading-tight text-gray-900 dark:text-gray-100">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      
                      {!notification.isRead && (
                        <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {formatDistanceToNow(new Date(notification.createdAt || new Date()), { addSuffix: true })}
                    </p>
                    
                    {/* Dual Action Links */}
                    {(notification.primaryActionLabel || notification.secondaryActionLabel) && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                        {notification.primaryActionLabel && notification.primaryActionUrl && (
                          <Button
                            size="sm"
                            className="bg-ceylon-green hover:bg-ceylon-green/90 text-white text-xs px-3 py-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = notification.primaryActionUrl;
                            }}
                            data-testid={`button-primary-action-${notification.id}`}
                          >
                            {notification.primaryActionLabel}
                          </Button>
                        )}
                        {notification.secondaryActionLabel && notification.secondaryActionUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-ceylon-blue border-ceylon-blue hover:bg-ceylon-blue hover:text-white text-xs px-3 py-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = notification.secondaryActionUrl;
                            }}
                            data-testid={`button-secondary-action-${notification.id}`}
                          >
                            {notification.secondaryActionLabel}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`button-notification-actions-${notification.id}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!notification.isRead && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsReadMutation.mutate(notification.id);
                          }}
                          data-testid={`button-mark-read-${notification.id}`}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Mark as read
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotificationMutation.mutate(notification.id);
                        }}
                        className="text-red-600"
                        data-testid={`button-delete-${notification.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}