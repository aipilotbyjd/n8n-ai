import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { 
  BaseAppError, 
  ErrorFactory, 
  ErrorResponse, 
  ErrorCategory, 
  ErrorSeverity,
  isAppError,
  isValidationError,
  isAuthenticationError,
  isAuthorizationError,
  isResourceNotFoundError,
  isWorkflowError,
  isDatabaseError,
  isExternalServiceError,
  isRateLimitError,
  isBusinessRuleError,
} from '@n8n-work/shared';
import { ZodError } from 'zod';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId = this.getCorrelationId(request);
    const errorResponse = this.handleException(exception, request, correlationId);

    // Log the error
    this.logError(exception, request, correlationId, errorResponse);

    // Send the response
    response.status(errorResponse.error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    response.json(errorResponse);
  }

  private handleException(
    exception: unknown,
    request: Request,
    correlationId: string
  ): ErrorResponse {
    // Handle our custom app errors
    if (isAppError(exception)) {
      return this.handleAppError(exception, request, correlationId);
    }

    // Handle NestJS HTTP exceptions
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception, request, correlationId);
    }

    // Handle Zod validation errors
    if (exception instanceof ZodError) {
      return this.handleZodError(exception, request, correlationId);
    }

    // Handle TypeORM errors
    if (exception instanceof QueryFailedError) {
      return this.handleDatabaseError(exception, request, correlationId);
    }

    if (exception instanceof EntityNotFoundError) {
      return this.handleEntityNotFoundError(exception, request, correlationId);
    }

    // Handle unknown errors
    return this.handleUnknownError(exception, request, correlationId);
  }

  private handleAppError(
    error: BaseAppError,
    request: Request,
    correlationId: string
  ): ErrorResponse {
    const errorResponse: ErrorResponse = {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        category: error.category,
        severity: error.severity,
        timestamp: error.timestamp.toISOString(),
        correlationId: correlationId,
        requestId: correlationId,
      },
      meta: {
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        service: 'orchestrator',
      },
    };

    // Add retry information for rate limit errors
    if (isRateLimitError(error)) {
      errorResponse.error.retryAfter = error.details?.retryAfter as number;
    }

    return errorResponse;
  }

  private handleHttpException(
    exception: HttpException,
    request: Request,
    correlationId: string
  ): ErrorResponse {
    const status = exception.getStatus();
    const response = exception.getResponse() as any;

    let errorCode = 'HTTP_EXCEPTION';
    let category = ErrorCategory.SYSTEM;
    let severity = ErrorSeverity.MEDIUM;

    // Map HTTP status codes to our error categories
    if (status >= 400 && status < 500) {
      category = ErrorCategory.VALIDATION;
      severity = ErrorSeverity.LOW;
      
      if (status === 401) {
        errorCode = 'UNAUTHORIZED';
        category = ErrorCategory.AUTHENTICATION;
      } else if (status === 403) {
        errorCode = 'FORBIDDEN';
        category = ErrorCategory.AUTHORIZATION;
      } else if (status === 404) {
        errorCode = 'RESOURCE_NOT_FOUND';
        category = ErrorCategory.RESOURCE;
      } else if (status === 409) {
        errorCode = 'RESOURCE_CONFLICT';
        category = ErrorCategory.RESOURCE;
      } else if (status === 429) {
        errorCode = 'RATE_LIMIT_EXCEEDED';
        category = ErrorCategory.RATE_LIMITING;
      }
    } else if (status >= 500) {
      category = ErrorCategory.SYSTEM;
      severity = ErrorSeverity.HIGH;
    }

    return {
      error: {
        code: errorCode,
        message: response?.message || exception.message || 'HTTP Exception',
        details: response?.error || response,
        category,
        severity,
        timestamp: new Date().toISOString(),
        correlationId,
        requestId: correlationId,
      },
      meta: {
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        service: 'orchestrator',
      },
    };
  }

  private handleZodError(
    error: ZodError,
    request: Request,
    correlationId: string
  ): ErrorResponse {
    const details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));

    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { errors: details },
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.LOW,
        timestamp: new Date().toISOString(),
        correlationId,
        requestId: correlationId,
      },
      meta: {
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        service: 'orchestrator',
      },
    };
  }

  private handleDatabaseError(
    error: QueryFailedError,
    request: Request,
    correlationId: string
  ): ErrorResponse {
    let message = 'Database operation failed';
    let details = {};

    // Handle specific database errors
    if (error.message.includes('duplicate key')) {
      message = 'Resource already exists';
      details = { constraint: error.message };
    } else if (error.message.includes('foreign key')) {
      message = 'Referenced resource not found';
      details = { constraint: error.message };
    } else if (error.message.includes('not null')) {
      message = 'Required field is missing';
      details = { constraint: error.message };
    }

    return {
      error: {
        code: 'DATABASE_ERROR',
        message,
        details,
        category: ErrorCategory.DATABASE,
        severity: ErrorSeverity.HIGH,
        timestamp: new Date().toISOString(),
        correlationId,
        requestId: correlationId,
      },
      meta: {
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        service: 'orchestrator',
      },
    };
  }

  private handleEntityNotFoundError(
    error: EntityNotFoundError,
    request: Request,
    correlationId: string
  ): ErrorResponse {
    return {
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: 'Resource not found',
        details: { entity: error.message },
        category: ErrorCategory.RESOURCE,
        severity: ErrorSeverity.LOW,
        timestamp: new Date().toISOString(),
        correlationId,
        requestId: correlationId,
      },
      meta: {
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        service: 'orchestrator',
      },
    };
  }

  private handleUnknownError(
    error: unknown,
    request: Request,
    correlationId: string
  ): ErrorResponse {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const stack = error instanceof Error ? error.stack : undefined;

    return {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? { stack } : undefined,
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.CRITICAL,
        timestamp: new Date().toISOString(),
        correlationId,
        requestId: correlationId,
      },
      meta: {
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        service: 'orchestrator',
      },
    };
  }

  private getCorrelationId(request: Request): string {
    return (
      request.headers['x-correlation-id'] as string ||
      request.headers['x-request-id'] as string ||
      `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    );
  }

  private logError(
    exception: unknown,
    request: Request,
    correlationId: string,
    errorResponse: ErrorResponse
  ): void {
    const logContext = {
      correlationId,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      userId: request.headers['x-user-id'],
      tenantId: request.headers['x-tenant-id'],
    };

    const errorDetails = {
      error: errorResponse.error,
      context: logContext,
    };

    // Log based on severity
    switch (errorResponse.error.severity) {
      case ErrorSeverity.LOW:
        this.logger.warn('Request failed with low severity error', errorDetails);
        break;
      case ErrorSeverity.MEDIUM:
        this.logger.error('Request failed with medium severity error', errorDetails);
        break;
      case ErrorSeverity.HIGH:
        this.logger.error('Request failed with high severity error', errorDetails);
        break;
      case ErrorSeverity.CRITICAL:
        this.logger.fatal('Request failed with critical error', errorDetails);
        break;
      default:
        this.logger.error('Request failed', errorDetails);
    }

    // Additional logging for specific error types
    if (isDatabaseError(exception)) {
      this.logger.error('Database error occurred', {
        ...errorDetails,
        originalError: exception,
      });
    }

    if (isExternalServiceError(exception)) {
      this.logger.error('External service error occurred', {
        ...errorDetails,
        originalError: exception,
      });
    }

    if (isWorkflowError(exception)) {
      this.logger.error('Workflow error occurred', {
        ...errorDetails,
        originalError: exception,
      });
    }
  }
}
