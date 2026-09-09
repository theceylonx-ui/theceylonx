import { Link, useLocation } from "wouter";
import { Menu, X, MessageSquare, Calendar } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { EnhancedNotificationDropdown } from "@/components/notifications/enhanced-notification-dropdown";
import ProfileMenu from "@/components/navigation/ProfileMenu";

import Copy_of_CEY__X_Letter_Digital_Company_Logo from "@assets/hibowan-pin-hi-mark.svg";

export default function Navigation() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    // Handle post trip routes - both /post and /trips/new should highlight /post
    if (path === '/post') {
      return location === '/post' || location.startsWith('/post?') || location === '/trips/new' || location.startsWith('/trips/new?');
    }
    // For other routes, check exact match or with query parameters
    return location === path || location.startsWith(path + '?');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Same light nav for both signed-in and signed-out -- only the wordmark
  // color changes once signed in (brand tokens: bg = ui-bg/#F8F4EA, text = accent/#3F8AB4).
  const linkClass = (active: boolean) =>
    active
      ? 'bg-brand-subtle text-brand font-semibold shadow-sm'
      : 'text-text-primary hover:text-brand hover:bg-ui-surface';
  const mobileLinkClass = (active: boolean) =>
    active
      ? 'bg-brand-subtle text-brand font-semibold'
      : 'text-text-primary hover:bg-ui-surface hover:text-brand';

  return (
    <nav className="bg-ui-bg border-b border-ui-line/50 sticky top-0 z-50 backdrop-blur-sm transition-all duration-300">
      <div className="page-container">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-all duration-200" data-testid="nav-logo">
              <img
                src={Copy_of_CEY__X_Letter_Digital_Company_Logo}
                alt="HiBowan Logo"
                className="h-8 w-8"
                width="32"
                height="32"
                loading="eager"
                data-testid="logo-icon"
              />
              <span className={`text-xl font-semibold ${user ? 'text-accent' : 'text-text-primary'} transition-colors duration-300`} data-testid="logo-text">HiBowan</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/browse-trips">
              <span
                className={`transition-all duration-200 cursor-pointer relative px-4 py-2 rounded-lg ${linkClass(isActive('/browse-trips'))}`}
                data-testid="nav-browse"
              >
                Browse Trips
              </span>
            </Link>
            <Link href="/post">
              <span
                className={`transition-all duration-200 cursor-pointer relative px-4 py-2 rounded-lg ${linkClass(isActive('/post'))}`}
                data-testid="nav-post"
              >
                Post a Trip
              </span>
            </Link>
            {user && (
              <Link href="/calendar">
                <span
                  className={`transition-all duration-200 cursor-pointer flex items-center gap-2 relative px-4 py-2 rounded-lg ${linkClass(isActive('/calendar'))}`}
                  data-testid="nav-calendar"
                >
                  <Calendar className="w-4 h-4" />
                  Calendar
                </span>
              </Link>
            )}
            {user && (
              <Link href="/chat-buddy">
                <span
                  className={`transition-all duration-200 cursor-pointer flex items-center gap-2 relative px-4 py-2 rounded-lg ${linkClass(isActive('/chat-buddy') || location.startsWith('/chat-buddy/'))}`}
                  data-testid="nav-chat"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat Buddy
                </span>
              </Link>
            )}
            <Link href="/community">
              <span
                className={`transition-all duration-200 cursor-pointer relative px-4 py-2 rounded-lg ${linkClass(isActive('/community'))}`}
                data-testid="nav-community"
              >
                HiBowan Tribes
              </span>
            </Link>
            <Link href="/about">
              <span
                className={`transition-all duration-200 cursor-pointer relative px-4 py-2 rounded-lg ${linkClass(isActive('/about'))}`}
                data-testid="nav-about"
              >
                About
              </span>
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            {user && (
              <>
                <div className="bg-ui-surface hover:bg-brand-subtle rounded-lg p-2 transition-all duration-200 border border-ui-line">
                  <EnhancedNotificationDropdown />
                </div>
                <div className="bg-ui-surface hover:bg-brand-subtle rounded-lg p-2 transition-all duration-200 border border-ui-line">
                  <ProfileMenu />
                </div>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-text-secondary hover:text-brand hover:bg-ui-surface transition-colors duration-200"
              data-testid="mobile-menu-button"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-6 border-t border-ui-line/50 animate-fade-in backdrop-blur-sm">
            <div className="space-y-4">
              <Link href="/browse-trips">
                <div
                  className={`block px-4 py-3 rounded-xl transition-all duration-200 ${mobileLinkClass(isActive('/browse-trips'))}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="mobile-nav-browse"
                >
                  Browse Trips
                </div>
              </Link>
              <Link href="/post">
                <div
                  className={`block px-4 py-3 rounded-xl transition-all duration-200 ${mobileLinkClass(isActive('/post'))}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="mobile-nav-post"
                >
                  Post a Trip
                </div>
              </Link>
              {user && (
                <Link href="/calendar">
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${mobileLinkClass(isActive('/calendar'))}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    data-testid="mobile-nav-calendar"
                  >
                    <Calendar className="w-4 h-4" />
                    Calendar
                  </div>
                </Link>
              )}
              {user && (
                <Link href="/chat-buddy">
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${mobileLinkClass(isActive('/chat-buddy') || location.startsWith('/chat-buddy/'))}`}
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
                  className={`block px-4 py-3 rounded-xl transition-all duration-200 ${mobileLinkClass(isActive('/community'))}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="mobile-nav-community"
                >
                  HiBowan Tribes
                </div>
              </Link>
              <Link href="/about">
                <div
                  className={`block px-4 py-3 rounded-xl transition-all duration-200 ${mobileLinkClass(isActive('/about'))}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="mobile-nav-about"
                >
                  About
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
