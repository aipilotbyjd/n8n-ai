import { z } from 'zod';

// Base Error Interface
export interface AppError extends Error {
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
  timestamp: Date;
  correlationId?: string;
  tenantId?: string;
  userId?: string;
}

// Error Codes
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Resource Errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  RESOURCE_DELETED = 'RESOURCE_DELETED',

  // Workflow Errors
  WORKFLOW_NOT_FOUND = 'WORKFLOW_NOT_FOUND',
  WORKFLOW_INVALID = 'WORKFLOW_INVALID',
  WORKFLOW_EXECUTION_FAILED = 'WORKFLOW_EXECUTION_FAILED',
  WORKFLOW_TIMEOUT = 'WORKFLOW_TIMEOUT',
  WORKFLOW_CANCELLED = 'WORKFLOW_CANCELLED',
  NODE_EXECUTION_FAILED = 'NODE_EXECUTION_FAILED',
  NODE_NOT_FOUND = 'NODE_NOT_FOUND',
  NODE_INVALID = 'NODE_INVALID',

  // Database Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  DATABASE_TRANSACTION_ERROR = 'DATABASE_TRANSACTION_ERROR',

  // External Service Errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  EXTERNAL_SERVICE_TIMEOUT = 'EXTERNAL_SERVICE_TIMEOUT',
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXTERNAL_SERVICE_UNAVAILABLE',
  EXTERNAL_SERVICE_RATE_LIMITED = 'EXTERNAL_SERVICE_RATE_LIMITED',

  // Message Queue Errors
  MESSAGE_QUEUE_ERROR = 'MESSAGE_QUEUE_ERROR',
  MESSAGE_QUEUE_CONNECTION_ERROR = 'MESSAGE_QUEUE_CONNECTION_ERROR',
  MESSAGE_QUEUE_PUBLISH_ERROR = 'MESSAGE_QUEUE_PUBLISH_ERROR',
  MESSAGE_QUEUE_CONSUME_ERROR = 'MESSAGE_QUEUE_CONSUME_ERROR',

  // Cache Errors
  CACHE_ERROR = 'CACHE_ERROR',
  CACHE_CONNECTION_ERROR = 'CACHE_CONNECTION_ERROR',
  CACHE_KEY_NOT_FOUND = 'CACHE_KEY_NOT_FOUND',

  // File Storage Errors
  FILE_STORAGE_ERROR = 'FILE_STORAGE_ERROR',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_TYPE_NOT_ALLOWED = 'FILE_TYPE_NOT_ALLOWED',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // System Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  FEATURE_NOT_AVAILABLE = 'FEATURE_NOT_AVAILABLE',

  // Business Logic Errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  TENANT_SUSPENDED = 'TENANT_SUSPENDED',
}

// Error Categories
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  RESOURCE = 'resource',
  WORKFLOW = 'workflow',
  DATABASE = 'database',
  EXTERNAL_SERVICE = 'external_service',
  MESSAGE_QUEUE = 'message_queue',
  CACHE = 'cache',
  FILE_STORAGE = 'file_storage',
  RATE_LIMITING = 'rate_limiting',
  SYSTEM = 'system',
  BUSINESS = 'business',
}

// Error Severity Levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error Context
export interface ErrorContext {
  correlationId?: string;
  tenantId?: string;
  userId?: string;
  requestId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  endpoint?: string;
  method?: string;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  stack?: string;
  timestamp: Date;
}

// Structured Error Response
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    category: ErrorCategory;
    severity: ErrorSeverity;
    timestamp: string;
    correlationId?: string;
    requestId?: string;
    helpUrl?: string;
    retryAfter?: number;
  };
  meta?: {
    version: string;
    environment: string;
    service: string;
  };
}

// Custom Error Classes
export class BaseAppError extends Error implements AppError {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: Date;
  public readonly correlationId?: string;
  public readonly tenantId?: string;
  public readonly userId?: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    category: ErrorCategory = ErrorCategory.SYSTEM,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    details?: Record<string, unknown>,
    context?: Partial<ErrorContext>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
    this.category = category;
    this.severity = severity;
    
    if (context) {
      this.correlationId = context.correlationId;
      this.tenantId = context.tenantId;
      this.userId = context.userId;
    }

    Error.captureStackTrace(this, this.constructor);
  }

  toResponse(): ErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        category: this.category,
        severity: this.severity,
        timestamp: this.timestamp.toISOString(),
        correlationId: this.correlationId,
        requestId: this.correlationId, // For backward compatibility
      },
    };
  }
}

// Specific Error Classes
export class ValidationError extends BaseAppError {
  constructor(message: string, details?: Record<string, unknown>, context?: Partial<ErrorContext>) {
    super(
      ErrorCode.VALIDATION_ERROR,
      message,
      400,
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      details,
      context,
    );
  }
}

export class AuthenticationError extends BaseAppError {
  constructor(message: string = 'Authentication required', context?: Partial<ErrorContext>) {
    super(
      ErrorCode.UNAUTHORIZED,
      message,
      401,
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.MEDIUM,
      undefined,
      context,
    );
  }
}

export class AuthorizationError extends BaseAppError {
  constructor(message: string = 'Insufficient permissions', context?: Partial<ErrorContext>) {
    super(
      ErrorCode.FORBIDDEN,
      message,
      403,
      ErrorCategory.AUTHORIZATION,
      ErrorSeverity.MEDIUM,
      undefined,
      context,
    );
  }
}

export class ResourceNotFoundError extends BaseAppError {
  constructor(resource: string, id?: string, context?: Partial<ErrorContext>) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(
      ErrorCode.RESOURCE_NOT_FOUND,
      message,
      404,
      ErrorCategory.RESOURCE,
      ErrorSeverity.LOW,
      { resource, id },
      context,
    );
  }
}

export class ResourceConflictError extends BaseAppError {
  constructor(message: string, details?: Record<string, unknown>, context?: Partial<ErrorContext>) {
    super(
      ErrorCode.RESOURCE_CONFLICT,
      message,
      409,
      ErrorCategory.RESOURCE,
      ErrorSeverity.MEDIUM,
      details,
      context,
    );
  }
}

export class WorkflowError extends BaseAppError {
  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>,
    context?: Partial<ErrorContext>,
  ) {
    super(code, message, 400, ErrorCategory.WORKFLOW, ErrorSeverity.MEDIUM, details, context);
  }
}

export class DatabaseError extends BaseAppError {
  constructor(message: string, details?: Record<string, unknown>, context?: Partial<ErrorContext>) {
    super(
      ErrorCode.DATABASE_ERROR,
      message,
      500,
      ErrorCategory.DATABASE,
      ErrorSeverity.HIGH,
      details,
      context,
    );
  }
}

export class ExternalServiceError extends BaseAppError {
  constructor(
    service: string,
    message: string,
    details?: Record<string, unknown>,
    context?: Partial<ErrorContext>,
  ) {
    super(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      message,
      502,
      ErrorCategory.EXTERNAL_SERVICE,
      ErrorSeverity.HIGH,
      { service, ...details },
      context,
    );
  }
}

export class RateLimitError extends BaseAppError {
  constructor(retryAfter?: number, context?: Partial<ErrorContext>) {
    super(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded',
      429,
      ErrorCategory.RATE_LIMITING,
      ErrorSeverity.MEDIUM,
      { retryAfter },
      context,
    );
  }
}

export class BusinessRuleError extends BaseAppError {
  constructor(message: string, details?: Record<string, unknown>, context?: Partial<ErrorContext>) {
    super(
      ErrorCode.BUSINESS_RULE_VIOLATION,
      message,
      400,
      ErrorCategory.BUSINESS,
      ErrorSeverity.MEDIUM,
      details,
      context,
    );
  }
}

// Error Factory
export class ErrorFactory {
  static createValidationError(message: string, details?: Record<string, unknown>, context?: Partial<ErrorContext>): ValidationError {
    return new ValidationError(message, details, context);
  }

  static createAuthenticationError(message?: string, context?: Partial<ErrorContext>): AuthenticationError {
    return new AuthenticationError(message, context);
  }

  static createAuthorizationError(message?: string, context?: Partial<ErrorContext>): AuthorizationError {
    return new AuthorizationError(message, context);
  }

  static createResourceNotFoundError(resource: string, id?: string, context?: Partial<ErrorContext>): ResourceNotFoundError {
    return new ResourceNotFoundError(resource, id, context);
  }

  static createResourceConflictError(message: string, details?: Record<string, unknown>, context?: Partial<ErrorContext>): ResourceConflictError {
    return new ResourceConflictError(message, details, context);
  }

  static createWorkflowError(code: string, message: string, details?: Record<string, unknown>, context?: Partial<ErrorContext>): WorkflowError {
    return new WorkflowError(code, message, details, context);
  }

  static createDatabaseError(message: string, details?: Record<string, unknown>, context?: Partial<ErrorContext>): DatabaseError {
    return new DatabaseError(message, details, context);
  }

  static createExternalServiceError(service: string, message: string, details?: Record<string, unknown>, context?: Partial<ErrorContext>): ExternalServiceError {
    return new ExternalServiceError(service, message, details, context);
  }

  static createRateLimitError(retryAfter?: number, context?: Partial<ErrorContext>): RateLimitError {
    return new RateLimitError(retryAfter, context);
  }

  static createBusinessRuleError(message: string, details?: Record<string, unknown>, context?: Partial<ErrorContext>): BusinessRuleError {
    return new BusinessRuleError(message, details, context);
  }
}

// Error Validation Schema
export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
    category: z.nativeEnum(ErrorCategory),
    severity: z.nativeEnum(ErrorSeverity),
    timestamp: z.string(),
    correlationId: z.string().optional(),
    requestId: z.string().optional(),
    helpUrl: z.string().url().optional(),
    retryAfter: z.number().optional(),
  }),
  meta: z.object({
    version: z.string(),
    environment: z.string(),
    service: z.string(),
  }).optional(),
});

// Error Utilities
export const isAppError = (error: unknown): error is AppError => {
  return error instanceof BaseAppError;
};

export const isValidationError = (error: unknown): error is ValidationError => {
  return error instanceof ValidationError;
};

export const isAuthenticationError = (error: unknown): error is AuthenticationError => {
  return error instanceof AuthenticationError;
};

export const isAuthorizationError = (error: unknown): error is AuthorizationError => {
  return error instanceof AuthorizationError;
};

export const isResourceNotFoundError = (error: unknown): error is ResourceNotFoundError => {
  return error instanceof ResourceNotFoundError;
};

export const isWorkflowError = (error: unknown): error is WorkflowError => {
  return error instanceof WorkflowError;
};

export const isDatabaseError = (error: unknown): error is DatabaseError => {
  return error instanceof DatabaseError;
};

export const isExternalServiceError = (error: unknown): error is ExternalServiceError => {
  return error instanceof ExternalServiceError;
};

export const isRateLimitError = (error: unknown): error is RateLimitError => {
  return error instanceof RateLimitError;
};

export const isBusinessRuleError = (error: unknown): error is BusinessRuleError => {
  return error instanceof BusinessRuleError;
};