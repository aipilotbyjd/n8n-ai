import { z } from 'zod';
import { BaseEntity } from './core.types';

// Workflow Types
export interface Workflow extends BaseEntity {
  name: string;
  description?: string;
  tenantId: string;
  createdBy: string;
  status: WorkflowStatus;
  version: number;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  settings: WorkflowSettings;
  tags: string[];
  isActive: boolean;
  executionCount: number;
  lastExecutedAt?: Date;
  nextExecutionAt?: Date;
}

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
  ERROR = 'error',
}

export interface WorkflowSettings {
  timeout: number; // in seconds
  retryOnFailure: boolean;
  maxRetries: number;
  retryDelay: number; // in seconds
  parallelExecution: boolean;
  maxParallelExecutions: number;
  webhookEnabled: boolean;
  webhookUrl?: string;
  webhookMethod: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  webhookHeaders?: Record<string, string>;
  scheduleEnabled: boolean;
  scheduleExpression?: string;
  scheduleTimezone?: string;
  notifications: WorkflowNotificationSettings;
  variables: Record<string, unknown>;
}

export interface WorkflowNotificationSettings {
  onSuccess: boolean;
  onFailure: boolean;
  onTimeout: boolean;
  channels: NotificationChannel[];
  recipients: string[];
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, unknown>;
}

// Node Types
export interface WorkflowNode extends BaseEntity {
  id: string;
  name: string;
  type: string;
  position: NodePosition;
  parameters: Record<string, unknown>;
  credentials?: NodeCredentials;
  settings: NodeSettings;
  metadata: NodeMetadata;
  status: NodeStatus;
  errorMessage?: string;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeCredentials {
  type: string;
  id: string;
  name: string;
}

export interface NodeSettings {
  timeout: number;
  retryOnFailure: boolean;
  maxRetries: number;
  retryDelay: number;
  continueOnError: boolean;
  waitForCompletion: boolean;
  parallelExecution: boolean;
}

export interface NodeMetadata {
  description?: string;
  category: string;
  version: string;
  author: string;
  icon?: string;
  color?: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  documentation?: string;
  examples?: NodeExample[];
}

export interface NodeInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file' | 'date';
  required: boolean;
  default?: unknown;
  description?: string;
  validation?: ValidationRule[];
}

export interface NodeOutput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file' | 'date';
  description?: string;
}

export interface NodeExample {
  title: string;
  description: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value: unknown;
  message: string;
}

export enum NodeStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
  TIMEOUT = 'timeout',
  CANCELLED = 'cancelled',
}

// Connection Types
export interface WorkflowConnection extends BaseEntity {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceOutput: string;
  targetInput: string;
  conditions?: ConnectionCondition[];
  metadata: ConnectionMetadata;
}

export interface ConnectionCondition {
  type: 'expression' | 'value' | 'status';
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'regex';
  value: unknown;
}

export interface ConnectionMetadata {
  label?: string;
  description?: string;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
}

// Workflow Execution Types
export interface WorkflowExecution extends BaseEntity {
  workflowId: string;
  tenantId: string;
  triggeredBy: string;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // in milliseconds
  nodeExecutions: NodeExecution[];
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: ExecutionError;
  metadata: ExecutionMetadata;
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
  PAUSED = 'paused',
}

export interface NodeExecution extends BaseEntity {
  nodeId: string;
  status: NodeStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: ExecutionError;
  retryCount: number;
  metadata: Record<string, unknown>;
}

export interface ExecutionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface ExecutionMetadata {
  trigger: 'manual' | 'webhook' | 'schedule' | 'api';
  source?: string;
  correlationId?: string;
  tags?: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

// Validation Schemas
export const WorkflowNodeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.string().min(1),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  parameters: z.record(z.unknown()),
  credentials: z.object({
    type: z.string(),
    id: z.string().uuid(),
    name: z.string(),
  }).optional(),
  settings: z.object({
    timeout: z.number().min(1).max(3600),
    retryOnFailure: z.boolean(),
    maxRetries: z.number().min(0).max(10),
    retryDelay: z.number().min(0).max(3600),
    continueOnError: z.boolean(),
    waitForCompletion: z.boolean(),
    parallelExecution: z.boolean(),
  }),
  metadata: z.object({
    description: z.string().optional(),
    category: z.string(),
    version: z.string(),
    author: z.string(),
    icon: z.string().optional(),
    color: z.string().optional(),
    inputs: z.array(z.object({
      name: z.string(),
      type: z.enum(['string', 'number', 'boolean', 'object', 'array', 'file', 'date']),
      required: z.boolean(),
      default: z.unknown().optional(),
      description: z.string().optional(),
      validation: z.array(z.object({
        type: z.enum(['required', 'min', 'max', 'pattern', 'custom']),
        value: z.unknown(),
        message: z.string(),
      })).optional(),
    })),
    outputs: z.array(z.object({
      name: z.string(),
      type: z.enum(['string', 'number', 'boolean', 'object', 'array', 'file', 'date']),
      description: z.string().optional(),
    })),
    documentation: z.string().optional(),
    examples: z.array(z.object({
      title: z.string(),
      description: z.string(),
      input: z.record(z.unknown()),
      output: z.record(z.unknown()),
    })).optional(),
  }),
  status: z.nativeEnum(NodeStatus),
  errorMessage: z.string().optional(),
});

export const WorkflowConnectionSchema = z.object({
  id: z.string().uuid(),
  sourceNodeId: z.string().uuid(),
  targetNodeId: z.string().uuid(),
  sourceOutput: z.string(),
  targetInput: z.string(),
  conditions: z.array(z.object({
    type: z.enum(['expression', 'value', 'status']),
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'regex']),
    value: z.unknown(),
  })).optional(),
  metadata: z.object({
    label: z.string().optional(),
    description: z.string().optional(),
    color: z.string().optional(),
    style: z.enum(['solid', 'dashed', 'dotted']).optional(),
  }),
});

export const WorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  tenantId: z.string().uuid(),
  createdBy: z.string().uuid(),
  status: z.nativeEnum(WorkflowStatus),
  version: z.number().min(1),
  nodes: z.array(WorkflowNodeSchema),
  connections: z.array(WorkflowConnectionSchema),
  settings: z.object({
    timeout: z.number().min(1).max(3600),
    retryOnFailure: z.boolean(),
    maxRetries: z.number().min(0).max(10),
    retryDelay: z.number().min(0).max(3600),
    parallelExecution: z.boolean(),
    maxParallelExecutions: z.number().min(1).max(100),
    webhookEnabled: z.boolean(),
    webhookUrl: z.string().url().optional(),
    webhookMethod: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    webhookHeaders: z.record(z.string()).optional(),
    scheduleEnabled: z.boolean(),
    scheduleExpression: z.string().optional(),
    scheduleTimezone: z.string().optional(),
    notifications: z.object({
      onSuccess: z.boolean(),
      onFailure: z.boolean(),
      onTimeout: z.boolean(),
      channels: z.array(z.object({
        type: z.enum(['email', 'slack', 'webhook', 'sms']),
        config: z.record(z.unknown()),
      })),
      recipients: z.array(z.string()),
    }),
    variables: z.record(z.unknown()),
  }),
  tags: z.array(z.string()),
  isActive: z.boolean(),
  executionCount: z.number().min(0),
  lastExecutedAt: z.date().optional(),
  nextExecutionAt: z.date().optional(),
});