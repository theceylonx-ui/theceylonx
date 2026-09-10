import { isProduction, isDevelopment } from '../config/environment';

// 🚀 PHASE 4: Production-ready structured logging system

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  errorCode?: string;
  feature?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context: LogContext;
  environment: string;
  service: string;
}

class Logger {
  private serviceName: string = 'hibowan-api';
  private minLevel: LogLevel = isProduction() ? LogLevel.INFO : LogLevel.DEBUG;

  // Format structured log entry
  private formatLogEntry(level: LogLevel, message: string, context: LogContext = {}): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: LogLevel[level].toLowerCase(),
      message,
      context: {
        ...context,
        requestId: context.requestId || this.generateRequestId(),
      },
      environment: process.env.NODE_ENV || 'development',
      service: this.serviceName,
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.minLevel;
  }

  private writeLog(logEntry: LogEntry): void {
    if (isProduction()) {
      // Production: JSON structured logs for analysis tools
      console.log(JSON.stringify(logEntry));
    } else {
      // Development: Human-readable logs with colors
      const levelColors = {
        error: '\x1b[31m', // Red
        warn: '\x1b[33m',  // Yellow
        info: '\x1b[36m',  // Cyan
        debug: '\x1b[37m', // White
      };
      
      const resetColor = '\x1b[0m';
      const color = levelColors[logEntry.level as keyof typeof levelColors] || '';
      
      const contextStr = Object.keys(logEntry.context).length > 0 
        ? ` | ${JSON.stringify(logEntry.context, null, 0)}`
        : '';
      
      console.log(
        `${color}[${logEntry.timestamp}] ${logEntry.level.toUpperCase()}: ${logEntry.message}${contextStr}${resetColor}`
      );
    }
  }

  // Public logging methods
  error(message: string, context: LogContext = {}): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.writeLog(this.formatLogEntry(LogLevel.ERROR, message, context));
    }
  }

  warn(message: string, context: LogContext = {}): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.writeLog(this.formatLogEntry(LogLevel.WARN, message, context));
    }
  }

  info(message: string, context: LogContext = {}): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.writeLog(this.formatLogEntry(LogLevel.INFO, message, context));
    }
  }

  debug(message: string, context: LogContext = {}): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.writeLog(this.formatLogEntry(LogLevel.DEBUG, message, context));
    }
  }

  // Special logging methods for common use cases
  
  // HTTP request logging
  httpRequest(message: string, context: {
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    userId?: string;
    ip?: string;
    userAgent?: string;
  }): void {
    this.info(`HTTP ${context.method} ${context.url} - ${context.statusCode} (${context.duration}ms)`, {
      ...context,
      feature: 'http',
      action: 'request',
    });
  }

  // Database operation logging
  database(message: string, context: {
    operation: 'select' | 'insert' | 'update' | 'delete';
    table: string;
    duration?: number;
    rowCount?: number;
    userId?: string;
  }): void {
    this.debug(`DB ${context.operation.toUpperCase()} ${context.table}`, {
      ...context,
      feature: 'database',
      action: context.operation,
    });
  }

  // Authentication logging
  auth(message: string, context: {
    action: 'login' | 'logout' | 'register' | 'failed_login';
    userId?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
  }): void {
    const level = context.action === 'failed_login' ? LogLevel.WARN : LogLevel.INFO;
    if (this.shouldLog(level)) {
      this.writeLog(this.formatLogEntry(level, message, {
        ...context,
        feature: 'authentication',
        // Don't log sensitive data in production
        email: isProduction() ? undefined : context.email,
      }));
    }
  }

  // Security incident logging
  security(message: string, context: {
    incident: 'rate_limit' | 'invalid_input' | 'unauthorized_access' | 'suspicious_activity';
    ip?: string;
    userAgent?: string;
    userId?: string;
    url?: string;
  }): void {
    this.warn(`SECURITY: ${message}`, {
      ...context,
      feature: 'security',
      action: context.incident,
    });
  }

  // Performance logging
  performance(message: string, context: {
    operation: string;
    duration: number;
    threshold?: number;
    userId?: string;
    metadata?: Record<string, any>;
  }): void {
    const level = context.threshold && context.duration > context.threshold 
      ? LogLevel.WARN 
      : LogLevel.DEBUG;
    
    if (this.shouldLog(level)) {
      this.writeLog(this.formatLogEntry(level, message, {
        ...context,
        feature: 'performance',
        action: 'measurement',
      }));
    }
  }

  // Business logic logging
  business(message: string, context: {
    event: string;
    userId?: string;
    tripId?: string;
    amount?: number;
    metadata?: Record<string, any>;
  }): void {
    this.info(`BUSINESS: ${message}`, {
      ...context,
      feature: 'business',
      action: context.event,
    });
  }
}

// Export singleton logger instance
export const logger = new Logger();

// Export convenience functions for quick logging
export const log = {
  error: (message: string, context?: LogContext) => logger.error(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  
  // Specialized logging
  http: logger.httpRequest.bind(logger),
  db: logger.database.bind(logger),
  auth: logger.auth.bind(logger),
  security: logger.security.bind(logger),
  perf: logger.performance.bind(logger),
  business: logger.business.bind(logger),
};