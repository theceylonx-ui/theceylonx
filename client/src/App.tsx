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

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/browse" component={BrowseTrips} />
          <Route path="/trips/:id" component={TripDetails} />
          <Route path="/community" component={Community} />
          <Route path="/safety-guidelines" component={SafetyGuidelines} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/contact-us" component={ContactUs} />
          <Route path="/faq" component={FAQ} />
          <Route path="/post" component={SignInRequired} />
          <Route path="/dashboard" component={SignInRequired} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/browse" component={BrowseTrips} />
          <Route path="/post" component={PostTrip} />
          <Route path="/trips/:id" component={TripDetails} />
          <Route path="/dashboard" component={UserDashboard} />
          <Route path="/community" component={Community} />
          <Route path="/safety-guidelines" component={SafetyGuidelines} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/contact-us" component={ContactUs} />
          <Route path="/faq" component={FAQ} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
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
