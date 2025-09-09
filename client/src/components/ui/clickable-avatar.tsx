import { useLocation } from "wouter";
import { UserAvatar } from "./user-avatar";
import { cn } from "@/lib/utils";

interface ClickableAvatarProps {
  user: {
    id?: string;
    displayName: string;
    avatarUrl?: string | null;
    initials: string;
  } | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  disabled?: boolean;
  showTooltip?: boolean;
}

export function ClickableAvatar({ 
  user, 
  size = "md", 
  className,
  disabled = false,
  showTooltip = true
}: ClickableAvatarProps) {
  const [, setLocation] = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || !user?.id) return;
    
    // Navigate to user profile
    setLocation(`/profile/${user.id}`);
  };

  if (!user || disabled) {
    return <UserAvatar user={user} size={size} className={className} />;
  }

  return (
    <div className={cn("relative group", className)}>
      <div
        onClick={handleClick}
        className={cn(
          "cursor-pointer transition-all duration-200 transform",
          "hover:scale-110 hover:shadow-lg active:scale-95",
          user.id && "hover:ring-2 hover:ring-blue-500/50 hover:ring-offset-2",
          "rounded-full"
        )}
        data-testid={`clickable-avatar-${user.id}`}
        title={showTooltip ? `View ${user.displayName}'s profile` : undefined}
      >
        <UserAvatar user={user} size={size} />
      </div>
      
      {/* Optional hover tooltip */}
      {showTooltip && user.id && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          View {user.displayName}'s profile
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}