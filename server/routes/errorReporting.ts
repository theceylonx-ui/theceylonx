import type { Express } from "express";
import { errorTracker } from "../utils/errorTracking";
import { z } from "zod";

// Schema for error reporting
const errorReportSchema = z.object({
  errorId: z.string().optional(),
  message: z.string(),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  userAgent: z.string().optional(),
  url: z.string(),
  timestamp: z.string().transform(str => new Date(str)),
  userId: z.string().optional(),
  additionalContext: z.record(z.any()).optional(),
});

export function setupErrorReporting(app: Express) {
  // Client error reporting endpoint
  app.post('/api/errors/report', async (req, res) => {
    try {
      const errorData = errorReportSchema.parse(req.body);
      
      // Log the error with enhanced context
      errorTracker.log('error', `Client Error: ${errorData.message}`, {
        errorId: errorData.errorId,
        clientStack: errorData.stack,
        componentStack: errorData.componentStack,
        url: errorData.url,
        userAgent: errorData.userAgent || req.get('User-Agent'),
        userId: errorData.userId || (req as any).user?.id,
        ip: req.ip,
        timestamp: errorData.timestamp,
        additionalContext: errorData.additionalContext,
        reportedAt: new Date().toISOString(),
      });

      // In production, you might want to send this to an external service like Sentry
      if (process.env.NODE_ENV === 'production') {
        // Example: Send to Sentry, LogRocket, or other error tracking service
        console.log('📊 Error reported to tracking service:', errorData.errorId);
      }

      res.json({ 
        success: true, 
        errorId: errorData.errorId,
        message: 'Error report received' 
      });
    } catch (validationError) {
      console.warn('Invalid error report received:', validationError);
      res.status(400).json({ 
        error: 'Invalid error report format' 
      });
    }
  });

  // Health check for error reporting system
  app.get('/api/errors/health', (req, res) => {
    try {
      const recentErrors = errorTracker.getRecentErrors(10);
      const errorCounts = {
        total: recentErrors.length,
        errors: errorTracker.getErrorsByLevel('error').length,
        warnings: errorTracker.getErrorsByLevel('warn').length,
      };

      res.json({
        status: 'healthy',
        errorTracking: {
          enabled: true,
          recentErrorCount: errorCounts.total,
          errorsByLevel: errorCounts,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: 'Error tracking system failure',
      });
    }
  });

  // Get recent errors (admin only - you might want to add auth middleware)
  app.get('/api/errors/recent', (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const level = req.query.level as string;

      const errors = level 
        ? errorTracker.getErrorsByLevel(level as any, limit)
        : errorTracker.getRecentErrors(limit);

      // Remove sensitive information before sending
      const sanitizedErrors = errors.map(error => ({
        id: error.id,
        timestamp: error.timestamp,
        level: error.level,
        message: error.message,
        // Remove sensitive fields like user info, IP addresses, etc.
        route: error.route,
        userAgent: error.userAgent ? 'redacted' : undefined,
      }));

      res.json({
        errors: sanitizedErrors,
        total: errors.length,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve error logs',
      });
    }
  });
}