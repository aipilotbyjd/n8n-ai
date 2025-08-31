export interface Node {
  id: string;
  type: string;
  name?: string;
  position?: {
    x: number;
    y: number;
  };
  data: {
    code?: string;
    parameters?: Record<string, any>;
    credentials?: Record<string, any>;
    [key: string]: any;
  };
  parameters?: Record<string, any>;
  credentials?: Record<string, any>;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  trigger?: Record<string, any>;
  scheduling?: Record<string, any>;
  version?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  tenantId?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  finishedAt?: Date;
  error?: string;
  result?: any;
  metadata?: Record<string, any>;
  tenantId?: string;
}

export interface NodeExecution {
  id: string;
  executionId: string;
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input?: any;
  output?: any;
  error?: string;
  startedAt: Date;
  finishedAt?: Date;
  metadata?: Record<string, any>;
}
