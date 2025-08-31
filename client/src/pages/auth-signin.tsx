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
      // Check if there's a return path in localStorage
      const returnPath = localStorage.getItem('returnPath');
      if (returnPath) {
        localStorage.removeItem('returnPath');
        navigate(returnPath);
      } else {
        navigate("/");
      }
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ceylon-green/10 to-ceylon-orange/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ceylon-green mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
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
        <AuthSignIn onSuccess={() => {
          // Check if there's a return path in localStorage
          const returnPath = localStorage.getItem('returnPath');
          if (returnPath) {
            localStorage.removeItem('returnPath');
            navigate(returnPath);
          } else {
            navigate("/");
          }
        }} />

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