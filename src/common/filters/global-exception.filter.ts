import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ILoggerService } from '../interfaces/logger.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly appLogger?: ILoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.getStatus(exception);
    const errorResponse = this.buildErrorResponse(exception, request);

    // Log the error
    this.logError(exception, request, status);

    response.status(status).json(errorResponse);
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private buildErrorResponse(exception: unknown, request: Request) {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      return {
        ok: false,
        error: {
          statusCode: exception.getStatus(),
          message:
            typeof response === 'string' ? response : (response as any).message,
          path,
          method,
          timestamp,
          details: typeof response === 'object' ? response : undefined,
        },
      };
    }

    // Unknown error
    return {
      ok: false,
      error: {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        path,
        method,
        timestamp,
      },
    };
  }

  private logError(exception: unknown, request: Request, status: number): void {
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'unknown';

    const errorContext = {
      method,
      url,
      ip,
      userAgent,
      status,
      timestamp: new Date().toISOString(),
    };

    if (exception instanceof HttpException) {
      this.logger.error(
        `HTTP Exception: ${exception.message}`,
        errorContext,
        exception.stack,
      );

      if (this.appLogger) {
        this.appLogger.error(`HTTP Exception: ${exception.message}`, {
          context: errorContext,
          error: exception,
        });
      }
    } else {
      // Unknown error
      const error = exception as Error;
      this.logger.error(
        `Unknown error: ${error.message || 'Unknown error occurred'}`,
        errorContext,
        error.stack,
      );

      if (this.appLogger) {
        this.appLogger.error(
          `Unknown error: ${error.message || 'Unknown error occurred'}`,
          {
            context: errorContext,
            error,
          },
        );
      }
    }
  }
}
