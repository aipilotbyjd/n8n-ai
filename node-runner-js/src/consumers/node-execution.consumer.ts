import { NodeExecutorService } from '../services/node-executor.service';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Node } from '@n8n-work/contracts';

@Controller()
export class NodeExecutionConsumer {
  constructor(private readonly nodeExecutorService: NodeExecutorService) {}

  @MessagePattern('execute-node')
  public async handleMessage(@Payload() node: Node) {
    console.log('Received node for execution:', node);
    const result = await this.nodeExecutorService.execute(node);
    console.log('Node execution result:', result);
    return result;
  }
}
