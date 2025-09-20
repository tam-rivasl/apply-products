import { LogLevel } from '@nestjs/common';

export interface LogContext {
  [key: string]: any;
}

export interface LogOptions {
  context?: LogContext;
  traceId?: string;
  userId?: string;
  operation?: string;
  duration?: number;
  error?: Error;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: LogContext;
  traceId?: string;
  userId?: string;
  operation?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string | number;
  };
}

export interface ILoggerService {
  log(message: string, options?: LogOptions): void;
  error(message: string, options?: LogOptions): void;
  warn(message: string, options?: LogOptions): void;
  debug(message: string, options?: LogOptions): void;
  verbose(message: string, options?: LogOptions): void;
  fatal(message: string, options?: LogOptions): void;

  // Specialized logging methods
  operationStart(
    operation: string,
    context?: LogContext,
    traceId?: string,
  ): void;
  operationComplete(
    operation: string,
    duration: number,
    context?: LogContext,
    traceId?: string,
  ): void;
  operationFailed(
    operation: string,
    error: Error,
    duration?: number,
    context?: LogContext,
    traceId?: string,
  ): void;
  dbOperation(
    operation: string,
    table: string,
    duration: number,
    context?: LogContext,
  ): void;
  apiCall(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: LogContext,
  ): void;
  authEvent(event: string, userId?: string, context?: LogContext): void;
  securityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: LogContext,
  ): void;
  performance(
    metric: string,
    value: number,
    unit: string,
    context?: LogContext,
  ): void;
  validationError(
    field: string,
    value: any,
    rule: string,
    context?: LogContext,
  ): void;
  cacheOperation(
    operation: 'hit' | 'miss' | 'set' | 'delete',
    key: string,
    context?: LogContext,
  ): void;

  // Child logger
  child(context: LogContext): ILoggerService;
}
