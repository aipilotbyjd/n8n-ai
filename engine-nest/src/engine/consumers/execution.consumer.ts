import { ExecutionStateService } from '../state/execution-state.service';
import { NodeDispatcherService } from '../dispatcher/node-dispatcher.service';
import { DagService } from '../dag/dag.service';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Controller()
export class ExecutionConsumer {
  private readonly executionsQueue: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly dagService: DagService,
    private readonly nodeDispatcherService: NodeDispatcherService,
  ) {
    this.executionsQueue = this.configService.get<string>(
      'rabbitmq.queues.executions',
    );
  }

    constructor(
    private readonly configService: ConfigService,
    private readonly dagService: DagService,
    private readonly nodeDispatcherService: NodeDispatcherService,
    private readonly executionStateService: ExecutionStateService,
  ) {
    this.executionsQueue = this.configService.get<string>(
      'rabbitmq.queues.executions',
    );
  }

  public async handleMessage(@Payload() data: any) {
    console.log('Received execution job:', data);
    const executionPlan = this.dagService.parse(data.workflow);
    console.log('Execution plan:', executionPlan);

    for (const node of executionPlan) {
      const result = await this.nodeDispatcherService.dispatch(node);
      this.executionStateService.setResult(node.id, result);
      console.log('Node execution result:', result);
    }

    console.log('Final execution state:', this.executionStateService.getAllResults());
  }
}
