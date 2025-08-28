import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, ArrowRight } from "lucide-react";

export default function SignInRequired() {
  const handleSignIn = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-ceylon-green/10 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="h-8 w-8 text-ceylon-green" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800" data-testid="signin-title">
              Sign In Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600" data-testid="signin-message">
              You need to sign in to post your trip and connect with fellow travelers across Sri Lanka.
            </p>
            
            <div className="space-y-3 text-sm text-gray-500">
              <p>With a free account, you can:</p>
              <ul className="space-y-2 text-left">
                <li className="flex items-center space-x-2">
                  <ArrowRight className="h-4 w-4 text-ceylon-green" />
                  <span>Post trips and find travel companions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <ArrowRight className="h-4 w-4 text-ceylon-green" />
                  <span>Join other travelers' adventures</span>
                </li>
                <li className="flex items-center space-x-2">
                  <ArrowRight className="h-4 w-4 text-ceylon-green" />
                  <span>Comment and connect with organizers</span>
                </li>
                <li className="flex items-center space-x-2">
                  <ArrowRight className="h-4 w-4 text-ceylon-green" />
                  <span>Manage your trips and profile</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={handleSignIn}
              className="w-full bg-ceylon-green hover:bg-ceylon-green/90 text-white"
              data-testid="button-signin"
            >
              Sign In to Continue
            </Button>
            
            <p className="text-xs text-gray-400">
              It's completely free - no hidden fees or charges!
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}