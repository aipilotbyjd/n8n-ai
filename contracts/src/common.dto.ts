export interface AuthUser {
  id: string;
  userId: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  permissions: string[];
  tenantId?: string;
  isActive: boolean;
  active?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface WebhookConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  authenticationType?: 'NONE' | 'HEADER' | 'SIGNATURE' | 'BASIC';
  authenticationData?: {
    headerName?: string;
    headerValue?: string;
    secret?: string;
    username?: string;
    password?: string;
  };
  rateLimitPerMinute?: number;
  timeoutMs?: number;
}

export interface WebhookExecution {
  id: string;
  webhookId: string;
  executionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestHeaders: Record<string, string>;
  requestBody?: any;
  responseStatus?: number;
  responseBody?: any;
  error?: string;
  startedAt: Date;
  finishedAt?: Date;
  metadata?: Record<string, any>;
}

export enum AuthenticationType {
  NONE = 'NONE',
  HEADER = 'HEADER',
  SIGNATURE = 'SIGNATURE',
  BASIC = 'BASIC'
}