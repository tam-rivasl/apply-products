import { LoggerService } from '../services/logger.service';

export interface LogMethodOptions {
  /**
   * Custom operation name. If not provided, uses method name
   */
  operation?: string;
  
  /**
   * Log level for the operation start/complete messages
   * @default 'debug'
   */
  level?: 'log' | 'debug' | 'verbose';
  
  /**
   * Whether to log method arguments
   * @default false
   */
  logArgs?: boolean;
  
  /**
   * Whether to log method return value
   * @default false
   */
  logResult?: boolean;
  
  /**
   * Whether to log errors
   * @default true
   */
  logErrors?: boolean;
  
  /**
   * Custom context to include in logs
   */
  context?: Record<string, any>;
  
  /**
   * Whether to include execution time
   * @default true
   */
  includeDuration?: boolean;
  
  /**
   * Custom error handler
   */
  onError?: (error: Error, methodName: string, args: any[]) => void;
}

/**
 * Decorator to automatically log method execution
 * 
 * @example
 * ```typescript
 * @LogMethod({ operation: 'user.create', logArgs: true })
 * async createUser(userData: CreateUserDto) {
 *   // method implementation
 * }
 * ```
 */
export function LogMethod(options: LogMethodOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const {
      operation = propertyName,
      level = 'debug',
      logArgs = false,
      logResult = false,
      logErrors = true,
      context = {},
      includeDuration = true,
      onError,
    } = options;

    descriptor.value = async function (...args: any[]) {
      // Try to get logger from the service instance, or create a new one
      let logger = this['logger'] || this['appLogger'];
      if (!logger) {
        // Fallback: create a new logger instance
        const { LoggerService } = require('../services/logger.service');
        logger = new LoggerService();
      }
      
      const startTime = Date.now();
      const traceId = Math.random().toString(36).substring(2, 15);

      // Log method start
      logger[level](`🚀 Starting ${operation}`, {
        operation,
        context: {
          ...context,
          method: propertyName,
          className: target.constructor.name,
          ...(logArgs && { args: args.length > 0 ? args : undefined }),
        },
        traceId,
      });

      try {
        // Execute the original method
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;

        // Log method completion
        logger[level](`✅ Completed ${operation}`, {
          operation,
          duration: includeDuration ? duration : undefined,
          context: {
            ...context,
            method: propertyName,
            className: target.constructor.name,
            ...(logResult && { result }),
          },
          traceId,
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        if (logErrors) {
          // Log method failure
          logger.error(`❌ Failed ${operation}`, {
            operation,
            error: error as Error,
            duration: includeDuration ? duration : undefined,
            context: {
              ...context,
              method: propertyName,
              className: target.constructor.name,
              ...(logArgs && { args: args.length > 0 ? args : undefined }),
            },
            traceId,
          });
        }

        // Call custom error handler if provided
        if (onError) {
          onError(error as Error, propertyName, args);
        }

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator for database operations with automatic logging
 * 
 * @example
 * ```typescript
 * @LogDbOperation('users')
 * async findById(id: string) {
 *   // database operation
 * }
 * ```
 */
export function LogDbOperation(table: string, options: Omit<LogMethodOptions, 'operation'> = {}) {
  return LogMethod({
    ...options,
    operation: `db.${table}`,
    level: 'debug',
    logArgs: true,
    logResult: false,
    context: { table },
  });
}

/**
 * Decorator for external API calls with automatic logging
 * 
 * @example
 * ```typescript
 * @LogApiCall('contentful')
 * async fetchProducts() {
 *   // API call
 * }
 * ```
 */
export function LogApiCall(service: string, options: Omit<LogMethodOptions, 'operation'> = {}) {
  return LogMethod({
    ...options,
    operation: `api.${service}`,
    level: 'debug',
    logArgs: true,
    logResult: false,
    context: { service },
  });
}

/**
 * Decorator for business operations with automatic logging
 * 
 * @example
 * ```typescript
 * @LogBusinessOperation('user.registration')
 * async registerUser(userData: CreateUserDto) {
 *   // business logic
 * }
 * ```
 */
export function LogBusinessOperation(operation: string, options: Omit<LogMethodOptions, 'operation'> = {}) {
  return LogMethod({
    ...options,
    operation,
    level: 'log',
    logArgs: true,
    logResult: true,
    context: { type: 'business' },
  });
}

/**
 * Decorator for security-sensitive operations
 * 
 * @example
 * ```typescript
 * @LogSecurityOperation('auth.login')
 * async login(credentials: LoginDto) {
 *   // authentication logic
 * }
 * ```
 */
export function LogSecurityOperation(operation: string, options: Omit<LogMethodOptions, 'operation'> = {}) {
  return LogMethod({
    ...options,
    operation,
    level: 'log',
    logArgs: false, // Never log sensitive data
    logResult: false,
    context: { type: 'security' },
  });
}
