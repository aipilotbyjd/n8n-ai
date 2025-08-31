export interface NodeDefinition {
  type: string;
  name: string;
  description?: string;
  version: string;
  category: string;
  icon?: string;
  color?: string;
  inputs?: NodeInput[];
  outputs?: NodeOutput[];
  parameters?: NodeParameter[];
  credentials?: NodeCredential[];
  code?: string;
  metadata?: Record<string, any>;
}

export interface NodeInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  description?: string;
  default?: any;
}

export interface NodeOutput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
}

export interface NodeParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'select';
  required?: boolean;
  description?: string;
  default?: any;
  options?: any[];
}

export interface NodeCredential {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
}

export interface NodeExecutionContext {
  nodeId: string;
  executionId: string;
  workflowId: string;
  input: any;
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
  metadata?: Record<string, any>;
}