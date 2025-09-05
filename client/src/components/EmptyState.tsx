import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, MessageCircle, Users, Search, Plus, Calendar, Heart } from "lucide-react";

interface EmptyStateProps {
  type: 'trips' | 'chat' | 'notifications' | 'history' | 'pins' | 'questions' | 'generic';
  title?: string;
  description?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  icon?: ReactNode;
  className?: string;
  showCard?: boolean;
}

const getDefaultContent = (type: EmptyStateProps['type']) => {
  switch (type) {
    case 'trips':
      return {
        icon: <MapPin className="w-16 h-16 text-gray-300" />,
        title: "No trips found",
        description: "Try adjusting your filters or check back later for new trips."
      };
    case 'chat':
      return {
        icon: <MessageCircle className="w-16 h-16 text-gray-300" />,
        title: "No chat conversations yet",
        description: "Chat requests will appear here when organizers approve them."
      };
    case 'notifications':
      return {
        icon: (
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-2xl">🔔</span>
            </div>
          </div>
        ),
        title: "No notifications yet",
        description: "You'll receive updates about trip interest, approvals, and system messages here."
      };
    case 'history':
      return {
        icon: <Calendar className="w-16 h-16 text-gray-300" />,
        title: "No trip history",
        description: "Your completed trips and past activities will appear here."
      };
    case 'pins':
      return {
        icon: <Heart className="w-16 h-16 text-gray-300" />,
        title: "No saved trips",
        description: "Save trips you're interested in by clicking the pin icon on trip cards."
      };
    case 'questions':
      return {
        icon: (
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-2xl">❓</span>
            </div>
          </div>
        ),
        title: "No questions yet",
        description: "Ask the community about travel destinations, tips, or trip planning."
      };
    case 'generic':
    default:
      return {
        icon: <Search className="w-16 h-16 text-gray-300" />,
        title: "Nothing here yet",
        description: "Content will appear here once available."
      };
  }
};

export function EmptyState({
  type,
  title,
  description,
  primaryAction,
  secondaryAction,
  icon,
  className = "",
  showCard = true
}: EmptyStateProps) {
  const defaultContent = getDefaultContent(type);
  
  const content = (
    <div className={`text-center py-12 ${className}`} data-testid={`empty-state-${type}`}>
      <div className="mb-6 flex justify-center">
        {icon || defaultContent.icon}
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2" data-testid="empty-state-title">
        {title || defaultContent.title}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto" data-testid="empty-state-description">
        {description || defaultContent.description}
      </p>
      
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              variant={primaryAction.variant || "default"}
              className={`${primaryAction.variant === "default" ? "bg-ceylon-green hover:bg-ceylon-green/90" : ""}`}
              data-testid="empty-state-primary-action"
            >
              {type === 'trips' && primaryAction.label.includes('Post') && <Plus className="h-4 w-4 mr-2" />}
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant={secondaryAction.variant || "outline"}
              className="text-ceylon-blue border-ceylon-blue hover:bg-ceylon-blue hover:text-white"
              data-testid="empty-state-secondary-action"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return showCard ? (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        {content}
      </CardContent>
    </Card>
  ) : (
    content
  );
}