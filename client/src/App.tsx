import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy, startTransition } from "react";
import { useAuth } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import RouteErrorBoundary from "@/components/common/RouteErrorBoundary";
import { NetworkError } from "@/components/common/NetworkError";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
// 🚀 PERFORMANCE: Import performance monitoring for development
import { PerformanceMonitor } from "@/components/PerformanceMonitor";

// 🚀 PHASE 3 PERFORMANCE: Lazy load all components for better initial load time
const NotFound = lazy(() => import("@/pages/not-found"));
const Landing = lazy(() => import("@/pages/landing"));
const Home = lazy(() => import("@/pages/home"));
const BrowseTrips = lazy(() => import("@/pages/browse-trips"));
const PostTrip = lazy(() => import("@/pages/post-trip"));
const TripDetails = lazy(() => import("@/pages/trip-details"));
const CommunityNew = lazy(() => import("@/pages/community-new"));
const QuestionDetail = lazy(() => import("@/pages/question-detail"));
const SafetyGuidelines = lazy(() => import("@/pages/safety-guidelines"));
const TermsOfService = lazy(() => import("@/pages/terms-of-service"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const ContactUs = lazy(() => import("@/pages/contact-us"));
const SignInRequired = lazy(() => import("@/pages/signin-required"));
const AuthSignInPage = lazy(() => import("@/pages/auth-signin"));
const AuthMagicPage = lazy(() => import("@/pages/auth-magic"));
const AuthCallbackPage = lazy(() => import("@/pages/auth-callback"));
const DestinationPage = lazy(() => import("@/pages/destination"));
const ChatDemoPage = lazy(() => import("@/pages/chat-demo"));
const UserDeletion = lazy(() => import("@/pages/user-deletion"));
const CalendarPage = lazy(() => import("@/pages/calendar"));
const TravelStyleSettings = lazy(() => import("@/pages/travel-style-settings"));
const ProfilePage = lazy(() => import("@/pages/me"));
const ChatBuddy = lazy(() => import("@/pages/chat-buddy"));
const ClerkSmoke = lazy(() => import("@/auth/ClerkSmoke"));
const UserProfilePage = lazy(() => import("@/pages/profile/[id]"));
const UserTripsPage = lazy(() => import("@/pages/users/[id]/trips"));
const HelpFAQPage = lazy(() => import("@/pages/help/faq"));
const AccountSettingsPage = lazy(() => import("@/pages/settings/account"));
const MeRedirect = lazy(() => import("@/pages/me-redirect"));
const TripRequestsPage = lazy(() => import("@/pages/trip-requests"));

// Performance loading component with error boundary
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-ceylon-green/10 to-ceylon-orange/10 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ceylon-green mx-auto"></div>
      <p className="mt-2 text-gray-600">Loading page...</p>
    </div>
  </div>
);

// Enhanced loading component with network error handling
const EnhancedPageLoader = () => {
  const networkStatus = useNetworkStatus();
  
  if (!networkStatus.isOnline) {
    return <NetworkError />;
  }
  
  return <PageLoader />;
};
// Clerk components temporarily disabled
// import ClerkSignInPage from "@/pages/clerk-sign-in";
// import ClerkSignUpPage from "@/pages/clerk-sign-up";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Show loading while authentication state is being determined
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

  // Wrap routing in startTransition for better Suspense handling with error boundaries
  const handleRoute = (Component: any, routeName?: string) => {
    return (props: any) => {
      return (
        <RouteErrorBoundary routeName={routeName}>
          <Suspense fallback={<EnhancedPageLoader />}>
            <Component {...props} />
          </Suspense>
        </RouteErrorBoundary>
      );
    };
  };

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={handleRoute(Landing)} />
          <Route path="/browse-trips" component={handleRoute(BrowseTrips)} />
          <Route path="/trips" component={handleRoute(BrowseTrips)} />
          <Route path="/trips/new" component={() => { startTransition(() => setLocation("/post")); return null; }} />
          <Route path="/trips/:id" component={handleRoute(TripDetails)} />
          <Route path="/community" component={handleRoute(CommunityNew)} />
          <Route path="/question/:id" component={handleRoute(QuestionDetail)} />
          <Route path="/calendar" component={handleRoute(CalendarPage)} />
          <Route path="/safety-guidelines" component={handleRoute(SafetyGuidelines)} />
          <Route path="/terms-of-service" component={handleRoute(TermsOfService)} />
          <Route path="/privacy-policy" component={handleRoute(PrivacyPolicy)} />
          <Route path="/contact-us" component={handleRoute(ContactUs)} />
          <Route path="/faq" component={handleRoute(HelpFAQPage)} />
          <Route path="/help/faq" component={handleRoute(HelpFAQPage)} />
          <Route path="/auth/signin" component={handleRoute(AuthSignInPage)} />
          <Route path="/auth/magic" component={handleRoute(AuthMagicPage)} />
          <Route path="/auth/callback" component={handleRoute(AuthCallbackPage)} />
          <Route path="/auth-test" component={handleRoute(ClerkSmoke)} />
          <Route path="/destination/:city" component={handleRoute(DestinationPage)} />
          <Route path="/chat-demo" component={handleRoute(ChatDemoPage)} />
          <Route path="/user/delete" component={handleRoute(UserDeletion)} />
          <Route path="/post" component={handleRoute(SignInRequired)} />
          <Route path="/dashboard" component={handleRoute(SignInRequired)} />
          
          {/* Protected routes - redirect to sign in */}
          <Route path="/me" component={handleRoute(SignInRequired)} />
          <Route path="/profile/:id" component={handleRoute(SignInRequired)} />
          <Route path="/users/:id/trips" component={handleRoute(SignInRequired)} />
          <Route path="/trips/:id/requests" component={handleRoute(SignInRequired)} />
          <Route path="/chat-buddy" component={handleRoute(SignInRequired)} />
          <Route path="/chat-buddy/:threadId" component={handleRoute(SignInRequired)} />
          <Route path="/settings/account" component={handleRoute(SignInRequired)} />
          <Route path="/travel-style-settings" component={handleRoute(SignInRequired)} />
        </>
      ) : (
        <>
          <Route path="/" component={handleRoute(Home)} />
          <Route path="/browse-trips" component={handleRoute(BrowseTrips)} />
          <Route path="/post" component={handleRoute(PostTrip)} />
          <Route path="/trips" component={handleRoute(BrowseTrips)} />
          <Route path="/trips/new" component={() => { startTransition(() => setLocation("/post")); return null; }} />
          <Route path="/post-trip" component={handleRoute(PostTrip)} />
          <Route path="/trips/:id" component={handleRoute(TripDetails)} />
          <Route path="/trips/:id/requests" component={handleRoute(TripRequestsPage)} />
          <Route path="/dashboard" component={() => { startTransition(() => setLocation("/me")); return null; }} />
          <Route path="/community" component={handleRoute(CommunityNew)} />
          <Route path="/question/:id" component={handleRoute(QuestionDetail)} />
          <Route path="/calendar" component={handleRoute(CalendarPage)} />
          <Route path="/safety-guidelines" component={handleRoute(SafetyGuidelines)} />
          <Route path="/terms-of-service" component={handleRoute(TermsOfService)} />
          <Route path="/privacy-policy" component={handleRoute(PrivacyPolicy)} />
          <Route path="/contact-us" component={handleRoute(ContactUs)} />
          <Route path="/faq" component={handleRoute(HelpFAQPage)} />
          <Route path="/help/faq" component={handleRoute(HelpFAQPage)} />
          <Route path="/auth/signin" component={handleRoute(AuthSignInPage)} />
          <Route path="/destination/:city" component={handleRoute(DestinationPage)} />
          <Route path="/travel-style-settings" component={handleRoute(TravelStyleSettings)} />
          
          {/* Profile Routes */}
          <Route path="/me" component={handleRoute(MeRedirect)} />
          <Route path="/profile/:id" component={handleRoute(UserProfilePage)} />
          <Route path="/users/:id/trips" component={handleRoute(UserTripsPage)} />
          
          {/* Chat Routes */}
          <Route path="/chat-demo" component={handleRoute(ChatDemoPage)} />
          <Route path="/chat-buddy" component={handleRoute(ChatBuddy)} />
          <Route path="/chat-buddy/:threadId" component={handleRoute(ChatBuddy)} />
          
          {/* Help & Settings */}
          <Route path="/help/faq" component={handleRoute(HelpFAQPage)} />
          <Route path="/settings/account" component={handleRoute(AccountSettingsPage)} />
          <Route path="/user/delete" component={handleRoute(UserDeletion)} />
        </>
      )}
      
      {/* Auth callback route - available for both authenticated and unauthenticated users */}
      <Route path="/auth/callback" component={handleRoute(AuthCallbackPage)} />
      
      <Route component={handleRoute(NotFound)} />
    </Switch>
  );
}

function App() {
  // Temporarily disable Clerk until properly configured
  // const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  // const isClerkEnabled = clerkPubKey && 
  //   clerkPubKey !== 'pk_test_placeholder' && 
  //   clerkPubKey.startsWith('pk_') &&
  //   clerkPubKey.length > 50;

  return (
    <ErrorBoundary
      showReportButton={true}
      onError={(error, errorInfo) => {
        console.error("🚨 App-level error:", {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
          {/* 🚀 PERFORMANCE: Add performance monitor for development */}
          <PerformanceMonitor />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
