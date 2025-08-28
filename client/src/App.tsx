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
