import { Loader2, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState, useCallback } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export function LoadingSpinner({ size = 'md', className, children }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn("flex items-center justify-center space-x-2", className)} role="status" aria-live="polite">
      <Loader2 className={cn("animate-spin text-brand", sizeClasses[size])} aria-hidden="true" />
      {children && <span className="text-text-secondary">{children}</span>}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface PageLoadingProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

export function PageLoading({ message = "Loading page...", showProgress = false, progress = 0 }: PageLoadingProps) {
  return (
    <div className="min-h-screen bg-ui-bg flex items-center justify-center p-4" data-testid="page-loading">
      <div className="text-center space-y-4 max-w-md">
        <LoadingSpinner size="lg" />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-text-primary">{message}</h2>
          {showProgress && (
            <div className="w-full bg-ui-line rounded-full h-2">
              <div 
                className="bg-brand h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(progress, 100)}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Loading progress: ${progress}%`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface FullscreenLoadingProps {
  title?: string;
  subtitle?: string;
  onCancel?: () => void;
  cancelLabel?: string;
}

export function FullscreenLoading({ 
  title = "Loading...", 
  subtitle, 
  onCancel, 
  cancelLabel = "Cancel" 
}: FullscreenLoadingProps) {
  return (
    <div 
      className="fixed inset-0 bg-ui-bg/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-title"
      data-testid="fullscreen-loading"
    >
      <div className="bg-ui-surface rounded-lg p-8 shadow-lg max-w-md w-full text-center space-y-6">
        <LoadingSpinner size="lg" />
        
        <div className="space-y-2">
          <h3 id="loading-title" className="text-lg font-semibold text-text-primary">
            {title}
          </h3>
          {subtitle && (
            <p className="text-text-secondary text-sm">
              {subtitle}
            </p>
          )}
        </div>
        
        {onCancel && (
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="w-full"
            data-testid="loading-cancel-button"
          >
            {cancelLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

interface NetworkStatusProps {
  isOnline: boolean;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function NetworkStatus({ isOnline, onRetry, showRetry = true }: NetworkStatusProps) {
  if (isOnline) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 bg-destructive text-white p-3 z-50 shadow-lg"
      role="alert"
      aria-live="assertive"
      data-testid="network-status-offline"
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <WifiOff className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium">
            You're offline. Some features may not be available.
          </span>
        </div>
        
        {showRetry && onRetry && (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onRetry}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            data-testid="network-retry-button"
          >
            <Wifi className="h-4 w-4 mr-1" aria-hidden="true" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: React.ReactNode;
  actionButton?: React.ReactNode;
}

export function ErrorState({ 
  title = "Something went wrong", 
  message = "We encountered an error while loading this content.", 
  onRetry, 
  retryLabel = "Try again",
  icon,
  actionButton
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4" data-testid="error-state">
      <div className="text-destructive">
        {icon || <AlertCircle className="h-12 w-12" aria-hidden="true" />}
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-text-primary">
          {title}
        </h3>
        <p className="text-text-secondary max-w-md">
          {message}
        </p>
      </div>
      
      <div className="flex space-x-2">
        {onRetry && (
          <Button onClick={onRetry} data-testid="error-retry-button">
            {retryLabel}
          </Button>
        )}
        {actionButton}
      </div>
    </div>
  );
}

interface InlineLoadingProps {
  text?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function InlineLoading({ text = "Loading...", size = 'sm', className }: InlineLoadingProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)} role="status">
      <LoadingSpinner size={size} />
      <span className="text-text-secondary text-sm">{text}</span>
    </div>
  );
}

interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'lg' | 'icon' | 'default';
}

export function ButtonLoading({ 
  isLoading, 
  children, 
  loadingText,
  className,
  disabled,
  onClick,
  variant = 'default',
  size = 'default',
  ...props 
}: ButtonLoadingProps) {
  return (
    <Button
      disabled={isLoading || disabled}
      onClick={onClick}
      variant={variant}
      size={size}
      className={cn(className)}
      data-testid="button-loading"
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <LoadingSpinner size="sm" />
          <span>{loadingText || children}</span>
        </div>
      ) : (
        children
      )}
    </Button>
  );
}

// Hook for managing loading states
export function useLoadingState(initialLoading = false) {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  const withLoading = useCallback(async (asyncFunction: () => Promise<any>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await asyncFunction();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    setIsLoading,
    setError,
    withLoading,
    clearError
  };
}