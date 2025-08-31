import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import SafetyGuidelines from "@/pages/safety-guidelines";
import TermsOfService from "@/pages/terms-of-service";
import PrivacyPolicy from "@/pages/privacy-policy";
import ContactUs from "@/pages/contact-us";
import SignInRequired from "@/pages/signin-required";
import AuthSignInPage from "@/pages/auth-signin";
import AuthMagicPage from "@/pages/auth-magic";
import AuthCallbackPage from "@/pages/auth-callback";
import DestinationPage from "@/pages/destination";
import PreferencesPage from "@/pages/preferences";
import AdminDashboardPage from "@/pages/admin-dashboard";
import ReportTripPage from "@/pages/report-trip";
import { FloatingActionMenu } from "@/components/floating-action-menu";

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
            <Route path="/community" component={Community} />
            <Route path="/safety-guidelines" component={SafetyGuidelines} />
            <Route path="/terms-of-service" component={TermsOfService} />
            <Route path="/privacy-policy" component={PrivacyPolicy} />
            <Route path="/contact-us" component={ContactUs} />
            <Route path="/faq" component={FAQ} />
            <Route path="/auth/signin" component={AuthSignInPage} />
            <Route path="/auth/magic" component={AuthMagicPage} />
            <Route path="/auth/callback" component={AuthCallbackPage} />
            <Route path="/destination/:city" component={DestinationPage} />
            <Route path="/preferences" component={PreferencesPage} />
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
            <Route path="/community" component={Community} />
            <Route path="/safety-guidelines" component={SafetyGuidelines} />
            <Route path="/terms-of-service" component={TermsOfService} />
            <Route path="/privacy-policy" component={PrivacyPolicy} />
            <Route path="/contact-us" component={ContactUs} />
            <Route path="/faq" component={FAQ} />
            <Route path="/auth/signin" component={AuthSignInPage} />
            <Route path="/destination/:city" component={DestinationPage} />
            <Route path="/preferences" component={PreferencesPage} />
            <Route path="/admin" component={AdminDashboardPage} />
            <Route path="/report-trip/:id" component={ReportTripPage} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
      
      {/* Show floating action menu only for authenticated users */}
      {isAuthenticated && <FloatingActionMenu />}
    </>
  );
}

function App() {
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
