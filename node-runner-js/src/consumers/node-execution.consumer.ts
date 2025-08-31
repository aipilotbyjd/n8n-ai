import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NodeExecutorService } from '../services/node-executor.service';
import { NodeExecutionRequest, NodeExecutionResponse } from '@n8n-work/contracts';

@Controller()
export class NodeExecutionConsumer {
  constructor(private readonly nodeExecutorService: NodeExecutorService) {}

  @MessagePattern('execute-node')
  async handleNodeExecution(@Payload() data: NodeExecutionRequest): Promise<NodeExecutionResponse> {
    console.log('Received node execution request:', data);

    try {
      const result = await this.nodeExecutorService.execute(data.node, data.input);

      const response: NodeExecutionResponse = {
        executionId: data.executionId,
        nodeId: data.nodeId,
        status: 'completed',
        output: result,
        metadata: {
          ...data.metadata,
          executedAt: new Date().toISOString(),
        },
      };

      console.log('Node execution completed:', response);
      return response;
    } catch (error) {
      console.error('Node execution failed:', error);

      const response: NodeExecutionResponse = {
        executionId: data.executionId,
        nodeId: data.nodeId,
        status: 'failed',
        error: error.message,
        metadata: {
          ...data.metadata,
          executedAt: new Date().toISOString(),
          error: error.message,
        },
      };

      return response;
    }
  }
}
