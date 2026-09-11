import { Component, ReactNode, ErrorInfo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home, MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showReportButton?: boolean;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  private reloadAfterModuleLoadFailure = (error: Error): boolean => {
    const isModuleLoadFailure = /importing a module script failed|failed to fetch dynamically imported module|loading chunk \d+ failed/i.test(error.message);

    if (!isModuleLoadFailure) {
      return false;
    }

    // A freshly published Vite build changes hashed chunk names. Reload once
    // per entry bundle to recover clients that attempt to load a retired chunk.
    const entryBundle = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/"]')?.src || window.location.pathname;
    const reloadKey = `hibowan-module-reload:${entryBundle}`;

    if (sessionStorage.getItem(reloadKey)) {
      return false;
    }

    sessionStorage.setItem(reloadKey, '1');
    window.location.reload();
    return true;
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId;
    
    // Enhanced error logging with context
    console.error("🚨 React Error Boundary caught an error:", {
      errorId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    this.setState({ errorInfo });

    if (this.reloadAfterModuleLoadFailure(error)) {
      return;
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to tracking service (if available)
    this.reportError(error, errorInfo, errorId);
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys) {
        const hasResetKeyChanged = resetKeys.some(
          (key, idx) => prevProps.resetKeys?.[idx] !== key
        );
        if (hasResetKeyChanged) {
          this.resetErrorBoundary();
        }
      }
    }

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });

    toast({
      title: "Refreshed Successfully",
      description: "The component has been reset and should work normally now.",
      duration: 3000,
    });
  };

  reportError = async (error: Error, errorInfo: ErrorInfo, errorId: string | null) => {
    try {
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (reportError) {
      console.warn('Failed to report error to server:', reportError);
    }
  };

  handleRetry = () => {
    this.resetErrorBoundary();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportIssue = () => {
    const { error, errorId } = this.state;
    const subject = encodeURIComponent(`Bug Report: ${error?.message || 'Unknown Error'}`);
    const body = encodeURIComponent(
      `Error ID: ${errorId}\n` +
      `Error: ${error?.message || 'Unknown error'}\n` +
      `URL: ${window.location.href}\n` +
      `Time: ${new Date().toISOString()}\n\n` +
      `Please describe what you were doing when this error occurred:\n`
    );
    window.open(`mailto:support@hibowan.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorId } = this.state;
      const isNetworkError = error?.message?.includes('fetch') || error?.message?.includes('network');
      const isDevelopment = import.meta.env.DEV;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4" data-testid="error-boundary-fallback">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
                <div>
                  <CardTitle className="text-xl mb-1">
                    {isNetworkError ? 'Connection Problem' : 'Something went wrong'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {isNetworkError 
                      ? 'Unable to connect to our servers. Please check your internet connection.'
                      : 'An unexpected error occurred. Our team has been notified.'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorId && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono">
                  Error ID: {errorId}
                </div>
              )}
              
              {isDevelopment && error && (
                <details className="text-xs bg-red-50 dark:bg-red-950 p-3 rounded border">
                  <summary className="cursor-pointer font-medium text-red-700 dark:text-red-300 mb-2">
                    Development Error Details
                  </summary>
                  <div className="space-y-2 text-red-600 dark:text-red-400">
                    <div><strong>Message:</strong> {error.message}</div>
                    {error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap text-xs mt-1 bg-red-100 dark:bg-red-900 p-2 rounded">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={this.handleRetry} 
                  className="flex-1" 
                  variant="default"
                  data-testid="button-retry"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={this.handleGoHome} 
                  variant="outline" 
                  className="flex-1"
                  data-testid="button-home"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {this.props.showReportButton && (
                <Button 
                  onClick={this.handleReportIssue}
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  data-testid="button-report"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Report Issue
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;