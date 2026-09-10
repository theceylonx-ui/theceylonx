// 🚀 ENHANCED LOGGING & OBSERVABILITY - Production-ready structured logging and tracing
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

// Log entry interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  environment: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata: Record<string, any>;
  duration?: number;
  tags: string[];
}

// Trace span for distributed tracing
interface TraceSpan {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, any>;
  logs: LogEntry[];
  status: 'ok' | 'error' | 'timeout';
  errorMessage?: string;
}

// Request context for tracing
interface RequestContext {
  traceId: string;
  requestId: string;
  userId?: string;
  sessionId?: string;
  startTime: number;
  spans: Map<string, TraceSpan>;
  metadata: Record<string, any>;
}

// Log aggregation and search
interface LogSearchQuery {
  level?: LogLevel;
  service?: string;
  traceId?: string;
  userId?: string;
  timeRange?: { start: Date; end: Date };
  message?: string;
  tags?: string[];
  limit?: number;
}

// Performance metrics for logging
interface LoggingMetrics {
  totalLogs: number;
  logsByLevel: Record<LogLevel, number>;
  averageLogSize: number;
  errorRate: number;
  tracesGenerated: number;
  averageTraceLength: number;
}

class EnhancedLoggingService {
  private logs: LogEntry[] = [];
  private traces: Map<string, RequestContext> = new Map();
  private metrics: LoggingMetrics = {
    totalLogs: 0,
    logsByLevel: { debug: 0, info: 0, warn: 0, error: 0, critical: 0 },
    averageLogSize: 0,
    errorRate: 0,
    tracesGenerated: 0,
    averageTraceLength: 0
  };
  
  private serviceName: string;
  private environment: string;
  private maxLogsInMemory: number;
  private enabledLevels: Set<LogLevel>;

  constructor(
    serviceName: string = 'hibowan',
    environment: string = process.env.NODE_ENV || 'development',
    config: {
      maxLogsInMemory?: number;
      enabledLevels?: LogLevel[];
    } = {}
  ) {
    this.serviceName = serviceName;
    this.environment = environment;
    this.maxLogsInMemory = config.maxLogsInMemory || 10000;
    this.enabledLevels = new Set(config.enabledLevels || (['info', 'warn', 'error', 'critical'] as LogLevel[]));
    
    this.startLogCleanup();
    console.log(`📝 Enhanced Logging Service initialized for ${serviceName} in ${environment}`);
  }

  // Core logging method
  log(
    level: LogLevel,
    message: string,
    metadata: Record<string, any> = {},
    context?: {
      traceId?: string;
      spanId?: string;
      userId?: string;
      sessionId?: string;
      requestId?: string;
      duration?: number;
      tags?: string[];
    }
  ): void {
    if (!this.enabledLevels.has(level)) return;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.serviceName,
      environment: this.environment,
      traceId: context?.traceId,
      spanId: context?.spanId,
      userId: context?.userId,
      sessionId: context?.sessionId,
      requestId: context?.requestId,
      metadata,
      duration: context?.duration,
      tags: context?.tags || []
    };

    // Store log entry
    this.logs.push(logEntry);
    this.updateMetrics(logEntry);
    
    // Add to trace if applicable
    if (context?.traceId) {
      this.addLogToTrace(context.traceId, context.spanId, logEntry);
    }

    // Output to console with proper formatting
    this.outputLog(logEntry);
    
    // Trim logs if necessary
    this.trimLogs();
  }

  // Convenience logging methods
  debug(message: string, metadata?: Record<string, any>, context?: any): void {
    this.log('debug', message, metadata, context);
  }

  info(message: string, metadata?: Record<string, any>, context?: any): void {
    this.log('info', message, metadata, context);
  }

  warn(message: string, metadata?: Record<string, any>, context?: any): void {
    this.log('warn', message, metadata, context);
  }

  error(message: string, error?: Error, metadata?: Record<string, any>, context?: any): void {
    const errorMetadata = {
      ...metadata,
      ...(error && {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      })
    };
    this.log('error', message, errorMetadata, context);
  }

  critical(message: string, error?: Error, metadata?: Record<string, any>, context?: any): void {
    const errorMetadata = {
      ...metadata,
      ...(error && {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      })
    };
    this.log('critical', message, errorMetadata, context);
  }

  // Express middleware for request tracing
  createTracingMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const traceId = uuidv4();
      const requestId = uuidv4();
      const startTime = performance.now();
      
      // Create request context
      const context: RequestContext = {
        traceId,
        requestId,
        userId: (req as any).user?.id,
        sessionId: req.sessionID,
        startTime,
        spans: new Map(),
        metadata: {
          method: req.method,
          path: req.path,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          referer: req.get('Referer')
        }
      };
      
      this.traces.set(traceId, context);
      
      // Attach context to request
      (req as any).traceContext = context;
      
      // Create main request span
      const mainSpan = this.startSpan(traceId, 'http_request', {
        'http.method': req.method,
        'http.path': req.path,
        'http.user_agent': req.get('User-Agent')
      });
      
      // Log request start
      this.info(`${req.method} ${req.path} started`, {
        method: req.method,
        path: req.path,
        query: req.query,
        headers: req.headers
      }, {
        traceId,
        spanId: mainSpan.spanId,
        userId: context.userId,
        sessionId: context.sessionId,
        requestId,
        tags: ['http', 'request', 'start']
      });
      
      // Track response
      res.on('finish', () => {
        const duration = performance.now() - startTime;
        
        // End main span
        this.endSpan(traceId, mainSpan.spanId, {
          'http.status_code': res.statusCode,
          'http.response_size': res.get('Content-Length') || 0
        });
        
        // Log request completion
        const level: LogLevel = res.statusCode >= 500 ? 'error' : 
                               res.statusCode >= 400 ? 'warn' : 'info';
        
        this.log(level, `${req.method} ${req.path} completed`, {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          responseTime: duration,
          responseSize: res.get('Content-Length') || 0
        }, {
          traceId,
          spanId: mainSpan.spanId,
          userId: context.userId,
          sessionId: context.sessionId,
          requestId,
          duration,
          tags: ['http', 'request', 'complete']
        });
        
        // Clean up old traces
        setTimeout(() => {
          this.traces.delete(traceId);
        }, 300000); // 5 minutes
      });
      
      next();
    };
  }

  // Distributed tracing methods
  startSpan(
    traceId: string,
    operationName: string,
    tags: Record<string, any> = {},
    parentSpanId?: string
  ): TraceSpan {
    const spanId = uuidv4();
    const span: TraceSpan = {
      spanId,
      traceId,
      parentSpanId,
      operationName,
      startTime: performance.now(),
      tags,
      logs: [],
      status: 'ok'
    };
    
    const context = this.traces.get(traceId);
    if (context) {
      context.spans.set(spanId, span);
    }
    
    this.debug(`Span started: ${operationName}`, tags, {
      traceId,
      spanId,
      tags: ['span', 'start']
    });
    
    return span;
  }

  endSpan(
    traceId: string,
    spanId: string,
    tags: Record<string, any> = {},
    errorMessage?: string
  ): void {
    const context = this.traces.get(traceId);
    if (!context) return;
    
    const span = context.spans.get(spanId);
    if (!span) return;
    
    span.endTime = performance.now();
    span.duration = span.endTime - span.startTime;
    span.tags = { ...span.tags, ...tags };
    
    if (errorMessage) {
      span.status = 'error';
      span.errorMessage = errorMessage;
    }
    
    this.debug(`Span ended: ${span.operationName}`, {
      duration: span.duration,
      status: span.status,
      ...tags
    }, {
      traceId,
      spanId,
      duration: span.duration,
      tags: ['span', 'end']
    });
  }

  // Add log to trace span
  private addLogToTrace(traceId: string, spanId: string | undefined, logEntry: LogEntry): void {
    const context = this.traces.get(traceId);
    if (!context || !spanId) return;
    
    const span = context.spans.get(spanId);
    if (span) {
      span.logs.push(logEntry);
    }
  }

  // Database operation tracking
  trackDatabaseOperation(
    operation: string,
    table: string,
    traceId?: string,
    parentSpanId?: string
  ) {
    const spanId = traceId ? this.startSpan(traceId, `db.${operation}`, {
      'db.operation': operation,
      'db.table': table,
      'db.type': 'postgresql'
    }, parentSpanId).spanId : undefined;
    
    return {
      success: (duration: number, rowCount?: number) => {
        this.info(`Database ${operation} on ${table} succeeded`, {
          operation,
          table,
          duration,
          rowCount
        }, {
          traceId,
          spanId,
          duration,
          tags: ['database', 'success']
        });
        
        if (traceId && spanId) {
          this.endSpan(traceId, spanId, {
            'db.rows_affected': rowCount,
            'db.duration_ms': duration
          });
        }
      },
      error: (error: Error, duration: number) => {
        this.error(`Database ${operation} on ${table} failed`, error, {
          operation,
          table,
          duration
        }, {
          traceId,
          spanId,
          duration,
          tags: ['database', 'error']
        });
        
        if (traceId && spanId) {
          this.endSpan(traceId, spanId, {
            'db.error': true,
            'db.duration_ms': duration
          }, error.message);
        }
      }
    };
  }

  // External service call tracking
  trackExternalServiceCall(
    serviceName: string,
    endpoint: string,
    traceId?: string,
    parentSpanId?: string
  ) {
    const spanId = traceId ? this.startSpan(traceId, `external.${serviceName}`, {
      'service.name': serviceName,
      'service.endpoint': endpoint,
      'service.type': 'http'
    }, parentSpanId).spanId : undefined;
    
    return {
      success: (duration: number, responseCode: number, responseSize?: number) => {
        this.info(`External service call to ${serviceName} succeeded`, {
          serviceName,
          endpoint,
          duration,
          responseCode,
          responseSize
        }, {
          traceId,
          spanId,
          duration,
          tags: ['external_service', 'success']
        });
        
        if (traceId && spanId) {
          this.endSpan(traceId, spanId, {
            'http.status_code': responseCode,
            'http.response_size': responseSize,
            'service.duration_ms': duration
          });
        }
      },
      error: (error: Error, duration: number, responseCode?: number) => {
        this.error(`External service call to ${serviceName} failed`, error, {
          serviceName,
          endpoint,
          duration,
          responseCode
        }, {
          traceId,
          spanId,
          duration,
          tags: ['external_service', 'error']
        });
        
        if (traceId && spanId) {
          this.endSpan(traceId, spanId, {
            'http.status_code': responseCode,
            'service.error': true,
            'service.duration_ms': duration
          }, error.message);
        }
      }
    };
  }

  // Business operation tracking
  trackBusinessOperation(
    operation: string,
    category: string,
    traceId?: string,
    parentSpanId?: string
  ) {
    const spanId = traceId ? this.startSpan(traceId, `business.${operation}`, {
      'business.operation': operation,
      'business.category': category
    }, parentSpanId).spanId : undefined;
    
    return {
      success: (duration: number, metadata: Record<string, any> = {}) => {
        this.info(`Business operation ${operation} completed successfully`, {
          operation,
          category,
          duration,
          ...metadata
        }, {
          traceId,
          spanId,
          duration,
          tags: ['business', 'success']
        });
        
        if (traceId && spanId) {
          this.endSpan(traceId, spanId, {
            'business.success': true,
            'business.duration_ms': duration,
            ...metadata
          });
        }
      },
      error: (error: Error, duration: number, metadata: Record<string, any> = {}) => {
        this.error(`Business operation ${operation} failed`, error, {
          operation,
          category,
          duration,
          ...metadata
        }, {
          traceId,
          spanId,
          duration,
          tags: ['business', 'error']
        });
        
        if (traceId && spanId) {
          this.endSpan(traceId, spanId, {
            'business.success': false,
            'business.duration_ms': duration,
            ...metadata
          }, error.message);
        }
      }
    };
  }

  // Log search and aggregation
  searchLogs(query: LogSearchQuery): LogEntry[] {
    let filteredLogs = [...this.logs];
    
    if (query.level) {
      filteredLogs = filteredLogs.filter(log => log.level === query.level);
    }
    
    if (query.service) {
      filteredLogs = filteredLogs.filter(log => log.service === query.service);
    }
    
    if (query.traceId) {
      filteredLogs = filteredLogs.filter(log => log.traceId === query.traceId);
    }
    
    if (query.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === query.userId);
    }
    
    if (query.timeRange) {
      filteredLogs = filteredLogs.filter(log => {
        const logTime = new Date(log.timestamp);
        return logTime >= query.timeRange!.start && logTime <= query.timeRange!.end;
      });
    }
    
    if (query.message) {
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(query.message!.toLowerCase())
      );
    }
    
    if (query.tags && query.tags.length > 0) {
      filteredLogs = filteredLogs.filter(log => 
        query.tags!.some(tag => log.tags.includes(tag))
      );
    }
    
    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return filteredLogs.slice(0, query.limit || 100);
  }

  // Get trace details
  getTrace(traceId: string): RequestContext | null {
    return this.traces.get(traceId) || null;
  }

  // Get recent traces
  getRecentTraces(limit: number = 50): RequestContext[] {
    const traces = Array.from(this.traces.values());
    traces.sort((a, b) => b.startTime - a.startTime);
    return traces.slice(0, limit);
  }

  // Logging metrics
  getLoggingMetrics(): LoggingMetrics {
    return { ...this.metrics };
  }

  // Performance metrics for logs
  private updateMetrics(logEntry: LogEntry): void {
    this.metrics.totalLogs++;
    this.metrics.logsByLevel[logEntry.level]++;
    
    // Update error rate
    const errorLogs = this.metrics.logsByLevel.error + this.metrics.logsByLevel.critical;
    this.metrics.errorRate = this.metrics.totalLogs > 0 ? 
      (errorLogs / this.metrics.totalLogs) * 100 : 0;
    
    // Estimate log size
    const logSize = JSON.stringify(logEntry).length;
    this.metrics.averageLogSize = 
      (this.metrics.averageLogSize * (this.metrics.totalLogs - 1) + logSize) / this.metrics.totalLogs;
  }

  // Console output with proper formatting
  private outputLog(logEntry: LogEntry): void {
    const emoji = this.getLogEmoji(logEntry.level);
    const colorCode = this.getLogColor(logEntry.level);
    
    const contextStr = [
      logEntry.traceId && `trace:${logEntry.traceId.slice(0, 8)}`,
      logEntry.userId && `user:${logEntry.userId}`,
      logEntry.duration && `${logEntry.duration.toFixed(2)}ms`
    ].filter(Boolean).join(' | ');
    
    const tagsStr = logEntry.tags.length > 0 ? ` [${logEntry.tags.join(', ')}]` : '';
    
    console.log(`${colorCode}${emoji} ${logEntry.timestamp} [${logEntry.level.toUpperCase()}] ${logEntry.message}${tagsStr}\x1b[0m`);
    
    if (contextStr) {
      console.log(`${colorCode}    Context: ${contextStr}\x1b[0m`);
    }
    
    if (Object.keys(logEntry.metadata).length > 0) {
      console.log(`${colorCode}    Metadata:`, JSON.stringify(logEntry.metadata, null, 2), '\x1b[0m');
    }
  }

  private getLogEmoji(level: LogLevel): string {
    switch (level) {
      case 'debug': return '🔍';
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      case 'critical': return '🚨';
      default: return '📝';
    }
  }

  private getLogColor(level: LogLevel): string {
    switch (level) {
      case 'debug': return '\x1b[36m'; // cyan
      case 'info': return '\x1b[32m';  // green
      case 'warn': return '\x1b[33m';  // yellow
      case 'error': return '\x1b[31m'; // red
      case 'critical': return '\x1b[41m'; // red background
      default: return '\x1b[0m'; // reset
    }
  }

  // Log cleanup
  private startLogCleanup(): void {
    setInterval(() => {
      this.trimLogs();
      this.cleanupOldTraces();
    }, 60000); // Every minute
  }

  private trimLogs(): void {
    if (this.logs.length > this.maxLogsInMemory) {
      const removed = this.logs.length - this.maxLogsInMemory;
      this.logs = this.logs.slice(-this.maxLogsInMemory);
      this.debug(`Trimmed ${removed} old log entries`, { 
        remainingLogs: this.logs.length 
      }, { tags: ['system', 'cleanup'] });
    }
  }

  private cleanupOldTraces(): void {
    const cutoff = Date.now() - 1800000; // 30 minutes
    let cleaned = 0;
    
    this.traces.forEach((context, traceId) => {
      if (context.startTime < cutoff) {
        this.traces.delete(traceId);
        cleaned++;
      }
    });
    
    if (cleaned > 0) {
      this.debug(`Cleaned up ${cleaned} old traces`, {
        remainingTraces: this.traces.size
      }, { tags: ['system', 'cleanup'] });
    }
  }

  // Destroy service
  destroy(): void {
    this.logs = [];
    this.traces.clear();
    console.log('📝 Enhanced Logging Service destroyed');
  }
}

// Global enhanced logging instance
export const loggingService = new EnhancedLoggingService();

// Export types
export type {
  LogEntry,
  TraceSpan,
  RequestContext,
  LogSearchQuery,
  LoggingMetrics
};

export default loggingService;