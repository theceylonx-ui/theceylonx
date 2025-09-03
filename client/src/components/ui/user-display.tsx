import { UserAvatar } from "./user-avatar";
import { cn } from "@/lib/utils";

interface UserDisplayProps {
  user: {
    displayName: string;
    avatarUrl?: string | null;
    initials: string;
  } | null;
  showAvatar?: boolean;
  avatarSize?: "sm" | "md" | "lg" | "xl";
  className?: string;
  nameClassName?: string;
  layout?: "horizontal" | "vertical";
}

export function UserDisplay({ 
  user, 
  showAvatar = true, 
  avatarSize = "md",
  className,
  nameClassName,
  layout = "horizontal"
}: UserDisplayProps) {
  if (!user) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {showAvatar && <UserAvatar user={null} size={avatarSize} />}
        <span className={cn("text-muted-foreground", nameClassName)}>
          Unknown User
        </span>
      </div>
    );
  }

  if (layout === "vertical") {
    return (
      <div className={cn("flex flex-col items-center gap-2", className)}>
        {showAvatar && <UserAvatar user={user} size={avatarSize} />}
        <span className={cn("font-medium", nameClassName)}>
          {user.displayName}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showAvatar && <UserAvatar user={user} size={avatarSize} />}
      <span className={cn("font-medium", nameClassName)}>
        {user.displayName}
      </span>
    </div>
  );
}