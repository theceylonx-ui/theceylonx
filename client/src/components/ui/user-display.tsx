import { ClickableAvatar } from "./clickable-avatar";
import { cn } from "@/lib/utils";
import { getDisplayName } from "@/lib/profileUtils";

interface UserDisplayProps {
  user: {
    id?: string;
    displayName?: string | null;
    username?: string | null;
    avatarUrl?: string | null;
    initials: string;
  } | null;
  showAvatar?: boolean;
  avatarSize?: "sm" | "md" | "lg" | "xl";
  className?: string;
  nameClassName?: string;
  layout?: "horizontal" | "vertical";
  clickable?: boolean;
}

export function UserDisplay({ 
  user, 
  showAvatar = true, 
  avatarSize = "md",
  className,
  nameClassName,
  layout = "horizontal",
  clickable = true
}: UserDisplayProps) {
  if (!user) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {showAvatar && <ClickableAvatar user={null} size={avatarSize} disabled />}
        <span className={cn("text-muted-foreground", nameClassName)}>
          Unknown User
        </span>
      </div>
    );
  }

  if (layout === "vertical") {
    return (
      <div className={cn("flex flex-col items-center gap-2", className)}>
        {showAvatar && (
          <ClickableAvatar 
            user={user} 
            size={avatarSize} 
            disabled={!clickable || !user.id}
            showTooltip={clickable && !!user.id}
          />
        )}
        <span className={cn("font-medium", nameClassName)}>
          {getDisplayName(user)}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showAvatar && (
        <ClickableAvatar 
          user={user} 
          size={avatarSize} 
          disabled={!clickable || !user.id}
          showTooltip={clickable && !!user.id}
        />
      )}
      <span className={cn("font-medium", nameClassName)}>
        {getDisplayName(user)}
      </span>
    </div>
  );
}