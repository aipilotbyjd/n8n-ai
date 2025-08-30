import { NodeExecutorService } from '../services/node-executor.service';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Node } from '@n8n-work/contracts';

@Controller()
export class NodeExecutionConsumer {
  constructor(private readonly nodeExecutorService: NodeExecutorService) {}

  @MessagePattern('execute-node')
  public async handleMessage(@Payload() data: { node: Node; input: any }) {
    console.log('Received node for execution:', data.node);
    console.log('Input data:', data.input);
    const result = await this.nodeExecutorService.execute(
      data.node,
      data.input,
    );
    console.log('Node execution result:', result);
    return result;
  }
}
