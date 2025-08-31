export interface ExecutionRequest {
  workflowId: string;
  workflow: {
    id: string;
    nodes: Array<{
      id: string;
      type: string;
      data: any;
    }>;
    edges: Array<{
      source: string;
      target: string;
    }>;
  };
  input?: any;
  metadata?: Record<string, any>;
  tenantId?: string;
  userId?: string;
}

export interface ExecutionResponse {
  executionId: string;
  status: 'accepted' | 'rejected';
  message?: string;
}

export interface ExecutionState {
  executionId: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep?: string;
  progress: {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    runningSteps: number;
  };
  result?: any;
  error?: string;
  startedAt: Date;
  finishedAt?: Date;
  metadata?: Record<string, any>;
  tenantId?: string;
}

export interface NodeExecutionRequest {
  executionId: string;
  nodeId: string;
  node: {
    id: string;
    type: string;
    data: any;
  };
  input: any;
  metadata?: Record<string, any>;
}

export interface NodeExecutionResponse {
  executionId: string;
  nodeId: string;
  status: 'completed' | 'failed';
  output?: any;
  error?: string;
  metadata?: Record<string, any>;
}