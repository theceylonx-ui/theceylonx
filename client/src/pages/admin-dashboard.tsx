import AdminDashboard from "@/components/AdminDashboard";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

// Admin user IDs (your specific user ID)
const ADMIN_USER_IDS = [
  "bcc1d79a-d83a-4a99-8556-e1d367140e88", // PraDas S Agnya (you)
  // Add more admin user IDs here as needed
];

export default function AdminDashboardPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && (!user || !ADMIN_USER_IDS.includes(user.id))) {
      // Redirect non-admin users to home
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ceylon-green mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not admin (redirect is handled in useEffect)
  if (!user || !ADMIN_USER_IDS.includes(user.id)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">ML Performance Analytics & KPI Metrics</p>
        </div>
        <AdminDashboard />
      </div>
      <Footer />
    </div>
  );
}