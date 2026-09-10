// 🚀 ENHANCED ERROR MONITORING - Production-ready error tracking with alerting
import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error categories for better classification
export type ErrorCategory = 
  | 'authentication' 
  | 'authorization' 
  | 'database' 
  | 'external_service' 
  | 'business_logic' 
  | 'validation' 
  | 'network' 
  | 'security' 
  | 'performance'
  | 'system'
  | 'unknown';

// Enhanced error interface
interface EnhancedError {
  id: string;
  timestamp: Date;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  stack?: string;
  context: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    endpoint?: string;
    method?: string;
    userAgent?: string;
    ip?: string;
    referer?: string;
    environment: string;
    nodeVersion: string;
    uptime: number;
  };
  metadata?: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  occurrenceCount: number;
  firstSeen: Date;
  lastSeen: Date;
  fingerprint: string; // For grouping similar errors
}

// Alert configuration
interface AlertConfig {
  enabled: boolean;
  channels: ('console' | 'webhook' | 'email')[];
  webhookUrl?: string;
  emailRecipients?: string[];
  thresholds: {
    critical: { count: number; timeWindow: number }; // errors per timeWindow (ms)
    high: { count: number; timeWindow: number };
    medium: { count: number; timeWindow: number };
  };
  cooldownPeriod: number; // ms between alerts for same error
}

// Error rate tracking
interface ErrorRateStats {
  timeWindow: Date;
  totalErrors: number;
  criticalErrors: number;
  highSeverityErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsByEndpoint: Record<string, number>;
  uniqueErrors: number;
}

class EnhancedErrorService {
  private errors: Map<string, EnhancedError> = new Map();
  private errorRateHistory: ErrorRateStats[] = [];
  private lastAlerts: Map<string, Date> = new Map();
  private alertConfig: AlertConfig;
  
  // Performance and health stats
  private stats = {
    totalErrors: 0,
    resolvedErrors: 0,
    criticalErrorsToday: 0,
    errorRate: 0,
    mttr: 0, // Mean Time To Resolution
    uptimeStart: Date.now()
  };

  constructor(alertConfig: Partial<AlertConfig> = {}) {
    this.alertConfig = {
      enabled: process.env.NODE_ENV === 'production' || process.env.ENABLE_ERROR_ALERTS === 'true',
      channels: ['console'],
      webhookUrl: process.env.ERROR_WEBHOOK_URL,
      emailRecipients: process.env.ERROR_EMAIL_RECIPIENTS?.split(',') || [],
      thresholds: {
        critical: { count: 1, timeWindow: 60000 }, // 1 critical error in 1 minute
        high: { count: 5, timeWindow: 300000 }, // 5 high errors in 5 minutes
        medium: { count: 10, timeWindow: 600000 } // 10 medium errors in 10 minutes
      },
      cooldownPeriod: 300000, // 5 minutes
      ...alertConfig
    };

    this.startErrorRateTracking();
    console.log('🚨 Enhanced Error Service initialized with alerting enabled:', this.alertConfig.enabled);
  }

  // Enhanced error tracking with context and fingerprinting
  trackError(
    error: Error | string,
    severity: ErrorSeverity,
    category: ErrorCategory,
    context: Partial<EnhancedError['context']> = {},
    metadata: Record<string, any> = {}
  ): string {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? undefined : error.stack;
    
    // Generate fingerprint for grouping similar errors
    const fingerprint = this.generateFingerprint(errorMessage, stack, category);
    
    const now = new Date();
    const existingError = this.errors.get(fingerprint);
    
    if (existingError) {
      // Update existing error
      existingError.occurrenceCount++;
      existingError.lastSeen = now;
      existingError.severity = this.getHigherSeverity(existingError.severity, severity);
      existingError.metadata = { ...existingError.metadata, ...metadata };
    } else {
      // Create new error entry
      const enhancedError: EnhancedError = {
        id: this.generateErrorId(),
        timestamp: now,
        severity,
        category,
        message: errorMessage,
        stack,
        context: {
          environment: process.env.NODE_ENV || 'development',
          nodeVersion: process.version,
          uptime: process.uptime(),
          ...context
        },
        metadata,
        resolved: false,
        occurrenceCount: 1,
        firstSeen: now,
        lastSeen: now,
        fingerprint
      };
      
      this.errors.set(fingerprint, enhancedError);
    }

    this.stats.totalErrors++;
    if (severity === 'critical') {
      this.stats.criticalErrorsToday++;
    }

    // Check alert thresholds
    this.checkAlertThresholds(severity, category, fingerprint);
    
    // Log error with context
    this.logError(this.errors.get(fingerprint)!);
    
    return fingerprint;
  }

  // Express middleware for automatic error tracking
  createErrorMiddleware() {
    return (error: Error, req: Request, res: Response, next: NextFunction) => {
      const severity = this.determineSeverity(error, res.statusCode);
      const category = this.categorizeError(error, req.path);
      
      const context = {
        userId: (req as any).user?.id,
        sessionId: req.sessionID,
        requestId: req.headers['x-request-id'] as string,
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        referer: req.get('Referer')
      };

      const metadata = {
        statusCode: res.statusCode,
        requestBody: req.body,
        requestHeaders: req.headers,
        responseHeaders: res.getHeaders()
      };

      this.trackError(error, severity, category, context, metadata);
      next(error);
    };
  }

  // Authentication error tracking
  trackAuthError(
    errorType: 'login_failed' | 'token_expired' | 'unauthorized' | 'forbidden',
    userId?: string,
    context: Record<string, any> = {}
  ): void {
    const severity: ErrorSeverity = errorType === 'unauthorized' || errorType === 'forbidden' ? 'high' : 'medium';
    
    this.trackError(
      `Authentication error: ${errorType}`,
      severity,
      'authentication',
      { userId },
      { errorType, ...context }
    );
  }

  // Business logic error tracking
  trackBusinessError(
    operation: string,
    error: string,
    severity: ErrorSeverity = 'medium',
    userId?: string,
    metadata: Record<string, any> = {}
  ): void {
    this.trackError(
      `Business logic error in ${operation}: ${error}`,
      severity,
      'business_logic',
      { userId },
      { operation, ...metadata }
    );
  }

  // Database error tracking
  trackDatabaseError(
    queryType: string,
    error: Error,
    tableName?: string,
    userId?: string
  ): void {
    this.trackError(
      error,
      'high', // Database errors are always high severity
      'database',
      { userId },
      { queryType, tableName, duration: performance.now() }
    );
  }

  // External service error tracking
  trackExternalServiceError(
    serviceName: string,
    error: Error,
    endpoint?: string,
    responseCode?: number
  ): void {
    const severity: ErrorSeverity = responseCode && responseCode >= 500 ? 'high' : 'medium';
    
    this.trackError(
      error,
      severity,
      'external_service',
      {},
      { serviceName, endpoint, responseCode }
    );
  }

  // Security event tracking
  trackSecurityEvent(
    eventType: 'brute_force' | 'sql_injection' | 'xss_attempt' | 'rate_limit_exceeded',
    ip: string,
    userId?: string,
    metadata: Record<string, any> = {}
  ): void {
    this.trackError(
      `Security event: ${eventType}`,
      'critical', // Security events are always critical
      'security',
      { userId, ip },
      { eventType, ...metadata }
    );
  }

  // Alert threshold checking
  private checkAlertThresholds(severity: ErrorSeverity, category: ErrorCategory, fingerprint: string): void {
    if (!this.alertConfig.enabled) return;

    const now = Date.now();
    const lastAlert = this.lastAlerts.get(fingerprint);
    
    // Check cooldown period
    if (lastAlert && (now - lastAlert.getTime()) < this.alertConfig.cooldownPeriod) {
      return;
    }

    const threshold = this.alertConfig.thresholds[severity as keyof AlertConfig['thresholds']];
    if (!threshold) return;

    // Count recent errors of this severity
    const recentErrors = this.getRecentErrors(threshold.timeWindow);
    const severityCount = recentErrors.filter(e => e.severity === severity).length;
    
    if (severityCount >= threshold.count) {
      this.sendAlert(severity, category, severityCount, fingerprint);
      this.lastAlerts.set(fingerprint, new Date());
    }
  }

  // Send alerts through configured channels
  private async sendAlert(
    severity: ErrorSeverity,
    category: ErrorCategory,
    count: number,
    fingerprint: string
  ): Promise<void> {
    const error = this.errors.get(fingerprint);
    if (!error) return;

    const alertMessage = this.formatAlertMessage(severity, category, count, error);

    for (const channel of this.alertConfig.channels) {
      try {
        switch (channel) {
          case 'console':
            console.error(`🚨 ALERT [${severity.toUpperCase()}]:`, alertMessage);
            break;
          case 'webhook':
            if (this.alertConfig.webhookUrl) {
              await this.sendWebhookAlert(alertMessage, error);
            }
            break;
          case 'email':
            if (this.alertConfig.emailRecipients?.length) {
              await this.sendEmailAlert(alertMessage, error);
            }
            break;
        }
      } catch (alertError) {
        console.error('Failed to send alert:', alertError);
      }
    }
  }

  // Format alert message
  private formatAlertMessage(
    severity: ErrorSeverity,
    category: ErrorCategory,
    count: number,
    error: EnhancedError
  ): string {
    return `
🚨 HiBowan Alert - ${severity.toUpperCase()} Error
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Severity: ${severity}
📂 Category: ${category}
🔢 Occurrences: ${count} (${error.occurrenceCount} total)
⏰ First Seen: ${error.firstSeen.toISOString()}
⏰ Last Seen: ${error.lastSeen.toISOString()}
🌍 Environment: ${error.context.environment}

🔍 Error Details:
${error.message}

📍 Context:
${JSON.stringify(error.context, null, 2)}

📋 Metadata:
${JSON.stringify(error.metadata, null, 2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
  }

  // Send webhook alert
  private async sendWebhookAlert(message: string, error: EnhancedError): Promise<void> {
    if (!this.alertConfig.webhookUrl) return;

    const payload = {
      text: message,
      error: {
        id: error.id,
        severity: error.severity,
        category: error.category,
        message: error.message,
        timestamp: error.timestamp,
        context: error.context,
        metadata: error.metadata
      }
    };

    // In production, implement actual webhook sending
    console.log('📡 Would send webhook alert to:', this.alertConfig.webhookUrl);
    console.log('Payload:', JSON.stringify(payload, null, 2));
  }

  // Send email alert
  private async sendEmailAlert(message: string, error: EnhancedError): Promise<void> {
    if (!this.alertConfig.emailRecipients?.length) return;

    // In production, implement actual email sending using SendGrid or similar
    console.log('📧 Would send email alert to:', this.alertConfig.emailRecipients);
    console.log('Message:', message);
  }

  // Error categorization logic
  private categorizeError(error: Error, endpoint?: string): ErrorCategory {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('auth') || message.includes('login') || message.includes('token')) {
      return 'authentication';
    }
    if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'authorization';
    }
    if (message.includes('database') || message.includes('sql') || message.includes('connection')) {
      return 'database';
    }
    if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
      return 'network';
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return 'validation';
    }
    if (message.includes('memory') || message.includes('cpu') || message.includes('disk')) {
      return 'system';
    }
    if (endpoint?.includes('/api/')) {
      return 'business_logic';
    }
    
    return 'unknown';
  }

  // Severity determination logic
  private determineSeverity(error: Error, statusCode: number): ErrorSeverity {
    const message = error.message.toLowerCase();

    // Critical errors
    if (statusCode >= 500 || 
        message.includes('database connection') || 
        message.includes('out of memory') ||
        message.includes('security') ||
        message.includes('critical')) {
      return 'critical';
    }

    // High severity errors
    if (statusCode === 429 || // Rate limiting
        statusCode === 401 || // Unauthorized
        message.includes('authentication') ||
        message.includes('payment') ||
        message.includes('data loss')) {
      return 'high';
    }

    // Medium severity errors
    if (statusCode >= 400 || 
        message.includes('validation') ||
        message.includes('not found')) {
      return 'medium';
    }

    return 'low';
  }

  // Utility methods
  private generateFingerprint(message: string, stack?: string, category?: ErrorCategory): string {
    const fingerprint = `${category || 'unknown'}_${message.substring(0, 100)}_${stack?.split('\n')[0] || ''}`;
    return Buffer.from(fingerprint).toString('base64').substring(0, 32);
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getHigherSeverity(current: ErrorSeverity, new_: ErrorSeverity): ErrorSeverity {
    const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
    return severityOrder[new_] > severityOrder[current] ? new_ : current;
  }

  private logError(error: EnhancedError): void {
    const logLevel = error.severity === 'critical' ? 'error' : 
                    error.severity === 'high' ? 'warn' : 'info';
    
    console[logLevel](`🚨 [${error.severity.toUpperCase()}] ${error.category}: ${error.message}`, {
      id: error.id,
      fingerprint: error.fingerprint,
      occurrences: error.occurrenceCount,
      context: error.context
    });
  }

  // Error rate tracking
  private startErrorRateTracking(): void {
    setInterval(() => {
      this.updateErrorRateStats();
    }, 60000); // Every minute
  }

  private updateErrorRateStats(): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const recentErrors = this.getRecentErrors(3600000); // Last hour

    const stats: ErrorRateStats = {
      timeWindow: now,
      totalErrors: recentErrors.length,
      criticalErrors: recentErrors.filter(e => e.severity === 'critical').length,
      highSeverityErrors: recentErrors.filter(e => e.severity === 'high').length,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsByEndpoint: {} as Record<string, number>,
      uniqueErrors: new Set(recentErrors.map(e => e.fingerprint)).size
    };

    // Count by category
    recentErrors.forEach(error => {
      stats.errorsByCategory[error.category] = (stats.errorsByCategory[error.category] || 0) + 1;
      if (error.context.endpoint) {
        stats.errorsByEndpoint[error.context.endpoint] = (stats.errorsByEndpoint[error.context.endpoint] || 0) + 1;
      }
    });

    this.errorRateHistory.push(stats);
    
    // Keep only last 24 hours
    this.errorRateHistory = this.errorRateHistory.filter(
      stat => stat.timeWindow.getTime() > oneHourAgo.getTime()
    );

    // Update global stats
    this.stats.errorRate = stats.totalErrors;
  }

  private getRecentErrors(timeWindowMs: number): EnhancedError[] {
    const cutoff = new Date(Date.now() - timeWindowMs);
    return Array.from(this.errors.values()).filter(error => error.lastSeen >= cutoff);
  }

  // Public API methods
  getErrorStats() {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.uptimeStart,
      recentRates: this.errorRateHistory.slice(-24), // Last 24 hours
      totalUniqueErrors: this.errors.size,
      unresolvedErrors: Array.from(this.errors.values()).filter(e => !e.resolved).length
    };
  }

  getErrorDetails(fingerprint: string): EnhancedError | undefined {
    return this.errors.get(fingerprint);
  }

  getRecentErrorsSummary(limitHours: number = 24) {
    const recentErrors = this.getRecentErrors(limitHours * 3600000);
    
    return {
      total: recentErrors.length,
      bySeverity: {
        critical: recentErrors.filter(e => e.severity === 'critical').length,
        high: recentErrors.filter(e => e.severity === 'high').length,
        medium: recentErrors.filter(e => e.severity === 'medium').length,
        low: recentErrors.filter(e => e.severity === 'low').length
      },
      byCategory: recentErrors.reduce((acc, error) => {
        acc[error.category] = (acc[error.category] || 0) + 1;
        return acc;
      }, {} as Record<ErrorCategory, number>),
      topErrors: Array.from(this.errors.values())
        .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
        .slice(0, 10)
        .map(error => ({
          fingerprint: error.fingerprint,
          message: error.message,
          category: error.category,
          severity: error.severity,
          occurrences: error.occurrenceCount,
          lastSeen: error.lastSeen
        }))
    };
  }

  // Error resolution
  resolveError(fingerprint: string, resolvedBy: string): boolean {
    const error = this.errors.get(fingerprint);
    if (!error || error.resolved) return false;

    error.resolved = true;
    error.resolvedAt = new Date();
    error.resolvedBy = resolvedBy;
    
    this.stats.resolvedErrors++;
    console.log(`✅ Error resolved: ${fingerprint} by ${resolvedBy}`);
    
    return true;
  }
}

// Global enhanced error service instance
export const enhancedErrorService = new EnhancedErrorService();

// Convenience functions for common error tracking scenarios
export const trackError = enhancedErrorService.trackError.bind(enhancedErrorService);
export const trackAuthError = enhancedErrorService.trackAuthError.bind(enhancedErrorService);
export const trackBusinessError = enhancedErrorService.trackBusinessError.bind(enhancedErrorService);
export const trackDatabaseError = enhancedErrorService.trackDatabaseError.bind(enhancedErrorService);
export const trackExternalServiceError = enhancedErrorService.trackExternalServiceError.bind(enhancedErrorService);
export const trackSecurityEvent = enhancedErrorService.trackSecurityEvent.bind(enhancedErrorService);

export default enhancedErrorService;