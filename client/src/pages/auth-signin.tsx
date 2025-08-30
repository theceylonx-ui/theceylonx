import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { AuthSignIn } from "@/components/AuthSignIn";
import logoImage from "@assets/5_1756417819316.png";

export default function AuthSignInPage() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ceylon-green/10 to-ceylon-orange/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-bounce-gentle">
            <div className="h-12 w-12 border-2 border-ceylon-green/30 rounded-full animate-spin-slow border-dashed mx-auto mb-4"></div>
          </div>
          <p className="text-gray-600 animate-fade-in">Preparing sign-in options...</p>
          <div className="flex justify-center space-x-1 mt-3">
            <div className="w-2 h-2 bg-ceylon-blue rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-ceylon-green rounded-full animate-pulse delay-200"></div>
            <div className="w-2 h-2 bg-ceylon-orange rounded-full animate-pulse delay-400"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ceylon-green/10 to-ceylon-orange/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src={logoImage} 
            alt="Ceylon Expand" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900">Ceylon Expand</h1>
          <p className="text-gray-600">Your travel companion in Sri Lanka</p>
        </div>

        {/* Multi-provider Sign In Component */}
        <AuthSignIn onSuccess={() => navigate("/")} />

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            By signing in, you agree to our{" "}
            <a href="/terms-of-service" className="text-ceylon-green hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy-policy" className="text-ceylon-green hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}