import AdminDashboard from "@/components/AdminDashboard";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminDashboard />
      </div>
      <Footer />
    </div>
  );
}