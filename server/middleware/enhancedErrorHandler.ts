import type { Request, Response, NextFunction } from 'express';
import { errorTracker } from '../utils/errorTracking';
import { handleDatabaseError } from '../utils/databaseErrorHandler';

// Enhanced error handler middleware for comprehensive error handling
export function enhancedErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Log error details for debugging
  errorTracker.log('error', `Request failed: ${req.method} ${req.originalUrl}`, {
    route: req.originalUrl,
    userId: (req as any).user?.id,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    stack: err.stack,
  });

  // Handle different types of errors
  let statusCode = 500;
  let message = 'Internal Server Error';
  let userMessage = 'Something went wrong. Please try again.';

  if (err.statusCode || err.status) {
    statusCode = err.statusCode || err.status;
    
    // Use the error message if it's user-friendly
    if (statusCode < 500) {
      userMessage = err.message || userMessage;
    }
  } else if (err.code) {
    // Database errors
    if (err.code.startsWith('23') || err.code.startsWith('42')) {
      try {
        handleDatabaseError(err, `${req.method} ${req.originalUrl}`);
      } catch (dbError: any) {
        statusCode = dbError.statusCode || 500;
        userMessage = dbError.message || userMessage;
      }
    }
    // Connection errors
    else if (['ECONNREFUSED', 'ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT'].includes(err.code)) {
      statusCode = 503;
      userMessage = 'Service temporarily unavailable. Please try again later.';
    }
  } else if (err.name) {
    // Handle specific error types
    switch (err.name) {
      case 'ValidationError':
        statusCode = 400;
        userMessage = 'Invalid input data provided.';
        break;
      case 'CastError':
        statusCode = 400;
        userMessage = 'Invalid ID format provided.';
        break;
      case 'JsonWebTokenError':
        statusCode = 401;
        userMessage = 'Invalid authentication token.';
        break;
      case 'TokenExpiredError':
        statusCode = 401;
        userMessage = 'Authentication token has expired.';
        break;
      case 'MulterError':
        statusCode = 400;
        userMessage = err.code === 'LIMIT_FILE_SIZE' 
          ? 'File too large. Please upload a smaller file.'
          : 'File upload error. Please try again.';
        break;
    }
  }

  // Special handling for development vs production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse: any = {
    message: userMessage,
    status: statusCode,
  };

  // Include additional error details in development
  if (isDevelopment) {
    errorResponse.details = {
      originalMessage: err.message,
      stack: err.stack,
      code: err.code,
      name: err.name,
    };
  }

  // Add error ID for tracking
  if (err.errorId) {
    errorResponse.errorId = err.errorId;
  }

  res.status(statusCode).json(errorResponse);
}

// Async error wrapper for route handlers
export function asyncErrorHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// Global unhandled error handlers
export function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    
    errorTracker.log('error', 'Unhandled Promise Rejection', {
      route: 'global',
      message: `Unhandled Promise Rejection: ${reason?.message || String(reason)}`,
      stack: reason?.stack,
    });
    
    // Don't exit process in production, just log
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    
    errorTracker.log('error', 'Uncaught Exception', {
      route: 'global',
      message: `Uncaught Exception: ${error.message}`,
      stack: error.stack,
    });
    
    // Exit process for uncaught exceptions
    process.exit(1);
  });

  // Graceful shutdown handlers
  const gracefulShutdown = (signal: string) => {
    console.log(`🛑 ${signal} received. Starting graceful shutdown...`);
    
    errorTracker.log('info', `Graceful shutdown initiated`, {
      route: 'global',
      message: `Graceful shutdown initiated: ${signal}`,
    });
    
    // Give time for ongoing requests to complete
    setTimeout(() => {
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    }, 5000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}