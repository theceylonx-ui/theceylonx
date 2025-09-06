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
    <nav className="bg-ui-bg border-b border-ui-line/50 sticky top-0 z-50 backdrop-blur-sm bg-ui-bg/95">
      <div className="page-container">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-all duration-200" data-testid="nav-logo">
              <img src={logoImage} alt="Ceylon Expand Logo" className="h-8 w-8" />
              <span className="text-xl font-semibold text-text-primary">Ceylon Expand</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/browse-trips">
              <span 
                className={`transition-all duration-200 cursor-pointer relative py-2 ${
                  isActive('/browse-trips') 
                    ? 'text-brand font-semibold' 
                    : 'text-text-secondary hover:text-brand'
                } ${isActive('/browse-trips') ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand after:rounded-full' : ''}`}
                data-testid="nav-browse"
              >
                Browse Trips
              </span>
            </Link>
            <Link href="/post">
              <span 
                className={`transition-all duration-200 cursor-pointer relative py-2 ${
                  isActive('/post') 
                    ? 'text-brand font-semibold' 
                    : 'text-text-secondary hover:text-brand'
                } ${isActive('/post') ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand after:rounded-full' : ''}`}
                data-testid="nav-post"
              >
                Post a Trip
              </span>
            </Link>
            {user && (
              <Link href="/calendar">
                <span 
                  className={`transition-all duration-200 cursor-pointer flex items-center gap-2 relative py-2 ${
                    isActive('/calendar') 
                      ? 'text-brand font-semibold' 
                      : 'text-text-secondary hover:text-brand'
                  } ${isActive('/calendar') ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand after:rounded-full' : ''}`}
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
                  className={`transition-all duration-200 cursor-pointer flex items-center gap-2 relative py-2 ${
                    isActive('/chat') || location.startsWith('/chat/') 
                      ? 'text-brand font-semibold' 
                      : 'text-text-secondary hover:text-brand'
                  } ${(isActive('/chat') || location.startsWith('/chat/')) ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand after:rounded-full' : ''}`}
                  data-testid="nav-chat"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat Buddy
                </span>
              </Link>
            )}
            <Link href="/community">
              <span 
                className={`transition-all duration-200 cursor-pointer relative py-2 ${
                  isActive('/community') 
                    ? 'text-brand font-semibold' 
                    : 'text-text-secondary hover:text-brand'
                } ${isActive('/community') ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand after:rounded-full' : ''}`}
                data-testid="nav-community"
              >
                Community
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
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-text-secondary hover:text-brand hover:bg-ui-surface"
              data-testid="mobile-menu-button"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-6 border-t border-ui-line/50 animate-fade-in">
            <div className="space-y-4">
              <Link href="/browse-trips">
                <div 
                  className={`block px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive('/browse-trips') 
                      ? 'bg-brand-subtle text-brand font-semibold' 
                      : 'text-text-secondary hover:bg-ui-surface hover:text-brand'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="mobile-nav-browse"
                >
                  Browse Trips
                </div>
              </Link>
              <Link href="/post">
                <div 
                  className={`block px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive('/post') 
                      ? 'bg-brand-subtle text-brand font-semibold' 
                      : 'text-text-secondary hover:bg-ui-surface hover:text-brand'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="mobile-nav-post"
                >
                  Post a Trip
                </div>
              </Link>
              {user && (
                <Link href="/calendar">
                  <div 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive('/calendar') 
                        ? 'bg-brand-subtle text-brand font-semibold' 
                        : 'text-text-secondary hover:bg-ui-surface hover:text-brand'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    data-testid="mobile-nav-calendar"
                  >
                    <Calendar className="w-4 h-4" />
                    Calendar
                  </div>
                </Link>
              )}
              {user && (
                <Link href="/chat">
                  <div 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive('/chat') || location.startsWith('/chat/') 
                        ? 'bg-brand-subtle text-brand font-semibold' 
                        : 'text-text-secondary hover:bg-ui-surface hover:text-brand'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    data-testid="mobile-nav-chat"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Chat Buddy
                  </div>
                </Link>
              )}
              <Link href="/community">
                <div 
                  className={`block px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive('/community') 
                      ? 'bg-brand-subtle text-brand font-semibold' 
                      : 'text-text-secondary hover:bg-ui-surface hover:text-brand'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="mobile-nav-community"
                >
                  Community
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}