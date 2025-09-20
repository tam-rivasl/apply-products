import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ILoggerService } from '../interfaces/logger.interface';

@Injectable()
export class ErrorLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorLoggingInterceptor.name);

  constructor(private readonly appLogger?: ILoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        const request = context.switchToHttp().getRequest();
        const { method, url, ip, headers } = request;
        const userAgent = headers['user-agent'] || 'unknown';

        const errorContext = {
          method,
          url,
          ip,
          userAgent,
          timestamp: new Date().toISOString(),
        };

        // Log with NestJS logger
        this.logger.error(
          `Request failed: ${method} ${url}`,
          {
            ...errorContext,
            error: error.message,
            stack: error.stack,
          },
        );

        // Log with app logger if available
        if (this.appLogger) {
          this.appLogger.error(`Request failed: ${method} ${url}`, {
            context: errorContext,
            error,
          });
        }

        return throwError(() => error);
      }),
    );
  }
}
