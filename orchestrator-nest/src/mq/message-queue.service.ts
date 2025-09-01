import { Injectable, Logger, Inject, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClientProxy } from "@nestjs/microservices";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { lastValueFrom, timeout, retry, catchError, throwError, of } from "rxjs";

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: Date | null;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

@Injectable()
export class MessageQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessageQueueService.name);
  private readonly circuitBreaker: CircuitBreakerState = {
    failures: 0,
    lastFailureTime: null,
    state: 'CLOSED'
  };
  
  private readonly maxFailures = 5;
  private readonly resetTimeout = 60000; // 1 minute
  private readonly requestTimeout = 30000; // 30 seconds
  private isShuttingDown = false;

  constructor(
    private configService: ConfigService,
    @Inject("ENGINE_SERVICE") private readonly engineClient: ClientProxy,
    @Inject("NODE_RUNNER_SERVICE") private readonly nodeRunnerClient: ClientProxy,
    private eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    try {
      await Promise.all([
        this.engineClient.connect(),
        this.nodeRunnerClient.connect()
      ]);
      this.logger.log('Message queue clients connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect message queue clients', error);
    }
  }

  async onModuleDestroy() {
    this.isShuttingDown = true;
    try {
      await Promise.all([
        this.engineClient.close(),
        this.nodeRunnerClient.close()
      ]);
      this.logger.log('Message queue clients closed successfully');
    } catch (error) {
      this.logger.error('Error closing message queue clients', error);
    }
  }

  async publishWorkflowExecution(workflowExecution: any): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error('Service is shutting down, cannot publish messages');
    }

    this.logger.log("Publishing workflow execution", {
      id: workflowExecution.id,
      workflowId: workflowExecution.workflowId,
    });

    try {
      await this.executeWithCircuitBreaker(async () => {
        const message$ = this.engineClient.emit("execute-workflow", workflowExecution).pipe(
          timeout(this.requestTimeout),
          retry({ count: 3, delay: 1000 }),
          catchError(error => {
            this.logger.error('Failed to publish workflow execution', error);
            return throwError(() => error);
          })
        );
        
        await lastValueFrom(message$);
      });

      this.logger.debug("Workflow execution message published successfully", {
        id: workflowExecution.id
      });

      // Emit local event for monitoring
      this.eventEmitter.emit('mq.message.published', {
        type: 'workflow_execution',
        id: workflowExecution.id,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error('Failed to publish workflow execution message', {
        id: workflowExecution.id,
        error: error.message
      });
      
      // Emit failure event for monitoring
      this.eventEmitter.emit('mq.message.failed', {
        type: 'workflow_execution',
        id: workflowExecution.id,
        error: error.message,
        timestamp: new Date(),
      });
      
      throw error;
    }
  }

  async publishNodeExecution(nodeExecution: any): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error('Service is shutting down, cannot publish messages');
    }

    this.logger.log("Publishing node execution", { 
      id: nodeExecution.id,
      nodeId: nodeExecution.nodeId 
    });

    try {
      await this.executeWithCircuitBreaker(async () => {
        const message$ = this.nodeRunnerClient.emit("execute-node", nodeExecution).pipe(
          timeout(this.requestTimeout),
          retry({ count: 3, delay: 1000 }),
          catchError(error => {
            this.logger.error('Failed to publish node execution', error);
            return throwError(() => error);
          })
        );
        
        await lastValueFrom(message$);
      });

      this.logger.debug("Node execution message published successfully", {
        id: nodeExecution.id
      });

    } catch (error) {
      this.logger.error('Failed to publish node execution message', {
        id: nodeExecution.id,
        error: error.message
      });
      throw error;
    }
  }

  async publishEvent(event: any): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error('Service is shutting down, cannot publish messages');
    }

    this.logger.log("Publishing event", { 
      type: event.type,
      id: event.id 
    });

    try {
      // Use appropriate client based on event type
      const client = event.type.startsWith('workflow') ? this.engineClient : this.nodeRunnerClient;
      
      await this.executeWithCircuitBreaker(async () => {
        const message$ = client.emit(event.type, event).pipe(
          timeout(this.requestTimeout),
          retry({ count: 2, delay: 500 }),
          catchError(error => {
            this.logger.warn('Failed to publish event, continuing gracefully', error);
            return of(null); // Don't throw for events
          })
        );
        
        await lastValueFrom(message$);
      });

      this.logger.debug("Event published successfully", { type: event.type });

    } catch (error) {
      this.logger.error('Failed to publish event', {
        type: event.type,
        error: error.message
      });
      // Don't throw for events - they should be fire-and-forget
    }
  }

  private async executeWithCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
    // Check circuit breaker state
    if (this.circuitBreaker.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - (this.circuitBreaker.lastFailureTime?.getTime() || 0);
      if (timeSinceLastFailure < this.resetTimeout) {
        throw new Error('Circuit breaker is OPEN - requests are blocked');
      } else {
        this.circuitBreaker.state = 'HALF_OPEN';
        this.logger.log('Circuit breaker moved to HALF_OPEN state');
      }
    }

    try {
      const result = await operation();
      
      // Reset circuit breaker on success
      if (this.circuitBreaker.state === 'HALF_OPEN') {
        this.circuitBreaker.state = 'CLOSED';
        this.circuitBreaker.failures = 0;
        this.circuitBreaker.lastFailureTime = null;
        this.logger.log('Circuit breaker reset to CLOSED state');
      }
      
      return result;
    } catch (error) {
      this.circuitBreaker.failures++;
      this.circuitBreaker.lastFailureTime = new Date();
      
      if (this.circuitBreaker.failures >= this.maxFailures) {
        this.circuitBreaker.state = 'OPEN';
        this.logger.error(`Circuit breaker opened after ${this.maxFailures} failures`);
      }
      
      throw error;
    }
  }

  getHealthStatus() {
    return {
      circuitBreaker: {
        state: this.circuitBreaker.state,
        failures: this.circuitBreaker.failures,
        lastFailureTime: this.circuitBreaker.lastFailureTime,
      },
      isShuttingDown: this.isShuttingDown,
    };
  }
}
