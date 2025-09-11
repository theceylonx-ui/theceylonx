import { errorTracker } from "./errorTracking";

// Database error types for better error handling
export interface DatabaseError extends Error {
  code?: string;
  constraint?: string;
  detail?: string;
  table?: string;
  column?: string;
  routine?: string;
}

// Enhanced database error handling with user-friendly messages
export function handleDatabaseError(error: any, operation: string, context: any = {}): never {
  const dbError = error as DatabaseError;
  const errorContext = {
    operation,
    code: dbError.code,
    constraint: dbError.constraint,
    detail: dbError.detail,
    table: dbError.table,
    column: dbError.column,
    ...context,
  };

  // Log the detailed error for debugging
  errorTracker.log('error', `Database operation failed: ${operation}`, {
    ...errorContext,
    stack: dbError.stack,
    timestamp: new Date().toISOString(),
  });

  // Generate user-friendly error messages based on error codes
  let userMessage: string;
  let statusCode: number = 500;

  if (dbError.code) {
    switch (dbError.code) {
      // Unique constraint violation
      case '23505':
        if (dbError.constraint?.includes('email')) {
          userMessage = 'An account with this email already exists.';
          statusCode = 409;
        } else if (dbError.constraint?.includes('username')) {
          userMessage = 'This username is already taken.';
          statusCode = 409;
        } else if (dbError.constraint?.includes('phone')) {
          userMessage = 'An account with this phone number already exists.';
          statusCode = 409;
        } else {
          userMessage = 'This data already exists in the system.';
          statusCode = 409;
        }
        break;

      // Foreign key violation
      case '23503':
        userMessage = 'Referenced data does not exist or has been deleted.';
        statusCode = 400;
        break;

      // Not null violation
      case '23502':
        const field = dbError.column || 'required field';
        userMessage = `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`;
        statusCode = 400;
        break;

      // Check constraint violation
      case '23514':
        userMessage = 'Data does not meet system requirements.';
        statusCode = 400;
        break;

      // Connection errors
      case 'ECONNREFUSED':
      case 'ENOTFOUND':
      case 'ECONNRESET':
        userMessage = 'Database connection failed. Please try again later.';
        statusCode = 503;
        break;

      // Timeout errors
      case 'ETIMEDOUT':
        userMessage = 'Operation timed out. Please try again.';
        statusCode = 408;
        break;

      // Syntax errors (should not happen in production)
      case '42601':
      case '42703':
        userMessage = 'Invalid request format.';
        statusCode = 400;
        break;

      // Permission errors
      case '42501':
        userMessage = 'Insufficient permissions to perform this action.';
        statusCode = 403;
        break;

      // Database full or disk full
      case '53100':
      case '53200':
        userMessage = 'Service temporarily unavailable due to capacity limits.';
        statusCode = 503;
        break;

      default:
        userMessage = 'A database error occurred. Please try again.';
        statusCode = 500;
    }
  } else {
    // Handle non-PostgreSQL errors
    if (dbError.message?.includes('timeout')) {
      userMessage = 'Operation timed out. Please try again.';
      statusCode = 408;
    } else if (dbError.message?.includes('connection')) {
      userMessage = 'Database connection failed. Please try again later.';
      statusCode = 503;
    } else {
      userMessage = 'A database error occurred. Please try again.';
      statusCode = 500;
    }
  }

  // Create enhanced error for response
  const enhancedError = new Error(userMessage) as any;
  enhancedError.statusCode = statusCode;
  enhancedError.code = dbError.code;
  enhancedError.operation = operation;
  enhancedError.originalError = dbError;

  throw enhancedError;
}

// Retry wrapper for database operations with exponential backoff
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      
      // Log successful retry if it's not the first attempt
      if (attempt > 1) {
        errorTracker.log('info', `Database operation succeeded on retry`, {
          route: operationName,
          meta: { attempt, maxRetries },
        });
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain error types (client errors, constraint violations, etc.)
      if (error.code && (
        error.code.startsWith('23') || // Integrity constraint violations
        error.code.startsWith('42') || // Syntax errors, permission denied
        error.statusCode < 500 // Client errors
      )) {
        break;
      }
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      
      errorTracker.log('warn', `Database operation failed, retrying`, {
        route: operationName,
        meta: { attempt, maxRetries, nextRetryIn: delay, error: error.message },
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // If we get here, all retries failed
  handleDatabaseError(lastError, operationName, {
    maxRetries,
    finalAttempt: true,
  });
}

// Transaction wrapper with proper error handling and rollback
export async function withDatabaseTransaction<T>(
  db: any,
  operation: (tx: any) => Promise<T>,
  operationName: string
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await db.transaction(async (tx: any) => {
      try {
        return await operation(tx);
      } catch (error) {
        // Log transaction error before rollback
        errorTracker.log('error', `Transaction failed, rolling back: ${operationName}`, {
          route: operationName,
          meta: { duration: Date.now() - startTime, error: (error as Error).message },
        });
        throw error;
      }
    });
    
    // Log successful transaction
    const duration = Date.now() - startTime;
    if (duration > 1000) { // Log slow transactions
      errorTracker.log('warn', `Slow database transaction completed: ${operationName}`, {
        route: operationName,
        meta: { duration },
      });
    }
    
    return result;
  } catch (error) {
    handleDatabaseError(error, `Transaction: ${operationName}`, {
      duration: Date.now() - startTime,
    });
  }
}

// Health check for database connection
export async function checkDatabaseHealth(db: any): Promise<{ healthy: boolean; latency?: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    // Simple query to test connection
    await db.execute('SELECT 1');
    
    const latency = Date.now() - startTime;
    return {
      healthy: true,
      latency,
    };
  } catch (error: any) {
    return {
      healthy: false,
      error: error.message,
      latency: Date.now() - startTime,
    };
  }
}