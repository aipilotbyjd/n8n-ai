import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Generate correlation ID if not present
    if (!request.headers['x-correlation-id'] && !request.headers['x-request-id']) {
      const correlationId = this.generateCorrelationId();
      request.headers['x-correlation-id'] = correlationId;
      request.headers['x-request-id'] = correlationId;
    }

    // Ensure both headers are set
    if (request.headers['x-correlation-id'] && !request.headers['x-request-id']) {
      request.headers['x-request-id'] = request.headers['x-correlation-id'];
    }
    if (request.headers['x-request-id'] && !request.headers['x-correlation-id']) {
      request.headers['x-correlation-id'] = request.headers['x-request-id'];
    }

    return next.handle();
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}