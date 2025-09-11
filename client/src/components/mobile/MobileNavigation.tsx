import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Home, 
  Search, 
  Plus, 
  Users, 
  User,
  Menu,
  X,
  MapPin,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface MobileNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth?: boolean;
}

const navigationItems: MobileNavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/browse-trips', label: 'Browse', icon: Search },
  { href: '/post', label: 'Post', icon: Plus, requiresAuth: true },
  { href: '/community', label: 'Tribes', icon: Users },
  { href: '/me', label: 'Profile', icon: User, requiresAuth: true },
];

export function MobileNavigation() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Filter navigation items based on auth status
  const visibleItems = navigationItems.filter(item => 
    !item.requiresAuth || isAuthenticated
  );

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return location === '/';
    }
    return location.startsWith(href);
  };

  return (
    <>
      {/* Bottom Navigation Bar - Mobile */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 bg-ui-bg border-t border-ui-line z-50 safe-area-bottom"
        role="navigation"
        aria-label="Mobile bottom navigation"
        data-testid="mobile-navigation"
      >
        <div className="flex items-center justify-around px-2 py-2">
          {visibleItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);
            
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 touch-target",
                    "focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2",
                    isActive 
                      ? "text-brand bg-brand/10" 
                      : "text-text-muted hover:text-brand hover:bg-brand/5"
                  )}
                  aria-label={`Navigate to ${item.label}`}
                  data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                >
                  <Icon className={cn("h-5 w-5 mb-1", isActive && "scale-110")} aria-hidden="true" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              </Link>
            );
          })}
          
          {/* Menu button for additional items */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 text-text-muted hover:text-brand hover:bg-brand/5 touch-target focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
            aria-label="Open navigation menu"
            data-testid="mobile-nav-menu"
          >
            <Menu className="h-5 w-5 mb-1" aria-hidden="true" />
            <span className="text-xs font-medium">Menu</span>
          </button>
        </div>
      </nav>

      {/* Full Screen Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-ui-bg z-50 safe-area-top safe-area-bottom"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          data-testid="mobile-menu-overlay"
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-ui-line">
              <h2 className="text-lg font-semibold text-text-primary">Menu</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-full hover:bg-ui-surface transition-colors touch-target focus:outline-none focus:ring-2 focus:ring-brand"
                aria-label="Close menu"
                data-testid="mobile-menu-close"
              >
                <X className="h-6 w-6 text-text-secondary" aria-hidden="true" />
              </button>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto">
              <nav className="p-4 space-y-2" role="list">
                {/* Primary Navigation */}
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider px-3 py-2">
                    Navigation
                  </h3>
                  {navigationItems.map((item) => {
                    if (item.requiresAuth && !isAuthenticated) return null;
                    
                    const Icon = item.icon;
                    const isActive = isActiveRoute(item.href);
                    
                    return (
                      <Link key={item.href} href={item.href}>
                        <button
                          className={cn(
                            "w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200",
                            "focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2",
                            isActive
                              ? "bg-brand text-white"
                              : "text-text-primary hover:bg-ui-surface"
                          )}
                          data-testid={`menu-item-${item.label.toLowerCase()}`}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                          <span className="font-medium">{item.label}</span>
                        </button>
                      </Link>
                    );
                  })}
                </div>

                {/* Secondary Navigation */}
                <div className="space-y-1 pt-4">
                  <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider px-3 py-2">
                    More
                  </h3>
                  
                  <Link href="/calendar">
                    <button className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 text-text-primary hover:bg-ui-surface focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2">
                      <MapPin className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                      <span className="font-medium">Calendar</span>
                    </button>
                  </Link>
                  
                  {isAuthenticated && (
                    <Link href="/chat-buddy">
                      <button className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 text-text-primary hover:bg-ui-surface focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2">
                        <MessageSquare className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                        <span className="font-medium">Chat Buddy</span>
                      </button>
                    </Link>
                  )}

                  <Link href="/help/faq">
                    <button className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 text-text-primary hover:bg-ui-surface focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2">
                      <span className="text-xl flex-shrink-0" aria-hidden="true">❓</span>
                      <span className="font-medium">Help & FAQ</span>
                    </button>
                  </Link>
                </div>
              </nav>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-ui-line bg-ui-surface">
              <div className="text-center">
                <p className="text-sm text-text-muted">
                  Ceylon Expand v1.0
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Travel Together, Share the Journey
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for bottom navigation */}
      <div className="md:hidden h-16 flex-shrink-0" aria-hidden="true" />
    </>
  );
}

export default MobileNavigation;