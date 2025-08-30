import { Injectable, Logger, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClientProxy } from "@nestjs/microservices";

@Injectable()
export class MessageQueueService {
  private readonly logger = new Logger(MessageQueueService.name);

  constructor(
    private configService: ConfigService,
    @Inject("ENGINE_SERVICE") private readonly client: ClientProxy,
  ) {}

  async publishWorkflowExecution(workflowExecution: any): Promise<void> {
    this.logger.log("Publishing workflow execution", {
      id: workflowExecution.id,
    });
    await this.client.emit("execute-workflow", workflowExecution).toPromise();
    this.logger.debug("Workflow execution message published:", workflowExecution);
  }

  async publishStepExecution(stepExecution: any): Promise<void> {
    this.logger.log("Publishing step execution", { id: stepExecution.id });
    // Implementation would connect to RabbitMQ and publish message
    // For now, just log the action
    this.logger.debug("Step execution message:", stepExecution);
  }

  async publishEvent(event: any): Promise<void> {
    this.logger.log("Publishing event", { type: event.type });
    // Implementation would connect to RabbitMQ and publish message
    // For now, just log the action
    this.logger.debug("Event message:", event);
  }
}
