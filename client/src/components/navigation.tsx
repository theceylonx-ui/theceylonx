import { Link, useLocation } from "wouter";
import { User, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import logoImage from "@assets/5_1756417819316.png";
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
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

export default function Navigation() {
  const { user, logout, isLoggingOut } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const isActive = (path: string) => {
    return location === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-all duration-200" data-testid="nav-logo">
              <img src={logoImage} alt="Ceylon Expand Logo" className="h-8 w-8" />
              <span className="text-xl font-bold text-ceylon-dark">Ceylon Expand</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/browse-trips">
              <span 
                className={`transition-colors cursor-pointer ${
                  isActive('/browse-trips') 
                    ? 'text-ceylon-green font-medium' 
                    : 'text-gray-600 hover:text-ceylon-green'
                }`}
                data-testid="nav-browse"
              >
                Browse Trips
              </span>
            </Link>
            <Link href="/post">
              <span 
                className={`transition-colors cursor-pointer ${
                  isActive('/post') 
                    ? 'text-ceylon-green font-medium' 
                    : 'text-gray-600 hover:text-ceylon-green'
                }`}
                data-testid="nav-post"
              >
                Post a Trip
              </span>
            </Link>
            <Link href="/community">
              <span 
                className={`transition-colors cursor-pointer ${
                  isActive('/community') 
                    ? 'text-ceylon-green font-medium' 
                    : 'text-gray-600 hover:text-ceylon-green'
                }`}
                data-testid="nav-community"
              >CeylonX Tribes</span>
            </Link>
            <Link href="/faq">
              <span 
                className={`transition-colors cursor-pointer ${
                  isActive('/faq') 
                    ? 'text-ceylon-green font-medium' 
                    : 'text-gray-600 hover:text-ceylon-green'
                }`}
                data-testid="nav-faq"
              >
                FAQ
              </span>
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            {user && (
              <>
                <NotificationDropdown />
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="user-menu-trigger">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl || generateRandomProfilePicture(user.id)} alt="Profile" />
                      <AvatarFallback>
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium" data-testid="user-menu-name">
                        {getDisplayName(user)}
                      </p>
                      {user.username && (
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      )}
                      <p className="w-[200px] truncate text-sm text-muted-foreground" data-testid="user-menu-email">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <Link href="/dashboard">
                    <DropdownMenuItem className="cursor-pointer" data-testid="user-menu-dashboard">
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/preferences">
                    <DropdownMenuItem className="cursor-pointer" data-testid="user-menu-preferences">
                      <User className="mr-2 h-4 w-4" />
                      Travel Preferences
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/admin">
                    <DropdownMenuItem className="cursor-pointer" data-testid="user-menu-admin">
                      <User className="mr-2 h-4 w-4" />
                      Smart Insights
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50" 
                    onClick={handleLogout}
                    data-testid="user-menu-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={toggleMobileMenu}
              data-testid="mobile-menu-toggle"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t py-4 bg-white" data-testid="mobile-menu">
            <div className="flex flex-col space-y-1 px-4">
              <Link href="/browse-trips">
                <span 
                  className={`block px-3 py-2 text-base transition-colors cursor-pointer ${
                    isActive('/browse-trips') 
                      ? 'text-ceylon-green font-medium' 
                      : 'text-gray-600 hover:text-ceylon-green'
                  }`}
                  onClick={toggleMobileMenu}
                  data-testid="mobile-nav-browse"
                >
                  Browse Trips
                </span>
              </Link>
              <Link href="/post">
                <span 
                  className={`block px-3 py-2 text-base transition-colors cursor-pointer ${
                    isActive('/post') 
                      ? 'text-ceylon-green font-medium' 
                      : 'text-gray-600 hover:text-ceylon-green'
                  }`}
                  onClick={toggleMobileMenu}
                  data-testid="mobile-nav-post"
                >
                  Post a Trip
                </span>
              </Link>
              <Link href="/community">
                <span 
                  className={`block px-3 py-2 text-base transition-colors cursor-pointer ${
                    isActive('/community') 
                      ? 'text-ceylon-green font-medium' 
                      : 'text-gray-600 hover:text-ceylon-green'
                  }`}
                  onClick={toggleMobileMenu}
                  data-testid="mobile-nav-community"
                >
                  Community
                </span>
              </Link>
              <Link href="/faq">
                <span 
                  className={`block px-3 py-2 text-base transition-colors cursor-pointer ${
                    isActive('/faq') 
                      ? 'text-ceylon-green font-medium' 
                      : 'text-gray-600 hover:text-ceylon-green'
                  }`}
                  onClick={toggleMobileMenu}
                  data-testid="mobile-nav-faq"
                >
                  FAQ
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
