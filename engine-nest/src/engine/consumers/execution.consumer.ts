import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { DagService } from '../dag/dag.service';
import { NodeDispatcherService } from '../dispatcher/node-dispatcher.service';
import { ExecutionStateService } from '../state/execution-state.service';

@Controller()
export class ExecutionConsumer {
  constructor(
    private readonly configService: ConfigService,
    private readonly dagService: DagService,
    private readonly nodeDispatcherService: NodeDispatcherService,
    private readonly executionStateService: ExecutionStateService,
  ) {}

  @MessagePattern('execute-workflow')
  public async handleMessage(@Payload() data: any) {
    console.log('Received execution job:', data);
    const executionPlan = this.dagService.parse(data.workflow);
    console.log('Execution plan:', executionPlan);

    for (const node of executionPlan) {
      const result = await this.nodeDispatcherService.dispatch(node);
      await this.executionStateService.setResult(node.id, result);
      console.log('Node execution result:', result);
    }

    console.log(
      'Final execution state:',
      await this.executionStateService.getAllResults(),
    );
  }
}

