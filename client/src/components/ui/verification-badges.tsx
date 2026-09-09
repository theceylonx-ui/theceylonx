import { Mail, Star, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface VerificationBadgesProps {
  badges: string[];
  isVerified?: boolean;
  verificationLevel?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

// Only badges the backend actually awards (see storage.ts updateUserVerificationBadges) —
// no identity/ID/phone verification exists on this platform, trust is activity-based only.
const badgeConfig = {
  email_verified: {
    icon: Mail,
    label: "Email confirmed",
    description: "Email address has been confirmed",
    color: "bg-green-100 text-green-800 border-green-200"
  },
  community_leader: {
    icon: Star,
    label: "Community Leader",
    description: "Active in Q&A community with helpful answers",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200"
  },
  host: {
    icon: Star,
    label: "Trusted Host",
    description: "Experienced trip organizer with excellent ratings",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200"
  },
  plus: {
    icon: Award,
    label: "HiBowan Plus",
    description: "Premium member with enhanced features",
    color: "bg-orange-100 text-orange-800 border-orange-200"
  }
};

const sizeClasses = {
  sm: {
    badge: "text-xs px-1.5 py-0.5",
    icon: "h-3 w-3"
  },
  md: {
    badge: "text-sm px-2 py-1",
    icon: "h-4 w-4"
  },
  lg: {
    badge: "text-base px-3 py-1.5",
    icon: "h-5 w-5"
  }
};

export function VerificationBadges({
  badges = [],
  isVerified = false,
  verificationLevel = 0,
  className,
  size = "md",
  showText = true
}: VerificationBadgesProps) {
  const validBadges = badges.filter(badge => badge in badgeConfig);

  if (validBadges.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)}>
      {/* Activity badges only — HiBowan has no identity verification, so no generic "Verified" claim here */}
      {validBadges.map((badgeType) => {
        const config = badgeConfig[badgeType as keyof typeof badgeConfig];
        const IconComponent = config.icon;
        
        return (
          <Tooltip key={badgeType}>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline"
                className={cn(
                  "flex items-center gap-1",
                  config.color,
                  sizeClasses[size].badge
                )}
              >
                <IconComponent className={sizeClasses[size].icon} />
                {showText && size !== "sm" && config.label.split(' ')[0]}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div>
                <p className="font-medium">{config.label}</p>
                <p className="text-sm text-gray-600">{config.description}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}