import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { Link } from "wouter";
import logoImage from "@assets/5_1756417819316.png";

export default function AuthSignInPage() {
  const handleSignIn = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ceylon-green/10 to-ceylon-orange/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoImage} alt="Ceylon Expand Logo" className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800" data-testid="signin-title">
            Welcome to Ceylon Expand
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-center" data-testid="signin-message">
            Sign in to join the Sri Lankan travel community. Connect with fellow travelers, ask questions, and share your journey experiences.
          </p>

          <div className="space-y-3">
            <Button
              onClick={handleSignIn}
              className="w-full bg-ceylon-green hover:bg-ceylon-green/90 text-white"
              data-testid="button-signin"
            >
              <Mail className="w-4 h-4 mr-2" />
              Sign In with Google or Email
            </Button>

            <p className="text-xs text-gray-500 text-center">
              By signing in, you agree to our{" "}
              <Link href="/terms-of-service" className="text-ceylon-green hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="text-ceylon-green hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>

          <div className="text-center pt-4">
            <Link href="/" className="text-ceylon-green hover:underline text-sm">
              ← Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}