// Error tracking and monitoring system for production reliability
export interface ErrorLog {
  [key: string]: unknown;
  id: string;
  timestamp: Date;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  userId?: string;
  route?: string;
  userAgent?: string;
  ip?: string;
  meta?: Record<string, unknown>;
}

class ErrorTracker {
  private errors: ErrorLog[] = [];
  private maxErrors = 1000; // Keep last 1000 errors in memory

  log(level: ErrorLog['level'], message: string, meta?: Partial<ErrorLog>): void {
    const error: ErrorLog = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      ...meta
    };

    this.errors.unshift(error);
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console with appropriate level
    const logMessage = `[${level.toUpperCase()}] ${message}`;
    if (level === 'error') {
      console.error(logMessage, meta);
    } else if (level === 'warn') {
      console.warn(logMessage, meta);
    } else {
      console.log(logMessage, meta);
    }
  }

  getRecentErrors(limit = 50): ErrorLog[] {
    return this.errors.slice(0, limit);
  }

  getErrorsByLevel(level: ErrorLog['level'], limit = 50): ErrorLog[] {
    return this.errors
      .filter(error => error.level === level)
      .slice(0, limit);
  }

  // Middleware for Express to track route errors
  createMiddleware() {
    return (req: any, res: any, next: any) => {
      const originalSend = res.send;
      const originalJson = res.json;

      // Track response errors
      res.send = function(data: any) {
        if (res.statusCode >= 400) {
          errorTracker.log('error', `HTTP ${res.statusCode}: ${req.method} ${req.originalUrl}`, {
            route: req.originalUrl,
            userId: req.user?.id,
            userAgent: req.get('User-Agent'),
            ip: req.ip
          });
        }
        return originalSend.call(this, data);
      };

      res.json = function(data: any) {
        if (res.statusCode >= 400) {
          errorTracker.log('error', `HTTP ${res.statusCode}: ${req.method} ${req.originalUrl}`, {
            route: req.originalUrl,
            userId: req.user?.id,
            userAgent: req.get('User-Agent'),
            ip: req.ip
          });
        }
        return originalJson.call(this, data);
      };

      next();
    };
  }
}

export const errorTracker = new ErrorTracker();