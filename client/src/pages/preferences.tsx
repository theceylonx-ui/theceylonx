import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { UserPreferences } from "@/components/UserPreferences";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Settings, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

export default function PreferencesPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Travel Preferences</h1>
          <p className="text-gray-600">
            Customize your preferences to get personalized trip recommendations tailored just for you.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Preferences */}
          <div className="lg:col-span-2">
            <UserPreferences />
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">1</div>
                  <p>Set your travel preferences and interests</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">2</div>
                  <p>Our AI analyzes your preferences and behavior</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">3</div>
                  <p>Get personalized trip recommendations on your home page</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">4</div>
                  <p>Recommendations improve as you interact with trips</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5" />
                  Privacy & Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p>
                  Your preferences and interaction data are used solely to improve your experience with personalized recommendations.
                </p>
                <p>
                  We track which trips you view, bookmark, and join to better understand your travel interests and suggest relevant trips.
                </p>
                <p>
                  All data is stored securely and is never shared with third parties.
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-red-700">
                  <Trash2 className="h-5 w-5" />
                  Account Deletion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p>
                  Need to delete your account? You can permanently remove all your data from Ceylon Expand.
                </p>
                <p className="text-red-600 font-medium">
                  Warning: This action cannot be undone and all your data will be permanently deleted.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setLocation("/user/delete")}
                  className="mt-3"
                  data-testid="button-delete-account-link"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}