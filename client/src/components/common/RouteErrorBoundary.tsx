import ErrorBoundary from "./ErrorBoundary";
import { useLocation } from "wouter";
import { ReactNode, useEffect, useState } from "react";

interface RouteErrorBoundaryProps {
  children: ReactNode;
  routeName?: string;
}

export function RouteErrorBoundary({ children, routeName }: RouteErrorBoundaryProps) {
  const [location] = useLocation();
  const [locationKey, setLocationKey] = useState(location);

  // Reset error boundary when route changes
  useEffect(() => {
    setLocationKey(location);
  }, [location]);

  return (
    <ErrorBoundary
      key={locationKey} // Reset boundary when route changes
      resetKeys={[location]}
      resetOnPropsChange={true}
      showReportButton={true}
      onError={(error, errorInfo) => {
        console.error(`🚨 Route Error in ${routeName || location}:`, {
          route: location,
          routeName,
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export default RouteErrorBoundary;