import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { AuthSignIn } from "@/components/AuthSignIn";
import { needsOnboarding } from "@/utils/onboarding";
import newLogo from "@assets/hibowan-pin-hi-mark.svg";

export default function AuthSignInPage() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();

  const redirectAfterAuth = (currentUser: any) => {
    const returnPath = localStorage.getItem('returnPath');
    if (returnPath) {
      localStorage.removeItem('returnPath');
      navigate(returnPath);
    } else {
      navigate(needsOnboarding(currentUser) ? "/onboarding" : "/");
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      redirectAfterAuth(user);
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
            src={newLogo} 
            alt="HiBowan"
            className="h-16 w-auto mx-auto mb-4"
            width="64"
            height="64"
            loading="eager"
          />
          <h1 className="text-3xl font-bold text-gray-900">HiBowan</h1>
          <p className="text-gray-600">Your travel companion in Sri Lanka</p>
        </div>

        {/* Multi-provider Sign In Component. Navigation on success is handled by the
            useEffect above once the refetched user is available (needed to decide
            whether to route through onboarding) -- not here, since the user object
            isn't refreshed yet at the instant this fires. */}
        <AuthSignIn />

        <div className="mt-6 rounded-lg bg-accent-subtle p-4 text-sm text-text-secondary" data-testid="signup-safety-notice">
          <p>
            HiBowan connects you with fellow travellers — we don't verify anyone's identity, and we're not responsible for the actions, conduct, or safety of other users. You participate in trips at your own risk, so use the same judgement you would meeting anyone new while travelling.
          </p>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          <p>
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
      </div>
    </div>
  );
}