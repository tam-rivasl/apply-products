import { Injectable, LoggerService as NestLoggerService, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { redact, safeStringify } from '../utils/logsafe';
import { ILoggerService, LogContext, LogEntry, LogOptions } from '../interfaces/logger.interface';
import { LOG_LEVELS, LOG_OPERATIONS, SECURITY_SEVERITY, CACHE_OPERATIONS } from '../constants';

@Injectable()
export class LoggerService implements NestLoggerService, ILoggerService {
  private readonly logger: NestLoggerService;
  private readonly isDevelopment: boolean;
  private readonly logLevel: LogLevel;

  constructor(private readonly configService: ConfigService) {
    this.logger = new (require('@nestjs/common').Logger)();
    this.isDevelopment = this.configService.get('NODE_ENV') === 'development';
    this.logLevel = this.configService.get('LOG_LEVEL') || LOG_LEVELS.LOG;
  }

  /**
   * Log a message with INFO level
   */
  log(message: string, options?: LogOptions): void {
    this.writeLog(LOG_LEVELS.LOG as LogLevel, message, options);
  }

  /**
   * Log a message with ERROR level
   */
  error(message: string, options?: LogOptions): void {
    this.writeLog(LOG_LEVELS.ERROR as LogLevel, message, options);
  }

  /**
   * Log a message with WARN level
   */
  warn(message: string, options?: LogOptions): void {
    this.writeLog(LOG_LEVELS.WARN as LogLevel, message, options);
  }

  /**
   * Log a message with DEBUG level
   */
  debug(message: string, options?: LogOptions): void {
    this.writeLog(LOG_LEVELS.DEBUG as LogLevel, message, options);
  }

  /**
   * Log a message with VERBOSE level
   */
  verbose(message: string, options?: LogOptions): void {
    this.writeLog(LOG_LEVELS.VERBOSE as LogLevel, message, options);
  }

  /**
   * Log a message with FATAL level (highest priority)
   */
  fatal(message: string, options?: LogOptions): void {
    this.writeLog(LOG_LEVELS.ERROR as LogLevel, `[FATAL] ${message}`, options);
  }

  /**
   * Log business operation start
   */
  operationStart(operation: string, context?: LogContext, traceId?: string): void {
    this.log(`🚀 Starting operation: ${operation}`, {
      operation,
      context,
      traceId,
    });
  }

  /**
   * Log business operation completion
   */
  operationComplete(
    operation: string,
    duration: number,
    context?: LogContext,
    traceId?: string,
  ): void {
    this.log(`✅ Operation completed: ${operation}`, {
      operation,
      duration,
      context,
      traceId,
    });
  }

  /**
   * Log business operation failure
   */
  operationFailed(
    operation: string,
    error: Error,
    duration?: number,
    context?: LogContext,
    traceId?: string,
  ): void {
    this.error(`❌ Operation failed: ${operation}`, {
      operation,
      error,
      duration,
      context,
      traceId,
    });
  }

  /**
   * Log database operation
   */
  dbOperation(
    operation: string,
    table: string,
    duration: number,
    context?: LogContext,
  ): void {
    this.debug(`🗄️ DB ${operation} on ${table}`, {
      operation: `${LOG_OPERATIONS.DATABASE}.${operation}`,
      context: { ...context, table, duration },
    });
  }

  /**
   * Log external API call
   */
  apiCall(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: LogContext,
  ): void {
    const level = statusCode >= 400 ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
    this[level](`🌐 API ${method} ${url}`, {
      operation: `${LOG_OPERATIONS.API}.call`,
      context: {
        ...context,
        method,
        url,
        statusCode,
        duration,
      },
    });
  }

  /**
   * Log authentication events
   */
  authEvent(event: string, userId?: string, context?: LogContext): void {
    this.log(`🔐 Auth: ${event}`, {
      operation: LOG_OPERATIONS.AUTH,
      userId,
      context,
    });
  }

  /**
   * Log security events
   */
  securityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext): void {
    const level = severity === SECURITY_SEVERITY.CRITICAL || severity === SECURITY_SEVERITY.HIGH 
      ? LOG_LEVELS.ERROR 
      : LOG_LEVELS.WARN;
    this[level](`🛡️ Security: ${event}`, {
      operation: LOG_OPERATIONS.SECURITY,
      context: { ...context, severity },
    });
  }

  /**
   * Log performance metrics
   */
  performance(metric: string, value: number, unit: string, context?: LogContext): void {
    this.debug(`📊 Performance: ${metric}`, {
      operation: LOG_OPERATIONS.PERFORMANCE,
      context: { ...context, metric, value, unit },
    });
  }

  /**
   * Log data validation issues
   */
  validationError(field: string, value: any, rule: string, context?: LogContext): void {
    this.warn(`⚠️ Validation failed: ${field}`, {
      operation: LOG_OPERATIONS.VALIDATION,
      context: {
        ...context,
        field,
        value: redact(value),
        rule,
      },
    });
  }

  /**
   * Log cache operations
   */
  cacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', key: string, context?: LogContext): void {
    const emoji = operation === CACHE_OPERATIONS.HIT ? '💚' 
      : operation === CACHE_OPERATIONS.MISS ? '💔' 
      : '💾';
    this.debug(`${emoji} Cache ${operation}: ${key}`, {
      operation: LOG_OPERATIONS.CACHE,
      context: { ...context, key, operation },
    });
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): ILoggerService {
    const childLogger = new LoggerService(this.configService);
    childLogger['baseContext'] = { ...this['baseContext'], ...context };
    return childLogger;
  }

  /**
   * Internal method to write logs with consistent formatting
   */
  private writeLog(level: LogLevel, message: string, options?: LogOptions): void {
    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.getContextName(),
      message,
      traceId: options?.traceId || this.generateTraceId(),
      userId: options?.userId,
      operation: options?.operation,
      duration: options?.duration,
    };

    // Add context data (redacted for security)
    if (options?.context) {
      logEntry.data = redact(options.context);
    }

    // Add error information if present
    if (options?.error) {
      logEntry.error = {
        name: options.error.name,
        message: options.error.message,
        stack: this.isDevelopment ? options.error.stack : undefined,
        code: (options.error as any).code,
      };
    }

    // Format and output the log
    const formattedMessage = this.formatLogEntry(logEntry);
    this.logger[level](formattedMessage);
  }

  /**
   * Check if the log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['verbose', 'debug', 'log', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Get the context name for the logger
   */
  private getContextName(): string {
    return this['baseContext']?.service || 'Application';
  }

  /**
   * Generate a simple trace ID
   */
  private generateTraceId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Format log entry for output
   */
  private formatLogEntry(entry: LogEntry): string {
    const parts: string[] = [];

    // Timestamp
    if (this.isDevelopment) {
      parts.push(`[${entry.timestamp}]`);
    }

    // Level
    parts.push(`[${entry.level.toUpperCase()}]`);

    // Context
    parts.push(`[${entry.context}]`);

    // Operation
    if (entry.operation) {
      parts.push(`[${entry.operation}]`);
    }

    // Duration
    if (entry.duration !== undefined) {
      parts.push(`[${entry.duration}ms]`);
    }

    // Trace ID
    if (entry.traceId && this.isDevelopment) {
      parts.push(`[${entry.traceId}]`);
    }

    // User ID
    if (entry.userId) {
      parts.push(`[user:${entry.userId}]`);
    }

    // Message
    parts.push(entry.message);

    // Additional data
    if (entry.data && Object.keys(entry.data).length > 0) {
      parts.push(`| data: ${safeStringify(entry.data)}`);
    }

    // Error details
    if (entry.error) {
      parts.push(`| error: ${entry.error.name}: ${entry.error.message}`);
      if (entry.error.stack && this.isDevelopment) {
        parts.push(`\n${entry.error.stack}`);
      }
    }

    return parts.join(' ');
  }
}
