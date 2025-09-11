/**
 * Security-hardened logging utilities that prevent PII leakage
 * 
 * SECURITY: Never log sensitive user data like emails, names, or tokens
 */

export interface SecureLogContext {
  userId?: string;
  provider?: string;
  sessionId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Sanitizes user object to remove PII before logging
 */
export function sanitizeUserForLogging(user: any): { id: string; provider?: string } {
  if (!user) return { id: 'unknown' };
  
  return {
    id: user.id || 'unknown',
    provider: user.provider || 'unknown'
  };
}

/**
 * Sanitizes request object to remove sensitive headers and data
 */
export function sanitizeRequestForLogging(req: any): Record<string, any> {
  const sanitized: Record<string, any> = {
    method: req.method,
    path: req.path,
    ip: req.ip || 'unknown',
    userAgent: req.get('user-agent')?.substring(0, 100) || 'unknown'
  };
  
  // Never log authorization headers, cookies, or sensitive query params
  if (req.query && Object.keys(req.query).length > 0) {
    const sanitizedQuery: Record<string, any> = {};
    for (const [key, value] of Object.entries(req.query)) {
      // Skip sensitive query params
      if (!['token', 'code', 'state', 'email', 'phone'].includes(key.toLowerCase())) {
        sanitizedQuery[key] = typeof value === 'string' ? value.substring(0, 50) : value;
      }
    }
    if (Object.keys(sanitizedQuery).length > 0) {
      sanitized.query = sanitizedQuery;
    }
  }
  
  return sanitized;
}

/**
 * Sanitizes response body to prevent PII leakage in logs
 */
export function sanitizeResponseForLogging(body: any): any {
  if (!body || typeof body !== 'object') return null;
  
  // Never log response bodies that might contain PII
  if (body.email || body.phone || body.name || body.user || body.users) {
    return '[RESPONSE_SANITIZED]';
  }
  
  // For error responses, only log the error type
  if (body.error || body.message) {
    return {
      error: body.error?.substring?.(0, 100) || body.error,
      message: body.message?.substring?.(0, 100) || body.message
    };
  }
  
  return null;
}

/**
 * Secure authentication success logging
 */
export function logAuthSuccess(method: string, context: SecureLogContext): void {
  const sanitizedContext = {
    userId: context.userId?.substring(0, 8) + '...' || 'unknown',
    provider: context.provider || 'unknown',
    method
  };
  
  console.log(`✅ Authentication successful:`, sanitizedContext);
}

/**
 * Secure authentication failure logging
 */
export function logAuthFailure(method: string, reason: string, context: Partial<SecureLogContext> = {}): void {
  const sanitizedContext = {
    method,
    reason: reason.substring(0, 100),
    provider: context.provider || 'unknown',
    ip: context.ip || 'unknown'
  };
  
  console.log(`❌ Authentication failed:`, sanitizedContext);
}

/**
 * Secure request logging for sensitive operations
 */
export function logSecureOperation(operation: string, context: SecureLogContext): void {
  const sanitizedContext = {
    operation,
    userId: context.userId?.substring(0, 8) + '...' || 'unknown',
    ip: context.ip || 'unknown'
  };
  
  console.log(`🔐 Secure operation:`, sanitizedContext);
}

/**
 * Development-only logging that's stripped in production
 */
export function logDev(message: string, data?: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔧 DEV: ${message}`, data ? sanitizeForLogging(data) : '');
  }
}

/**
 * Generic data sanitizer for logging
 */
export function sanitizeForLogging(data: any): any {
  if (!data) return data;
  
  if (typeof data === 'string') {
    // Check for potential PII patterns
    if (data.includes('@') || data.includes('+') || data.length > 100) {
      return '[SANITIZED]';
    }
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeForLogging);
  }
  
  if (typeof data === 'object') {
    const sanitized: any = {};
    const sensitiveKeys = ['email', 'phone', 'name', 'firstName', 'lastName', 'password', 'token', 'secret'];
    
    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[SANITIZED]';
      } else {
        sanitized[key] = sanitizeForLogging(value);
      }
    }
    return sanitized;
  }
  
  return data;
}