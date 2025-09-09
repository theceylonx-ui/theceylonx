import { Request, Response, NextFunction } from 'express';
import { isProduction } from '../config/environment';

// 🚀 PHASE 4: Production error tracking and monitoring
interface ErrorReport {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context: {
    url?: string;
    method?: string;
    userAgent?: string;
    userId?: string;
    ip?: string;
  };
  environment: string;
}

class ErrorTracker {
  private errorBuffer: ErrorReport[] = [];
  private readonly maxBufferSize = 1000;
  
  // Track error with context
  trackError(error: Error | string, context: Partial<ErrorReport['context']> = {}, level: ErrorReport['level'] = 'error') {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      level,
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      context,
      environment: process.env.NODE_ENV || 'development',
    };
    
    // Add to buffer
    this.errorBuffer.push(errorReport);
    
    // Maintain buffer size
    if (this.errorBuffer.length > this.maxBufferSize) {
      this.errorBuffer.shift();
    }
    
    // Log based on environment
    this.logError(errorReport);
    
    // In production, you could send to external service like Sentry
    if (isProduction()) {
      this.sendToExternalService(errorReport);
    }
  }
  
  // Log error to console with appropriate formatting
  private logError(report: ErrorReport) {
    const logData = {
      id: report.id,
      level: report.level,
      message: report.message,
      context: report.context,
      timestamp: report.timestamp,
    };
    
    switch (report.level) {
      case 'error':
        console.error('🚨 ERROR:', JSON.stringify(logData, null, 2));
        if (report.stack && !isProduction()) {
          console.error(report.stack);
        }
        break;
      case 'warn':
        console.warn('⚠️ WARNING:', JSON.stringify(logData, null, 2));
        break;
      case 'info':
        console.info('ℹ️ INFO:', JSON.stringify(logData, null, 2));
        break;
    }
  }
  
  // Send to external monitoring service (placeholder)
  private sendToExternalService(report: ErrorReport) {
    // In a real application, integrate with services like:
    // - Sentry
    // - Datadog
    // - New Relic
    // - Rollbar
    
    // Example: await sentry.captureException(report);
    console.log(`📊 Would send error ${report.id} to monitoring service`);
  }
  
  // Generate unique error ID
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Get recent errors for admin dashboard
  getRecentErrors(limit: number = 50): ErrorReport[] {
    return this.errorBuffer.slice(-limit).reverse();
  }
  
  // Get error statistics
  getErrorStats() {
    const recentHour = new Date(Date.now() - 60 * 60 * 1000);
    const recentErrors = this.errorBuffer.filter(
      error => new Date(error.timestamp) > recentHour
    );
    
    return {
      totalErrors: this.errorBuffer.length,
      recentHourErrors: recentErrors.length,
      errorsByLevel: {
        error: this.errorBuffer.filter(e => e.level === 'error').length,
        warn: this.errorBuffer.filter(e => e.level === 'warn').length,
        info: this.errorBuffer.filter(e => e.level === 'info').length,
      },
      topErrors: this.getTopErrorMessages(),
    };
  }
  
  // Get most frequent error messages
  private getTopErrorMessages(limit: number = 10) {
    const errorCounts = this.errorBuffer.reduce((acc, error) => {
      acc[error.message] = (acc[error.message] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([message, count]) => ({ message, count }));
  }
}

// Global error tracker instance
export const errorTracker = new ErrorTracker();

// Express middleware for automatic error tracking
export const errorTrackingMiddleware = (error: Error, req: Request, res: Response, next: NextFunction) => {
  // Track the error with request context
  errorTracker.trackError(error, {
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    ip: req.ip,
  });
  
  next(error);
};

// Manual error tracking function for use in try/catch blocks
export const trackError = (error: Error | string, context?: Partial<ErrorReport['context']>, level?: ErrorReport['level']) => {
  errorTracker.trackError(error, context, level);
};

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason: any, promise) => {
  errorTracker.trackError(
    new Error(`Unhandled Promise Rejection: ${reason}`),
    { url: 'system' },
    'error'
  );
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  errorTracker.trackError(error, { url: 'system' }, 'error');
  console.error('Uncaught Exception:', error);
  
  // In production, gracefully shut down
  if (isProduction()) {
    process.exit(1);
  }
});