import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { createBackToTripsLink } from "@/utils/searchParams";
import { cn } from "@/lib/utils";

interface BackLinkProps {
  to?: string;
  label?: string;
  className?: string;
  variant?: "default" | "ghost" | "link";
  useReturnTo?: boolean;
}

export function BackLink({ 
  to, 
  label = "Back to Browse", 
  className,
  variant = "ghost",
  useReturnTo = true
}: BackLinkProps) {
  const [, setLocation] = useLocation();
  
  const getBackPath = () => {
    if (to) return to;
    if (useReturnTo) return createBackToTripsLink();
    return '/trips';
  };
  
  const backPath = getBackPath();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setLocation(backPath);
  };
  
  return (
    <Button
      variant={variant}
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium",
        variant === "ghost" && "px-0 hover:bg-transparent",
        className
      )}
      onClick={handleClick}
      data-testid="button-back-link"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}

// Alternative link version for when you need actual link behavior
export function BackLinkComponent({ 
  to, 
  label = "← Back to Browse", 
  className 
}: { 
  to?: string; 
  label?: string; 
  className?: string; 
}) {
  const backPath = to || createBackToTripsLink();
  
  return (
    <Link
      href={backPath}
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
      data-testid="link-back-to-browse"
    >
      {label}
    </Link>
  );
}