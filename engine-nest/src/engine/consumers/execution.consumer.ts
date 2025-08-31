import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { DagService } from '../dag/dag.service';
import { NodeDispatcherService } from '../dispatcher/node-dispatcher.service';
import { ExecutionStateService } from '../state/execution-state.service';
import { Workflow, ExecutionRequest, ExecutionState } from '@n8n-work/contracts';

@Controller()
export class ExecutionConsumer {
  constructor(
    private readonly configService: ConfigService,
    private readonly dagService: DagService,
    private readonly nodeDispatcherService: NodeDispatcherService,
    private readonly executionStateService: ExecutionStateService,
  ) {}

  @MessagePattern('execute-workflow')
  public async handleMessage(@Payload() data: ExecutionRequest) {
    console.log('Received execution job:', data);
    
    // Initialize execution state
    const executionState: ExecutionState = {
      executionId: data.workflowId, // Using workflowId as executionId for now
      workflowId: data.workflowId,
      status: 'running',
      progress: {
        totalSteps: 0,
        completedSteps: 0,
        failedSteps: 0,
        runningSteps: 0,
      },
      startedAt: new Date(),
      metadata: data.metadata,
      tenantId: data.tenantId,
    };

    await this.executionStateService.setExecutionState(executionState.executionId, executionState);

    try {
      // Parse workflow to get execution order
      const workflow = data.workflow as Workflow;
      const executionOrder = this.dagService.parseWorkflow(workflow);
      console.log('Execution plan:', executionOrder);

      // Update total steps
      executionState.progress.totalSteps = executionOrder.length;
      await this.executionStateService.updateExecutionState(executionState.executionId, {
        progress: executionState.progress,
      });

      // Execute nodes in order
      for (const nodeId of executionOrder) {
        const node = workflow.nodes.find(n => n.id === nodeId);
        if (!node) {
          console.error(`Node ${nodeId} not found in workflow`);
          continue;
        }

        // Update running steps
        executionState.progress.runningSteps++;
        await this.executionStateService.updateExecutionState(executionState.executionId, {
          progress: executionState.progress,
        });

        try {
          const result = await this.nodeDispatcherService.dispatchNode(
            executionState.executionId,
            nodeId,
            node,
            data.input || {}
          );

          // Update completed steps
          executionState.progress.runningSteps--;
          executionState.progress.completedSteps++;
          await this.executionStateService.updateExecutionState(executionState.executionId, {
            progress: executionState.progress,
          });

          console.log(`Node ${nodeId} execution result:`, result);
        } catch (error) {
          // Update failed steps
          executionState.progress.runningSteps--;
          executionState.progress.failedSteps++;
          await this.executionStateService.updateExecutionState(executionState.executionId, {
            progress: executionState.progress,
            error: error.message,
          });

          console.error(`Node ${nodeId} execution failed:`, error);
        }
      }

      // Mark execution as completed
      executionState.status = 'completed';
      executionState.finishedAt = new Date();
      await this.executionStateService.updateExecutionState(executionState.executionId, {
        status: executionState.status,
        finishedAt: executionState.finishedAt,
      });

      console.log('Workflow execution completed successfully');
    } catch (error) {
      // Mark execution as failed
      executionState.status = 'failed';
      executionState.error = error.message;
      executionState.finishedAt = new Date();
      await this.executionStateService.updateExecutionState(executionState.executionId, {
        status: executionState.status,
        error: executionState.error,
        finishedAt: executionState.finishedAt,
      });

      console.error('Workflow execution failed:', error);
    }
  }
}

