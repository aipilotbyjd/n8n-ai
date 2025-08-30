import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Node } from '@n8n-work/contracts';
import { ExecutionStateService } from '../state/execution-state.service';

@Injectable()
export class NodeDispatcherService {
  constructor(
    @Inject('NODE_EXECUTION_SERVICE') private readonly client: ClientProxy,
    private readonly executionStateService: ExecutionStateService,
  ) {}

  async dispatch(node: Node): Promise<any> {
    const executionState = await this.executionStateService.getAllResults();
    const message = { node, input: executionState };
    return this.client.send('execute-node', message).toPromise();
  }
}
