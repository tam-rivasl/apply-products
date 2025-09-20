import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { Request, Response } from 'express';
import { LoggerService } from '../services/logger.service';
import { redact } from '../utils/logsafe';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const { method, originalUrl, url, headers, body, query, params, ip, user } =
      request;
    const userAgent = headers['user-agent'] || 'unknown';
    const traceId = this.generateTraceId();

    // Add trace ID to request for correlation
    (request as any).traceId = traceId;

    const startTime = Date.now();

    // Log request start
    this.logger.log(`🌐 ${method} ${originalUrl || url}`, {
      operation: 'http.request',
      traceId,
      userId: (user as any)?.id || (user as any)?.sub,
      context: {
        method,
        url: originalUrl || url,
        ip,
        userAgent,
        headers: this.sanitizeHeaders(headers),
        params: Object.keys(params).length > 0 ? redact(params) : undefined,
        query: Object.keys(query).length > 0 ? redact(query) : undefined,
        body: this.shouldLogBody(method, originalUrl || url)
          ? redact(body)
          : undefined,
      },
    });

    return next.handle().pipe(
      tap((responseData) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Determine log level based on status code
        const level =
          statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'log';

        this.logger[level](
          `📤 ${method} ${originalUrl || url} - ${statusCode}`,
          {
            operation: 'http.response',
            traceId,
            userId: (user as any)?.id || (user as any)?.sub,
            duration,
            context: {
              method,
              url: originalUrl || url,
              statusCode,
              duration,
              responseSize: this.getResponseSize(responseData),
              ...(this.shouldLogResponse(originalUrl || url) && {
                response: redact(responseData),
              }),
            },
          },
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;

        this.logger.error(
          `💥 ${method} ${originalUrl || url} - ${statusCode}`,
          {
            operation: 'http.error',
            traceId,
            userId: (user as any)?.id || (user as any)?.sub,
            error,
            duration,
            context: {
              method,
              url: originalUrl || url,
              statusCode,
              duration,
              errorType: error.constructor.name,
              errorMessage: error.message,
            },
          },
        );

        throw error;
      }),
    );
  }

  private generateTraceId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };

    // Remove sensitive headers
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
      'x-access-token',
    ];

    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private shouldLogBody(method: string, url: string): boolean {
    // Don't log body for sensitive endpoints
    const sensitiveEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/change-password',
    ];
    const isSensitive = sensitiveEndpoints.some((endpoint) =>
      url.includes(endpoint),
    );

    // Only log body for POST, PUT, PATCH requests and non-sensitive endpoints
    return ['POST', 'PUT', 'PATCH'].includes(method) && !isSensitive;
  }

  private shouldLogResponse(url: string): boolean {
    // Don't log response for sensitive endpoints
    const sensitiveEndpoints = ['/auth/login', '/auth/register'];
    return !sensitiveEndpoints.some((endpoint) => url.includes(endpoint));
  }

  private getResponseSize(responseData: any): number {
    try {
      return JSON.stringify(responseData).length;
    } catch {
      return 0;
    }
  }
}
