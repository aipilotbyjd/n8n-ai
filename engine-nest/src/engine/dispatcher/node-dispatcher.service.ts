import { Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Node, NodeExecutionRequest, NodeExecutionResponse } from '@n8n-work/contracts';

@Injectable()
export class NodeDispatcherService {
  constructor(private readonly nodeExecutionClient: ClientProxy) {}

  async dispatchNode(executionId: string, nodeId: string, node: Node, input: any): Promise<NodeExecutionResponse> {
    const request: NodeExecutionRequest = {
      executionId,
      nodeId,
      node: {
        id: node.id,
        type: node.type,
        data: node.data,
      },
      input,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };

    try {
      const response = await this.nodeExecutionClient.emit('execute-node', request).toPromise();
      return response as NodeExecutionResponse;
    } catch (error) {
      return {
        executionId,
        nodeId,
        status: 'failed',
        error: error.message,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  async dispatchNodes(executionId: string, nodes: Array<{ node: Node; input: any }>): Promise<NodeExecutionResponse[]> {
    const promises = nodes.map(({ node, input }) => 
      this.dispatchNode(executionId, node.id, node, input)
    );
    
    return Promise.all(promises);
  }
}
