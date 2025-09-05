import { Link, useLocation } from "wouter";
import { Menu, X, MessageSquare, Calendar } from "lucide-react";
import { useState } from "react";
import logoImage from "@assets/5_1756417819316.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { EnhancedNotificationDropdown } from "@/components/notifications/enhanced-notification-dropdown";
import ProfileMenu from "@/components/navigation/ProfileMenu";

export default function Navigation() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            {user && (
              <Link href="/calendar">
                <span 
                  className={`transition-colors cursor-pointer flex items-center gap-1 ${
                    isActive('/calendar') 
                      ? 'text-ceylon-green font-medium' 
                      : 'text-gray-600 hover:text-ceylon-green'
                  }`}
                  data-testid="nav-calendar"
                >
                  <Calendar className="w-4 h-4" />
                  Calendar
                </span>
              </Link>
            )}
            {user && (
              <Link href="/chat">
                <span 
                  className={`transition-colors cursor-pointer flex items-center gap-1 ${
                    isActive('/chat') || location.startsWith('/chat/') 
                      ? 'text-ceylon-green font-medium' 
                      : 'text-gray-600 hover:text-ceylon-green'
                  }`}
                  data-testid="nav-chat"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat Buddy
                </span>
              </Link>
            )}
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
                <EnhancedNotificationDropdown />
                <ProfileMenu />
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
              {user && (
                <Link href="/calendar">
                  <span 
                    className={`block px-3 py-2 text-base transition-colors cursor-pointer flex items-center gap-2 ${
                      isActive('/calendar') 
                        ? 'text-ceylon-green font-medium' 
                        : 'text-gray-600 hover:text-ceylon-green'
                    }`}
                    onClick={toggleMobileMenu}
                    data-testid="mobile-nav-calendar"
                  >
                    <Calendar className="w-4 h-4" />
                    Calendar
                  </span>
                </Link>
              )}
              {user && (
                <Link href="/chat">
                  <span 
                    className={`block px-3 py-2 text-base transition-colors cursor-pointer flex items-center gap-2 ${
                      isActive('/chat') || location.startsWith('/chat/') 
                        ? 'text-ceylon-green font-medium' 
                        : 'text-gray-600 hover:text-ceylon-green'
                    }`}
                    onClick={toggleMobileMenu}
                    data-testid="mobile-nav-chat"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Chat Buddy
                  </span>
                </Link>
              )}
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
