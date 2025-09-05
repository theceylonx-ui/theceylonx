import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// import { ClerkProvider } from "@clerk/clerk-react";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import BrowseTrips from "@/pages/browse-trips";
import PostTrip from "@/pages/post-trip";
import TripDetails from "@/pages/trip-details";
import UserDashboard from "@/pages/user-dashboard";
import FAQ from "@/pages/faq";
import Community from "@/pages/community";
import CommunityNew from "@/pages/community-new";
import QuestionDetail from "@/pages/question-detail";
import SafetyGuidelines from "@/pages/safety-guidelines";
import TermsOfService from "@/pages/terms-of-service";
import PrivacyPolicy from "@/pages/privacy-policy";
import ContactUs from "@/pages/contact-us";
import SignInRequired from "@/pages/signin-required";
import AuthSignInPage from "@/pages/auth-signin";
import AuthMagicPage from "@/pages/auth-magic";
import AuthCallbackPage from "@/pages/auth-callback";
import DestinationPage from "@/pages/destination";
import AdminDashboardPage from "@/pages/admin-dashboard";
import AdminOverviewPage from "@/pages/admin/index";
import ReportTripPage from "@/pages/report-trip";
import ChatPage from "@/pages/chat";
import ChatDemoPage from "@/pages/chat-demo";
import UserDeletion from "@/pages/user-deletion";
import CalendarPage from "@/pages/calendar";
import TravelStyleSettings from "@/pages/travel-style-settings";
import ProfilePage from "@/pages/me";
import ChatBuddy from "@/pages/chat-buddy";
import AdminReportsPage from "@/pages/admin-reports";
import ClerkSmoke from "@/auth/ClerkSmoke";
import UserProfilePage from "@/pages/profile/[id]";
import HelpFAQPage from "@/pages/help/faq";
import AccountSettingsPage from "@/pages/settings/account";
import MeRedirect from "@/pages/me-redirect";
// Clerk components temporarily disabled
// import ClerkSignInPage from "@/pages/clerk-sign-in";
// import ClerkSignUpPage from "@/pages/clerk-sign-up";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

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

  return (
    <>
      <Switch>
        {!isAuthenticated ? (
          <>
            <Route path="/" component={Landing} />
            <Route path="/browse-trips" component={BrowseTrips} />
            <Route path="/trips/:id" component={TripDetails} />
            <Route path="/community" component={CommunityNew} />
            <Route path="/question/:id" component={QuestionDetail} />
            <Route path="/calendar" component={CalendarPage} />
            <Route path="/safety-guidelines" component={SafetyGuidelines} />
            <Route path="/terms-of-service" component={TermsOfService} />
            <Route path="/privacy-policy" component={PrivacyPolicy} />
            <Route path="/contact-us" component={ContactUs} />
            <Route path="/faq" component={HelpFAQPage} />
            <Route path="/help/faq" component={HelpFAQPage} />
            <Route path="/auth/signin" component={AuthSignInPage} />
            <Route path="/auth/magic" component={AuthMagicPage} />
            <Route path="/auth/callback" component={AuthCallbackPage} />
            <Route path="/auth-test" component={ClerkSmoke} />
            {/* Clerk routes temporarily disabled */}
            <Route path="/destination/:city" component={DestinationPage} />

            <Route path="/chat" component={ChatPage} />
            <Route path="/chat/:threadId" component={ChatPage} />
            <Route path="/chat-demo" component={ChatDemoPage} />
            <Route path="/user/delete" component={UserDeletion} />
            <Route path="/post" component={SignInRequired} />
            <Route path="/dashboard" component={SignInRequired} />
          </>
        ) : (
          <>
            <Route path="/" component={Home} />
            <Route path="/browse-trips" component={BrowseTrips} />
            <Route path="/post" component={PostTrip} />
            <Route path="/trips/:id" component={TripDetails} />
            <Route path="/dashboard" component={UserDashboard} />
            <Route path="/community" component={CommunityNew} />
            <Route path="/question/:id" component={QuestionDetail} />
            <Route path="/calendar" component={CalendarPage} />
            <Route path="/safety-guidelines" component={SafetyGuidelines} />
            <Route path="/terms-of-service" component={TermsOfService} />
            <Route path="/privacy-policy" component={PrivacyPolicy} />
            <Route path="/contact-us" component={ContactUs} />
            <Route path="/faq" component={HelpFAQPage} />
            <Route path="/help/faq" component={HelpFAQPage} />
            <Route path="/auth/signin" component={AuthSignInPage} />
            {/* Clerk routes temporarily disabled */}
            <Route path="/destination/:city" component={DestinationPage} />

            <Route path="/travel-style-settings" component={TravelStyleSettings} />
            
            {/* Profile Routes */}
            <Route path="/me" component={MeRedirect} />
            <Route path="/profile/:id" component={UserProfilePage} />
            
            {/* Chat Routes */}
            <Route path="/chat" component={ChatPage} />
            <Route path="/chat/threads" component={ChatPage} />
            <Route path="/chat/:threadId" component={ChatPage} />
            <Route path="/chat-demo" component={ChatDemoPage} />
            <Route path="/chat-buddy" component={ChatBuddy} />
            
            {/* Help & Settings */}
            <Route path="/help/faq" component={HelpFAQPage} />
            <Route path="/settings/account" component={AccountSettingsPage} />
            <Route path="/user/delete" component={UserDeletion} />
            {/* Enhanced Admin Routes */}
            <Route path="/admin" component={AdminOverviewPage} />
            <Route path="/admin/dashboard" component={AdminOverviewPage} />
            <Route path="/admin/roles" component={() => import("@/pages/admin/roles").then(m => m.default)} />
            <Route path="/admin/moderation" component={() => import("@/pages/admin/moderation").then(m => m.default)} />
            <Route path="/admin/ai-moderation" component={() => import("@/pages/admin/ai-moderation").then(m => m.default)} />
            <Route path="/admin/mobile-admin" component={() => import("@/pages/admin/mobile-admin").then(m => m.default)} />
            <Route path="/admin/audit-logs" component={() => import("@/pages/admin/audit-logs").then(m => m.default)} />
            <Route path="/admin/api-docs" component={() => import("@/pages/admin/api-docs").then(m => m.default)} />
            
            {/* Legacy Admin Routes */}
            <Route path="/admin-dashboard" component={AdminDashboardPage} />
            <Route path="/admin/reports" component={AdminReportsPage} />
            <Route path="/report-trip/:id" component={ReportTripPage} />
          </>
        )}
        
        {/* Auth callback route - available for both authenticated and unauthenticated users */}
        <Route path="/auth/callback" component={AuthCallbackPage} />
        
        <Route component={NotFound} />
      </Switch>
      
      {/* Show floating action menu only for authenticated users */}
    </>
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
