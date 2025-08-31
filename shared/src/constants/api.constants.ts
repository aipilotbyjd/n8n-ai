// API Versioning
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
} as const;

// Content Types
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
  TEXT_PLAIN: 'text/plain',
  TEXT_HTML: 'text/html',
  APPLICATION_XML: 'application/xml',
  APPLICATION_PDF: 'application/pdf',
} as const;

// Headers
export const HEADERS = {
  AUTHORIZATION: 'Authorization',
  CONTENT_TYPE: 'Content-Type',
  ACCEPT: 'Accept',
  USER_AGENT: 'User-Agent',
  X_REQUEST_ID: 'X-Request-ID',
  X_CORRELATION_ID: 'X-Correlation-ID',
  X_TENANT_ID: 'X-Tenant-ID',
  X_USER_ID: 'X-User-ID',
  X_API_KEY: 'X-API-Key',
  X_FORWARDED_FOR: 'X-Forwarded-For',
  X_REAL_IP: 'X-Real-IP',
  X_FORWARDED_PROTO: 'X-Forwarded-Proto',
  X_FORWARDED_HOST: 'X-Forwarded-Host',
  CACHE_CONTROL: 'Cache-Control',
  ETAG: 'ETag',
  LAST_MODIFIED: 'Last-Modified',
  IF_NONE_MATCH: 'If-None-Match',
  IF_MODIFIED_SINCE: 'If-Modified-Since',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  DEFAULT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  DEFAULT_MAX_REQUESTS: 100,
  AUTH_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  AUTH_MAX_ATTEMPTS: 5,
  API_WINDOW_MS: 60 * 1000, // 1 minute
  API_MAX_REQUESTS: 60,
} as const;

// Caching
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
  PERMANENT: 0, // No expiration
} as const;

// Response Formats
export const RESPONSE_FORMATS = {
  JSON: 'json',
  XML: 'xml',
  CSV: 'csv',
  PDF: 'pdf',
} as const;

// API Endpoints
export const ENDPOINTS = {
  // Health
  HEALTH: '/health',
  READINESS: '/ready',
  LIVENESS: '/live',
  
  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_REGISTER: '/auth/register',
  AUTH_FORGOT_PASSWORD: '/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/auth/reset-password',
  AUTH_VERIFY_EMAIL: '/auth/verify-email',
  
  // Users
  USERS: '/users',
  USERS_PROFILE: '/users/profile',
  USERS_PREFERENCES: '/users/preferences',
  
  // Workflows
  WORKFLOWS: '/workflows',
  WORKFLOWS_EXECUTE: '/workflows/:id/execute',
  WORKFLOWS_ACTIVATE: '/workflows/:id/activate',
  WORKFLOWS_DEACTIVATE: '/workflows/:id/deactivate',
  WORKFLOWS_DUPLICATE: '/workflows/:id/duplicate',
  WORKFLOWS_EXPORT: '/workflows/:id/export',
  WORKFLOWS_IMPORT: '/workflows/import',
  
  // Executions
  EXECUTIONS: '/executions',
  EXECUTIONS_CANCEL: '/executions/:id/cancel',
  EXECUTIONS_RETRY: '/executions/:id/retry',
  EXECUTIONS_LOGS: '/executions/:id/logs',
  
  // Nodes
  NODES: '/nodes',
  NODES_CATEGORIES: '/nodes/categories',
  NODES_TYPES: '/nodes/types',
  
  // Credentials
  CREDENTIALS: '/credentials',
  CREDENTIALS_TYPES: '/credentials/types',
  CREDENTIALS_TEST: '/credentials/:id/test',
  
  // Webhooks
  WEBHOOKS: '/webhooks',
  WEBHOOKS_TRIGGER: '/webhooks/:id/trigger',
  
  // Schedules
  SCHEDULES: '/schedules',
  SCHEDULES_ENABLE: '/schedules/:id/enable',
  SCHEDULES_DISABLE: '/schedules/:id/disable',
  
  // Analytics
  ANALYTICS: '/analytics',
  ANALYTICS_WORKFLOWS: '/analytics/workflows',
  ANALYTICS_EXECUTIONS: '/analytics/executions',
  ANALYTICS_PERFORMANCE: '/analytics/performance',
  
  // Monitoring
  MONITORING: '/monitoring',
  MONITORING_METRICS: '/monitoring/metrics',
  MONITORING_LOGS: '/monitoring/logs',
  MONITORING_ALERTS: '/monitoring/alerts',
  
  // Admin
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_TENANTS: '/admin/tenants',
  ADMIN_SYSTEM: '/admin/system',
} as const;

// Query Parameters
export const QUERY_PARAMS = {
  PAGE: 'page',
  LIMIT: 'limit',
  SORT: 'sort',
  ORDER: 'order',
  SEARCH: 'search',
  FILTER: 'filter',
  INCLUDE: 'include',
  EXCLUDE: 'exclude',
  FIELDS: 'fields',
  EXPAND: 'expand',
  CURSOR: 'cursor',
  BEFORE: 'before',
  AFTER: 'after',
} as const;

// Sort Orders
export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  VALIDATION_FAILED: 'Validation failed',
  RESOURCE_NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service unavailable',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  INVALID_TOKEN: 'Invalid token',
  TOKEN_EXPIRED: 'Token expired',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  RESOURCE_CONFLICT: 'Resource conflict',
  INVALID_INPUT: 'Invalid input',
  MISSING_REQUIRED_FIELD: 'Missing required field',
  INVALID_FORMAT: 'Invalid format',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  ACTIVATED: 'Resource activated successfully',
  DEACTIVATED: 'Resource deactivated successfully',
  EXECUTED: 'Execution started successfully',
  CANCELLED: 'Execution cancelled successfully',
  RETRIED: 'Execution retried successfully',
} as const;