import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: {
    displayName: string;
    avatarUrl?: string | null;
    initials: string;
  } | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm", 
  lg: "h-10 w-10 text-base",
  xl: "h-12 w-12 text-lg"
};

export function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  if (!user) {
    return (
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarFallback>??</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {user.avatarUrl && (
        <AvatarImage 
          src={user.avatarUrl} 
          alt={user.displayName}
          className="object-cover"
        />
      )}
      <AvatarFallback className="bg-gray-700 text-white font-semibold border-2 border-gray-300">
        {user.initials}
      </AvatarFallback>
    </Avatar>
  );
}