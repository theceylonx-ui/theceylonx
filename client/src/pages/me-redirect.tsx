import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

// This component handles the /me route and redirects to /profile/:id
export default function MeRedirect() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      // Preserve URL parameters (like tab=preferences) when redirecting
      const currentSearch = window.location.search;
      const redirectUrl = `/profile/${user.id}${currentSearch}`;
      setLocation(redirectUrl, { replace: true });
    } else if (!isLoading && !user) {
      // Redirect to sign-in if not authenticated
      setLocation('/auth/signin', { replace: true });
    }
  }, [user, isLoading, setLocation]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-2 border-ceylon-green border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your profile...</p>
      </div>
    </div>
  );
}