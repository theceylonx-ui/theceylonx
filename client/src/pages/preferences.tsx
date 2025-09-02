import { useEffect } from "react";
import { useLocation } from "wouter";

export default function PreferencesPage() {
  const [, setLocation] = useLocation();

  // Redirect to the new Travel Style Settings page
  useEffect(() => {
    setLocation("/travel-style-settings");
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting to Travel Style Settings...</p>
      </div>
    </div>
  );
}