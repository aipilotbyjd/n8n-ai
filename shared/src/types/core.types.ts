import { z } from 'zod';

// Base Entity Interface
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Tenant Interface
export interface Tenant extends BaseEntity {
  name: string;
  slug: string;
  domain?: string;
  settings: TenantSettings;
  status: TenantStatus;
}

export interface TenantSettings {
  timezone: string;
  locale: string;
  features: string[];
  limits: TenantLimits;
}

export interface TenantLimits {
  workflows: number;
  executions: number;
  users: number;
  storage: number;
}

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
}

// User Interface
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  tenantId: string;
  role: UserRole;
  status: UserStatus;
  preferences: UserPreferences;
  lastLoginAt?: Date;
}

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  EXECUTOR = 'executor',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationSettings;
  timezone: string;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  webhook: boolean;
  slack: boolean;
}

// Pagination Types
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filter Types
export interface FilterOptions {
  search?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
  [key: string]: unknown;
}

// Audit Types
export interface AuditLog extends BaseEntity {
  userId: string;
  tenantId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// Validation Schemas
export const PaginationOptionsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
});

export const FilterOptionsSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  tags: z.array(z.string()).optional(),
});

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type Nullable<T> = T | null;

export type AsyncResult<T, E = Error> = Promise<{ data?: T; error?: E }>;

// Environment Types
export type Environment = 'development' | 'staging' | 'production' | 'test';

export interface EnvironmentConfig {
  nodeEnv: Environment;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
}