import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Node } from '@n8n-work/contracts';

@Injectable()
export class NodeDispatcherService {
  constructor(
    @Inject('NODE_EXECUTION_SERVICE') private readonly client: ClientProxy,
  ) {}

  dispatch(node: Node): Promise<any> {
    return this.client.send('execute-node', node).toPromise();
  }
}
