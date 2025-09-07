import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, MoreVertical, Trash2, Check, CheckCheck, X } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import type { Notification } from "@shared/schema";

type NotificationCategory = "trips" | "social" | "safety" | "system";
type NotificationPriority = "critical" | "normal" | "info";

export function EnhancedNotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationCategory | "all">("all");

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

  // Filter notifications by category
  const filteredNotifications = activeTab === "all" 
    ? notifications 
    : notifications.filter(n => n.category === activeTab);

  // Get counts by category
  const getCategoryCount = (category: NotificationCategory) => {
    return notifications.filter(n => n.category === category && !n.isRead).length;
  };

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
    console.log('Enhanced Notification clicked:', {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
      primaryActionUrl: notification.primaryActionUrl
    });
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
    const icons: Record<string, string> = {
      // Trip Participation
      "trip_interest_request": "👋",
      "trip_interest_approved": "✅", 
      "trip_interest_declined": "❌",
      "trip_interest_pending_reminder": "🕒",
      
      // My Posted Trips
      "trip_viewed": "👀",
      "trip_commented": "💬",
      "trip_edited": "✍️",
      
      // System & Safety
      "trip_reported": "⚠️",
      "trip_flagged": "🚨",
      "weather_alert": "⛈️",
      "region_alert": "📍",
      
      // Social
      "new_follower": "👥",
      "trip_liked": "⭐",
      "direct_message": "📨",
      
      // Booking & Payment
      "booking_confirmed": "💳",
      "booking_failed": "❌",
      "payment_received": "✅",
      
      // Admin & Platform
      "feature_update": "📢",
      "policy_change": "🛡️",
      "account_alert": "🚨",
      
      // Legacy
      "trip_completed": "🏁",
      "trip_cancelled": "🚫",
      "new_trip_in_region": "🗺️",
      "system_update": "📱"
    };
    return icons[type] || "🔔";
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case "critical":
        return "border-l-red-500 bg-red-50 dark:bg-red-950/30";
      case "normal":
        return "border-l-blue-500 bg-blue-50 dark:bg-blue-950/30";
      case "info":
        return "border-l-gray-500 bg-gray-50 dark:bg-gray-950/30";
      default:
        return "border-l-gray-300";
    }
  };

  const getCategoryLabel = (category: NotificationCategory) => {
    const labels = {
      trips: "Trips",
      social: "Social",
      safety: "Safety",
      system: "System"
    };
    return labels[category];
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    const icons = {
      trips: "🧳",
      social: "👥",
      safety: "⚠️",
      system: "⚙️"
    };
    return icons[category];
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
        className="w-96 bg-ui-surface border-ui-line shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)]" 
        align="end"
        data-testid="dropdown-notifications"
      >
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="text-sm font-semibold text-red-600" style={{ color: 'red !important' }}>
            🚨 ENHANCED NOTIFICATIONS ACTIVE 🚨
          </DropdownMenuLabel>
          <div className="flex items-center gap-2">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              data-testid="button-close-notifications"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <DropdownMenuSeparator />
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as NotificationCategory | "all")} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-8 p-1 mx-2 mb-2">
            <TabsTrigger value="all" className="text-xs py-1 data-[state=active]:bg-ceylon-green data-[state=active]:text-white transition-all duration-200">
              All {unreadCount > 0 && <Badge className="ml-1 h-4 w-4 p-0 text-xs">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="trips" className="text-xs py-1 data-[state=active]:bg-ceylon-green data-[state=active]:text-white transition-all duration-200">
              {getCategoryIcon("trips")}
              {getCategoryCount("trips") > 0 && <Badge className="ml-1 h-4 w-4 p-0 text-xs">{getCategoryCount("trips")}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="social" className="text-xs py-1 data-[state=active]:bg-ceylon-green data-[state=active]:text-white transition-all duration-200">
              {getCategoryIcon("social")}
              {getCategoryCount("social") > 0 && <Badge className="ml-1 h-4 w-4 p-0 text-xs">{getCategoryCount("social")}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="safety" className="text-xs py-1 data-[state=active]:bg-ceylon-green data-[state=active]:text-white transition-all duration-200">
              {getCategoryIcon("safety")}
              {getCategoryCount("safety") > 0 && <Badge className="ml-1 h-4 w-4 p-0 text-xs">{getCategoryCount("safety")}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="system" className="text-xs py-1 data-[state=active]:bg-ceylon-green data-[state=active]:text-white transition-all duration-200">
              {getCategoryIcon("system")}
              {getCategoryCount("system") > 0 && <Badge className="ml-1 h-4 w-4 p-0 text-xs">{getCategoryCount("system")}</Badge>}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            <ScrollArea className="h-96">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading notifications...
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {activeTab === "all" ? "No notifications yet" : `No ${getCategoryLabel(activeTab as NotificationCategory).toLowerCase()} notifications`}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`group relative flex items-start gap-3 p-4 border-l-4 hover:bg-ui-surface/80 cursor-pointer transition-colors duration-200 ${
                        getPriorityColor(notification.priority as NotificationPriority)
                      } ${!notification.isRead ? "bg-ui-surface/50" : ""}`}
                      onClick={() => handleNotificationClick(notification)}
                      data-testid={`notification-${notification.id}`}
                    >
                      <div className="text-lg flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm leading-tight font-semibold text-gray-900 dark:text-gray-100">
                              🚨 ENHANCED FILE ACTIVE 🚨 {notification.title}
                              {notification.priority === "critical" && (
                                <Badge variant="destructive" className="ml-2 text-xs">
                                  Urgent
                                </Badge>
                              )}
                            </p>
                            <p className="text-xs mt-1 line-clamp-2 text-gray-700 dark:text-gray-300">
                              {notification.message}
                            </p>
                          </div>
                          
                          {!notification.isRead && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(notification.createdAt || new Date()), { addSuffix: true })}
                          </p>
                          <Badge variant="outline" className="text-xs text-gray-600 dark:text-gray-400">
                            {getCategoryLabel(notification.category as NotificationCategory)}
                          </Badge>
                        </div>
                        
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
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}