import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw, Globe, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

interface NetworkErrorProps {
  onRetry?: () => void;
  message?: string;
  showOfflineIndicator?: boolean;
}

export function NetworkError({ 
  onRetry, 
  message,
  showOfflineIndicator = true 
}: NetworkErrorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryAttempts(prev => prev + 1);
    
    try {
      if (onRetry) {
        await onRetry();
      } else {
        // Default retry behavior - reload the page
        window.location.reload();
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const getErrorIcon = () => {
    if (!isOnline) return WifiOff;
    if (retryAttempts > 2) return AlertTriangle;
    return Globe;
  };

  const getErrorMessage = () => {
    if (message) return message;
    if (!isOnline) return "You're currently offline. Please check your internet connection.";
    if (retryAttempts > 2) return "Multiple connection attempts failed. There might be a server issue.";
    return "Unable to connect to Ceylon Expand servers. This might be a temporary network issue.";
  };

  const getErrorTitle = () => {
    if (!isOnline) return "No Internet Connection";
    if (retryAttempts > 2) return "Connection Issues Persist";
    return "Network Error";
  };

  const ErrorIcon = getErrorIcon();

  return (
    <div className="min-h-[300px] flex items-center justify-center p-4" data-testid="network-error">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <ErrorIcon className={`h-8 w-8 flex-shrink-0 ${
              !isOnline ? 'text-orange-500' : 
              retryAttempts > 2 ? 'text-red-500' : 'text-blue-500'
            }`} />
            <div>
              <CardTitle className="text-lg mb-1">
                {getErrorTitle()}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {getErrorMessage()}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showOfflineIndicator && !isOnline && (
            <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 text-sm">
                <WifiOff className="h-4 w-4" />
                <span>Offline Mode - Limited functionality available</span>
              </div>
            </div>
          )}

          {retryAttempts > 0 && (
            <div className="text-xs text-muted-foreground text-center">
              Retry attempts: {retryAttempts}
            </div>
          )}

          <div className="space-y-2">
            <Button 
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full"
              data-testid="button-retry-network"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </Button>

            {!isOnline && (
              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p>While offline, you can:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>View previously loaded content</li>
                  <li>Browse cached trips</li>
                  <li>Use basic features</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}