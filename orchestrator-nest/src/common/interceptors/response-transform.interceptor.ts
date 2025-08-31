import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta: {
    timestamp: string;
    correlationId: string;
    version: string;
    path: string;
    method: string;
  };
}

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const correlationId = request.headers['x-correlation-id'] || request.headers['x-request-id'] || 'unknown';

    return next.handle().pipe(
      map((data) => {
        // If response is already formatted, return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return {
            ...data,
            meta: {
              ...data.meta,
              correlationId,
              timestamp: new Date().toISOString(),
              path: request.url,
              method: request.method,
            },
          };
        }

        // Transform raw data into standard format
        const response: ApiResponse<T> = {
          success: true,
          data,
          meta: {
            timestamp: new Date().toISOString(),
            correlationId,
            version: process.env.APP_VERSION || '1.0.0',
            path: request.url,
            method: request.method,
          },
        };

        // Handle pagination data
        if (data && typeof data === 'object' && 'pagination' in data) {
          response.pagination = data.pagination;
          response.data = data.data;
        }

        return response;
      }),
    );
  }
}