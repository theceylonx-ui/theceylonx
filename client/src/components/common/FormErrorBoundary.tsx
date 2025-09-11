import { Component, ReactNode, ErrorInfo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  children: ReactNode;
  onError?: (error: Error) => void;
  fallbackMessage?: string;
  showRetry?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isRetrying: boolean;
}

class FormErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      isRetrying: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🚨 Form Error Boundary caught an error:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error);
    }

    // Show user-friendly toast notification
    toast({
      title: "Form Error",
      description: "There was an issue with the form. Please try refreshing it.",
      variant: "destructive",
      duration: 5000,
    });
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      isRetrying: false 
    });
    
    toast({
      title: "Form Reset",
      description: "The form has been reset. You can try again now.",
      duration: 3000,
    });
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      const { fallbackMessage, showRetry = true } = this.props;
      
      const isValidationError = error?.message?.includes('validation') || 
                              error?.message?.includes('required') ||
                              error?.message?.includes('invalid');

      const errorMessage = fallbackMessage || 
        (isValidationError 
          ? "Please check your form inputs and try again."
          : "An error occurred while processing the form."
        );

      return (
        <div className="space-y-4" data-testid="form-error-boundary">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{errorMessage}</span>
              {showRetry && (
                <Button
                  onClick={this.handleRetry}
                  size="sm"
                  variant="outline"
                  className="ml-4 bg-white hover:bg-gray-50"
                  data-testid="button-retry-form"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
            </AlertDescription>
          </Alert>
          
          {import.meta.env.DEV && error && (
            <details className="text-xs bg-red-50 dark:bg-red-950 p-3 rounded border border-red-200 dark:border-red-800">
              <summary className="cursor-pointer font-medium text-red-700 dark:text-red-300 mb-2">
                Development Error Details
              </summary>
              <div className="space-y-2 text-red-600 dark:text-red-400">
                <div><strong>Message:</strong> {error.message}</div>
                <div><strong>Stack:</strong></div>
                <pre className="whitespace-pre-wrap text-xs bg-red-100 dark:bg-red-900 p-2 rounded">
                  {error.stack}
                </pre>
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default FormErrorBoundary;