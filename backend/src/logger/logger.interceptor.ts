import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoggerService } from './logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly loggerService: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;
    const startTime = Date.now();

    // Log request start
    this.loggerService.debug({
      service: 'system',
      operation: 'HTTP Request',
      userId: user?.id,
      metadata: {
        method,
        url,
        body: this.sanitizeBody(body),
      },
    });

    return next.handle().pipe(
      tap(() => {
        // Log successful response
        const duration = Date.now() - startTime;
        this.loggerService.debug({
          service: 'system',
          operation: 'HTTP Response',
          userId: user?.id,
          metadata: {
            method,
            url,
            statusCode: 200,
            duration,
          },
        });
      }),
      catchError((error) => {
        // Log error response
        const duration = Date.now() - startTime;
        this.loggerService.error(
          {
            service: 'system',
            operation: 'HTTP Error',
            userId: user?.id,
            metadata: {
              method,
              url,
              duration,
            },
          },
          error,
        );
        throw error;
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }
}
