import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const correlationId = headers['x-correlation-id'] || headers['x-request-id'] || this.generateCorrelationId();
    const startTime = Date.now();

    // Log incoming request
    this.logger.log(
      `Incoming ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent} - Correlation-ID: ${correlationId}`,
      'HTTP Request'
    );

    return next.handle().pipe(
      tap((data) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const statusCode = response.statusCode;

        // Log successful response
        this.logger.log(
          `Completed ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms - Correlation-ID: ${correlationId}`,
          'HTTP Response'
        );

        // Log slow requests
        if (duration > 1000) {
          this.logger.warn(
            `Slow request detected: ${method} ${url} took ${duration}ms - Correlation-ID: ${correlationId}`,
            'Performance Warning'
          );
        }
      }),
      catchError((error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const statusCode = error.status || 500;

        // Log error response
        this.logger.error(
          `Failed ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms - Error: ${error.message} - Correlation-ID: ${correlationId}`,
          error.stack,
          'HTTP Error'
        );

        throw error;
      }),
    );
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
