import { Link, useLocation } from "wouter";
import { Mountain, User, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
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

export default function Navigation() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const isActive = (path: string) => {
    return location === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" data-testid="nav-logo">
            <Link href="/">
              <div className="flex items-center space-x-2">
                <Mountain className="text-ceylon-green h-8 w-8" />
                <span className="text-xl font-bold text-gray-800">CeylonX Tribes</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/browse">
              <span 
                className={`transition-colors cursor-pointer ${
                  isActive('/browse') 
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
            <Link href="/dashboard">
              <span 
                className={`transition-colors cursor-pointer ${
                  isActive('/dashboard') 
                    ? 'text-ceylon-green font-medium' 
                    : 'text-gray-600 hover:text-ceylon-green'
                }`}
                data-testid="nav-dashboard"
              >
                Dashboard
              </span>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="user-menu-trigger">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl || ""} alt="Profile" />
                      <AvatarFallback>
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium" data-testid="user-menu-name">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground" data-testid="user-menu-email">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <Link href="/dashboard">
                    <DropdownMenuItem className="cursor-pointer" data-testid="user-menu-dashboard">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-600 focus:text-red-600" 
                    onClick={handleLogout}
                    data-testid="user-menu-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
          <div className="md:hidden border-t py-4" data-testid="mobile-menu">
            <div className="flex flex-col space-y-3">
              <Link href="/browse">
                <span 
                  className={`block px-3 py-2 text-base transition-colors cursor-pointer ${
                    isActive('/browse') 
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
              <Link href="/dashboard">
                <span 
                  className={`block px-3 py-2 text-base transition-colors cursor-pointer ${
                    isActive('/dashboard') 
                      ? 'text-ceylon-green font-medium' 
                      : 'text-gray-600 hover:text-ceylon-green'
                  }`}
                  onClick={toggleMobileMenu}
                  data-testid="mobile-nav-dashboard"
                >
                  Dashboard
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
