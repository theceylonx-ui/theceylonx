import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  HelpCircle, 
  LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { generateRandomProfilePicture, getDisplayName, getInitials } from "@/lib/profileUtils";

interface ProfileMenuProps {
  className?: string;
}

export default function ProfileMenu({ className }: ProfileMenuProps) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [, setLocation] = useLocation();

  // Analytics helper
  const trackEvent = (event: string, data?: Record<string, any>) => {
    // Fire analytics events as specified
    console.log(`Analytics: ${event}`, data);
  };

  const handleMenuOpen = (open: boolean) => {
    setIsOpen(open);
    trackEvent(open ? 'profile_menu.open' : 'profile_menu.close');
  };

  const handleMenuItemClick = (item: string) => {
    trackEvent('profile_menu.click', { item });
    setIsOpen(false);
  };

  const handleLogout = async () => {
    handleMenuItemClick('Logout');
    await logout();
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  if (!user) {
    return null;
  }

  const profileUrl = `/me`;

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          ref={triggerRef}
          variant="ghost"
          className={`relative h-8 w-8 rounded-full ${className || ''}`}
          data-testid="profile-menu-trigger"
          aria-expanded={isOpen}
          aria-controls="profile-menu-content"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={user.profileImageUrl || generateRandomProfilePicture(user.id)} 
              alt="Profile" 
            />
            <AvatarFallback>
              {getInitials(user)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        id="profile-menu-content"
        className="w-56" 
        align="end" 
        forceMount
        data-testid="profile-menu-content"
      >
        {/* User Info Header */}
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium" data-testid="profile-menu-user-name">
              {getDisplayName(user)}
            </p>
            {user.username && (
              <p className="text-xs text-muted-foreground">@{user.username}</p>
            )}
            <p className="w-[200px] truncate text-sm text-muted-foreground" data-testid="profile-menu-user-email">
              {user.email}
            </p>
          </div>
        </div>
        
        <DropdownMenuSeparator />

        {/* 1. Dashboard */}
        <Link href={profileUrl}>
          <DropdownMenuItem 
            className="cursor-pointer" 
            data-testid="profile-menu-dashboard"
            onClick={() => handleMenuItemClick('Dashboard')}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </DropdownMenuItem>
        </Link>

        {/* 2. Chatbuddy */}
        <Link href="/chat-buddy">
          <DropdownMenuItem 
            className="cursor-pointer" 
            data-testid="profile-menu-chatbuddy"
            onClick={() => handleMenuItemClick('Chatbuddy')}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat Buddy
          </DropdownMenuItem>
        </Link>

        {/* 3. Ceylon's Tribes */}
        <Link href="/community">
          <DropdownMenuItem 
            className="cursor-pointer" 
            data-testid="profile-menu-ceylons-tribes"
            onClick={() => handleMenuItemClick('CeylonsTribes')}
          >
            <Users className="mr-2 h-4 w-4" />
            CeylonX Tribes
          </DropdownMenuItem>
        </Link>

        {/* 4. Help – FAQ */}
        <Link href="/help/faq">
          <DropdownMenuItem 
            className="cursor-pointer" 
            data-testid="profile-menu-help-faq"
            onClick={() => handleMenuItemClick('HelpFAQ')}
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Help – FAQ
          </DropdownMenuItem>
        </Link>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50" 
          onClick={handleLogout}
          data-testid="profile-menu-logout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}